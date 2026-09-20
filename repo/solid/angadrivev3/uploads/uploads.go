// Package uploads holds the shared chunk-store and file-assembly logic used
// by both the (legacy) HTTP upload handlers and the WebSocket upload
// transport. Chunks arrive gzipped and are stored decompressed on disk until
// the upload is finalized.
package uploads

import (
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"angadrive/database"
	"angadrive/globals"
)

const timeout = 5 * time.Minute

// ErrMissingChunks is returned by Finalize when some chunks of an upload were
// never received. Missing contains their zero-based indices.
type ErrMissingChunks struct {
	Missing []int
}

func (e *ErrMissingChunks) Error() string {
	return fmt.Sprintf("some chunks are missing: %v", e.Missing)
}

// ErrInvalidChunk signals a corrupt/undecodable chunk payload.
var ErrInvalidChunk = errors.New("invalid chunk payload")

var (
	uploadTimers   = make(map[string]*time.Timer)
	timerLock      sync.Mutex
	initializedDir string
)

// ChunkDir returns the directory used to stage in-flight upload chunks.
func ChunkDir() string {
	return globals.UPLOAD_DIR + "/tmp_chunks"
}

// InitChunkStore resets the staging directory at server startup.
func InitChunkStore() {
	initializedDir = ChunkDir()
	os.RemoveAll(initializedDir)
	os.MkdirAll(initializedDir, os.ModePerm)
}

// WriteChunk decompresses a gzipped chunk and stores it as
// <chunkDir>/<uploadID>/<index>.part.
func WriteChunk(uploadID string, index int, gzipped io.Reader) error {
	gzReader, err := gzip.NewReader(gzipped)
	if err != nil {
		return fmt.Errorf("%w: could not decompress chunk", ErrInvalidChunk)
	}
	defer gzReader.Close()

	uploadPath := filepath.Join(ChunkDir(), uploadID)
	if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create chunk directory: %w", err)
	}

	chunkPath := filepath.Join(uploadPath, fmt.Sprintf("%d.part", index))
	out, err := os.Create(chunkPath)
	if err != nil {
		return fmt.Errorf("failed to create chunk file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, gzReader); err != nil {
		return fmt.Errorf("failed to write chunk: %w", err)
	}

	ResetUploadTimer(uploadID)
	return nil
}

// ResetUploadTimer restarts the 5 minute inactivity timer for an upload.
func ResetUploadTimer(uploadID string) {
	timerLock.Lock()
	defer timerLock.Unlock()

	if timer, ok := uploadTimers[uploadID]; ok {
		timer.Reset(timeout)
	} else {
		uploadTimers[uploadID] = time.AfterFunc(timeout, func() {
			os.RemoveAll(filepath.Join(ChunkDir(), uploadID))
			timerLock.Lock()
			delete(uploadTimers, uploadID)
			timerLock.Unlock()
			fmt.Printf("Upload %s expired and deleted\n", uploadID)
		})
	}
}

// StopUploadTimer cancels a finalized upload's inactivity timer.
func StopUploadTimer(uploadID string) {
	timerLock.Lock()
	if timer, ok := uploadTimers[uploadID]; ok {
		timer.Stop()
		delete(uploadTimers, uploadID)
	}
	timerLock.Unlock()
}

// MissingChunks lists the indices of chunks that were never stored.
func MissingChunks(uploadID string, totalChunks int) []int {
	uploadPath := filepath.Join(ChunkDir(), uploadID)
	var missing []int
	for i := 0; i < totalChunks; i++ {
		chunkPath := filepath.Join(uploadPath, fmt.Sprintf("%d.part", i))
		if _, err := os.Stat(chunkPath); os.IsNotExist(err) {
			missing = append(missing, i)
		}
	}
	return missing
}

// FinalizeResult mirrors the response shape previously returned by the HTTP
// finalize endpoint.
type FinalizeResult struct {
	Message       string `json:"message"`
	FileName      string `json:"fileName"`
	FileDirectory string `json:"fileDirectory"`
	AccessPath    string `json:"accessPath"`
}

// Finalize validates that every chunk is present, assembles them into the
// final content-addressed file, inserts the database record and cleans up the
// staging directory. Collection assignment and websocket pulses are handled by
// the caller.
func Finalize(uploadID string, totalChunks int, originalFileName, accountToken string) (*FinalizeResult, error) {
	if originalFileName == "" {
		return nil, errors.New("missing originalFileName")
	}
	if totalChunks < 0 {
		return nil, errors.New("invalid totalChunks")
	}

	uploadPath := filepath.Join(ChunkDir(), uploadID)
	if missing := MissingChunks(uploadID, totalChunks); len(missing) > 0 {
		return nil, &ErrMissingChunks{Missing: missing}
	}

	finalDestDir := filepath.Join(globals.UPLOAD_DIR, "i")
	if err := os.MkdirAll(finalDestDir, os.ModePerm); err != nil {
		return nil, errors.New("failed to create destination directory")
	}

	// Create a temporary file first, we'll rename it after calculating the hash.
	tempFile, err := os.CreateTemp(finalDestDir, "upload-*.tmp")
	if err != nil {
		return nil, errors.New("failed to create temporary file")
	}
	defer os.Remove(tempFile.Name()) // cleaned up on error paths; no-op after rename

	for i := 0; i < totalChunks; i++ {
		chunkPath := filepath.Join(uploadPath, fmt.Sprintf("%d.part", i))
		chunkFile, err := os.Open(chunkPath)
		if err != nil {
			tempFile.Close()
			return nil, fmt.Errorf("failed to open chunk %d: %w", i, err)
		}
		_, err = io.Copy(tempFile, chunkFile)
		chunkFile.Close()
		if err != nil {
			tempFile.Close()
			return nil, fmt.Errorf("failed to copy chunk %d: %w", i, err)
		}
	}

	// Calculate SHA-256 hash of the assembled file.
	tempFile.Seek(0, 0)
	hash := sha256.New()
	if _, err := io.Copy(hash, tempFile); err != nil {
		tempFile.Close()
		return nil, errors.New("failed to calculate SHA-256 hash")
	}
	sha256sum := hex.EncodeToString(hash.Sum(nil))

	fileInfo, err := tempFile.Stat()
	if err != nil {
		tempFile.Close()
		return nil, errors.New("failed to get final file stats")
	}
	fileSize := fileInfo.Size()

	finalFilePath := filepath.Join(finalDestDir, sha256sum+filepath.Ext(originalFileName))
	tempFile.Close()
	if err := os.Rename(tempFile.Name(), finalFilePath); err != nil {
		return nil, errors.New("failed to rename temporary file")
	}

	uniqueFileName := database.GenerateUniqueFileName(originalFileName)
	fileData := database.FileData{
		OriginalFileName: originalFileName,
		FileDirectory:    uniqueFileName,
		AccountToken:     accountToken,
		FileSize:         fileSize,
		Timestamp:        time.Now().Unix(),
		Sha256sum:        sha256sum + filepath.Ext(originalFileName),
	}

	if err := fileData.Insert(); err != nil {
		os.Remove(finalFilePath)
		return nil, fmt.Errorf("failed to insert file metadata: %w", err)
	}

	StopUploadTimer(uploadID)
	if err := os.RemoveAll(uploadPath); err != nil {
		fmt.Printf("Warning: Failed to remove chunk directory %s: %v\n", uploadPath, err)
	}

	return &FinalizeResult{
		Message:       "Upload successful and file assembled",
		FileName:      uniqueFileName,
		FileDirectory: uniqueFileName,
		AccessPath:    fmt.Sprintf("/i/%s", uniqueFileName),
	}, nil
}

// ParseChunkIndex decodes a textual chunk index (used by legacy callers).
func ParseChunkIndex(s string) (int, error) {
	return strconv.Atoi(s)
}
