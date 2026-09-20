package requestHandler

// WebSocket upload transport.
//
// The frontend maintains a global pool of three persistent WebSocket
// connections to /ws/upload, shared by every upload the user starts. A single
// connection can join MULTIPLE upload sessions at once (one per file), so
// there is no longer a one-connection-per-file mapping. The protocol is
// frame-based:
//
//   - Text frames carry JSON control messages ({type, data}).
//     Client -> server: init, finalize, cancel
//     Server -> client: init_ack, chunk_ack, chunk_error, finalize_response,
//     error
//   - Binary frames carry chunk payloads:
//     [36-byte ASCII upload_id][4-byte BE chunk index][gzip payload]
//
// Every chunk-related reply (chunk_ack/chunk_error) echoes the upload_id so a
// pooled connection can attribute acks to the right session.
//
// Sessions remain independent: finalize validates a single upload_id, and
// removing one session never affects the other sessions a connection has
// joined.

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"unicode/utf8"

	"angadrive/database"
	"angadrive/globals"
	"angadrive/uploads"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WS_UPLOAD_CONNECTIONS is the number of WebSocket connections the frontend's
// global upload pool keeps open. It is used by the frontend; documented here
// for reference.
const WS_UPLOAD_CONNECTIONS = 3

// uploadIDLen is the length (in ASCII bytes) of a valid upload_id. The
// frontend sends crypto.randomUUID() values, which are 36-char lowercased
// hex UUIDs. Keeping the length fixed means a binary frame can be attributed
// to its session without any framing ambiguity.
const uploadIDLen = 36

type wsUploadInitRequest struct {
	UploadID string   `json:"upload_id"`
	Auth     AuthInfo `json:"auth"`
}

type wsUploadFinalizeRequest struct {
	UploadID         string   `json:"upload_id"`
	TotalChunks      int      `json:"total_chunks"`
	OriginalFileName string   `json:"original_file_name"`
	CollectionID     string   `json:"collection_id,omitempty"`
	Auth             AuthInfo `json:"auth"`
}

// uploadServer manages the per-upload state shared by all connections of one
// upload session. One connection may belong to many sessions at once.
type uploadServer struct {
	uploadID string
	connMu   sync.Mutex
	// conns tracks every connection that has joined this session. It is used
	// only to decide which connections may receive replies bound to this
	// session (finalize_response, chunk acks carry upload_id so clients can
	// attribute them themselves).
	conns map[*websocket.Conn]bool
}

// connUploadState is the per-connection state maintained for a pooled upload
// socket: the set of sessions the socket has joined.
type connUploadState struct {
	mu     sync.Mutex
	joined map[string]*uploadServer // upload_id -> session
}

var (
	uploadSessions   = make(map[string]*uploadServer)
	uploadSessionsMu sync.Mutex
)

func getOrCreateUploadSession(uploadID string) *uploadServer {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()
	s, ok := uploadSessions[uploadID]
	if !ok {
		s = &uploadServer{uploadID: uploadID, conns: make(map[*websocket.Conn]bool)}
		uploadSessions[uploadID] = s
	}
	return s
}

func removeUploadSession(uploadID string) {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()
	delete(uploadSessions, uploadID)
}

func (s *uploadServer) addConn(conn *websocket.Conn) {
	s.connMu.Lock()
	s.conns[conn] = true
	s.connMu.Unlock()
}

func (s *uploadServer) removeConn(conn *websocket.Conn) {
	s.connMu.Lock()
	delete(s.conns, conn)
	s.connMu.Unlock()
}

func (s *uploadServer) sendJSON(conn *websocket.Conn, v interface{}) {
	s.connMu.Lock()
	defer s.connMu.Unlock()
	if _, ok := s.conns[conn]; !ok {
		return
	}
	if err := conn.WriteJSON(v); err != nil {
		fmt.Printf("Upload WS write error: %v\n", err)
	}
}

// isValidUploadID reports whether s is a plausible upload_id. The frontend
// generates crypto.randomUUID() ids (36 ASCII chars), and frame parsing
// relies on the fixed 36-byte prefix, so anything else is rejected.
func isValidUploadID(s string) bool {
	if len(s) != uploadIDLen {
		return false
	}
	if !utf8.ValidString(s) {
		return false
	}
	for _, r := range s {
		if !(r >= 'a' && r <= 'f') && !(r >= '0' && r <= '9') && r != '-' {
			return false
		}
	}
	return true
}

// SetupUploadWebsocket registers the /ws/upload route on the Gin engine.
func SetupUploadWebsocket(r *gin.Engine) {
	r.GET("/ws/upload", func(c *gin.Context) {
		if c.Request.Host != globals.WebURL {
			c.JSON(http.StatusForbidden, gin.H{"error": "Websocket connection not allowed from this host"})
			return
		}
		upgrader := websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		}
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade to websocket"})
			return
		}
		defer conn.Close()
		handleUploadConnection(conn)
	})
}

func handleUploadConnection(conn *websocket.Conn) {
	state := &connUploadState{
		joined: make(map[string]*uploadServer),
	}

	defer func() {
		// Unjoin from every session this connection belonged to. The socket
		// itself stays owned by the caller (pooled sockets are not closed
		// here); this just prevents any further replies going to it.
		state.mu.Lock()
		for uploadID, s := range state.joined {
			s.removeConn(conn)
			delete(state.joined, uploadID)
		}
		state.mu.Unlock()
		conn.Close()
	}()

	for {
		messageType, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}

		switch messageType {
		case websocket.TextMessage:
			var message globals.IncomingMessage
			if err := json.Unmarshal(msg, &message); err != nil {
				continue
			}
			done := handleUploadControlMessage(conn, state, message.Type, message.Data)
			if done {
				return
			}

		case websocket.BinaryMessage:
			// Frame layout: [36-byte ASCII upload_id][4-byte BE chunk index][payload]
			if len(msg) < uploadIDLen+4 {
				sendUploadError(conn, "binary frame too short")
				continue
			}
			uploadID := string(msg[:uploadIDLen])
			if !isValidUploadID(uploadID) {
				sendUploadError(conn, "binary frame carries an invalid upload_id")
				continue
			}
			chunkIndex := int(binary.BigEndian.Uint32(msg[uploadIDLen : uploadIDLen+4]))
			// The connection must have joined this session with valid auth.
			state.mu.Lock()
			s, ok := state.joined[uploadID]
			state.mu.Unlock()
			if !ok {
				sendUploadError(conn, "binary frame references an upload_id this connection has not joined")
				continue
			}
			reader := bytes.NewReader(msg[uploadIDLen+4:])
			if err := uploads.WriteChunk(s.uploadID, chunkIndex, reader); err != nil {
				s.sendJSON(conn, globals.OutgoingResponse{
					Type: "chunk_error",
					Data: map[string]interface{}{
						"upload_id":   s.uploadID,
						"chunk_index": chunkIndex,
						"error":       err.Error(),
					},
				})
				continue
			}
			s.sendJSON(conn, globals.OutgoingResponse{
				Type: "chunk_ack",
				Data: map[string]interface{}{
					"upload_id":   s.uploadID,
					"chunk_index": chunkIndex,
				},
			})
		}
	}
}

// handleUploadControlMessage processes a JSON control message. It returns true
// when the connection should be closed.
func handleUploadControlMessage(conn *websocket.Conn, state *connUploadState, msgType string, rawData interface{}) bool {
	raw, _ := json.Marshal(rawData)

	switch msgType {
	case "init":
		var req wsUploadInitRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			sendUploadError(conn, "invalid init request")
			return false
		}
		if !isValidUploadID(req.UploadID) {
			sendUploadError(conn, "missing or invalid upload_id")
			return false
		}
		if _, err := req.Auth.GetToken(); err != nil {
			sendUploadError(conn, err.Error())
			return false
		}
		uploadID := req.UploadID
		s := getOrCreateUploadSession(uploadID)
		s.addConn(conn)

		state.mu.Lock()
		state.joined[uploadID] = s
		state.mu.Unlock()

		uploads.ResetUploadTimer(uploadID)
		conn.WriteJSON(globals.OutgoingResponse{
			Type: "init_ack",
			Data: map[string]string{"upload_id": uploadID},
		})
		return false

	case "finalize":
		var req wsUploadFinalizeRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			sendUploadError(conn, "invalid finalize request")
			return false
		}
		token, err := req.Auth.GetToken()
		if err != nil {
			if isValidUploadID(req.UploadID) {
				// Attach errors to the right session even if auth failed.
				if s := lookupSession(req.UploadID); s != nil {
					s.sendJSON(conn, globals.OutgoingResponse{Type: "error", Data: err.Error()})
				}
			} else {
				sendUploadError(conn, err.Error())
			}
			return false
		}

		var s *uploadServer
		if req.UploadID != "" {
			if ls := lookupSession(req.UploadID); ls != nil {
				s = ls
			}
		}
		if s == nil {
			sendUploadError(conn, "no active upload session")
			return false
		}

		// The connection must have joined this session (with auth) to
		// finalize it.
		state.mu.Lock()
		_, joined := state.joined[req.UploadID]
		state.mu.Unlock()
		if !joined {
			sendUploadError(conn, "this connection has not joined the upload session")
			return false
		}

		result, ferr := uploads.Finalize(s.uploadID, req.TotalChunks, req.OriginalFileName, token)
		if ferr != nil {
			var missing *uploads.ErrMissingChunks
			if asUploadMissingChunks(ferr, &missing) {
				s.sendJSON(conn, globals.OutgoingResponse{
					Type: "finalize_response",
					Data: map[string]interface{}{
						"success":       false,
						"missingChunks": missing.Missing,
						"message":       "Some chunks are missing",
					},
				})
			} else {
				s.sendJSON(conn, globals.OutgoingResponse{
					Type: "finalize_response",
					Data: map[string]interface{}{"success": false, "message": ferr.Error()},
				})
			}
			// Keep the socket pooled: the connection can still serve other
			// sessions, and the failed session is cleaned up below.
			unjoinUploadState(state, conn, s.uploadID)
			return false
		}

		if req.CollectionID != "" {
			addReq := AddFileToCollectionRequest{
				CollectionID:  req.CollectionID,
				FileDirectory: result.FileDirectory,
				Auth:          AuthInfo{Token: token},
			}
			if _, err := AddFileToCollection(addReq); err != nil {
				fmt.Printf("Warning: Failed to add file %s to collection %s: %v\n", result.FileDirectory, req.CollectionID, err)
			}
		}

		broadcastUploadSuccessWS(token, result.FileDirectory)

		s.sendJSON(conn, globals.OutgoingResponse{
			Type: "finalize_response",
			Data: map[string]interface{}{
				"success":       true,
				"message":       result.Message,
				"fileName":      result.FileName,
				"fileDirectory": result.FileDirectory,
				"accessPath":    result.AccessPath,
			},
		})
		removeUploadSession(s.uploadID)
		unjoinUploadState(state, conn, s.uploadID)
		// Do NOT close the socket: it is pooled and may be carrying other
		// sessions. Returning false keeps the read loop alive.
		return false

	case "cancel":
		var req wsUploadCancelRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			sendUploadError(conn, "invalid cancel request")
			return false
		}
		// With an upload_id, cancel that session; without one, cancel every
		// session this connection has joined.
		if isValidUploadID(req.UploadID) {
			state.mu.Lock()
			s, ok := state.joined[req.UploadID]
			state.mu.Unlock()
			if ok {
				os.RemoveAll(filepath.Join(uploads.ChunkDir(), s.uploadID))
				removeUploadSession(s.uploadID)
				unjoinUploadState(state, conn, s.uploadID)
			}
		} else {
			state.mu.Lock()
			ids := make([]string, 0, len(state.joined))
			for id := range state.joined {
				ids = append(ids, id)
			}
			state.mu.Unlock()
			for _, id := range ids {
				if session := lookupSession(id); session != nil {
					os.RemoveAll(filepath.Join(uploads.ChunkDir(), session.uploadID))
					removeUploadSession(session.uploadID)
				}
				unjoinUploadState(state, conn, id)
			}
		}
		// Keep the socket alive: it remains usable for other sessions.
		return false
	}

	sendUploadError(conn, fmt.Sprintf("unknown upload message type: %s", msgType))
	return false
}

// unjoinUploadState removes the connection from the given session's conn set
// and drops the session from the connection's joined map.
func unjoinUploadState(state *connUploadState, conn *websocket.Conn, uploadID string) {
	state.mu.Lock()
	if s, ok := state.joined[uploadID]; ok {
		s.removeConn(conn)
	}
	delete(state.joined, uploadID)
	state.mu.Unlock()
}

type wsUploadCancelRequest struct {
	UploadID string `json:"upload_id,omitempty"`
}

func sendUploadError(conn *websocket.Conn, message string) {
	conn.WriteJSON(globals.OutgoingResponse{Type: "error", Data: message})
}

func lookupSession(uploadID string) *uploadServer {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()
	return uploadSessions[uploadID]
}

func asUploadMissingChunks(err error, target **uploads.ErrMissingChunks) bool {
	if m, ok := err.(*uploads.ErrMissingChunks); ok {
		*target = m
		return true
	}
	return false
}

// broadcastUploadSuccessWS pushes the file_update pulse after a WebSocket
// upload completes.
func broadcastUploadSuccessWS(accountToken, fileDirectory string) {
	if fileData, err := database.GetFile(fileDirectory); err == nil {
		var FileUpdate FileUpdate
		FileUpdate.File = fileData
		FileUpdate.Toggle = true
		go UserFilesPulse(FileUpdate)
	} else {
		fmt.Printf("Warning: failed to load uploaded file %s for pulse: %v\n", fileDirectory, err)
	}
	go UpdateUserCount()
}
