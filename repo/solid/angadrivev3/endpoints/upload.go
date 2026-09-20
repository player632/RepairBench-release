package endpoints

// This file keeps the legacy HTTP chunked-upload endpoints working. The
// primary upload transport is now WebSocket based (see
// requestHandler/uploadws.go); both paths share the chunk store and finalize
// logic in the uploads package.

import (
	"fmt"

	"angadrive/accounts"
	"angadrive/database"
	"angadrive/requestHandler"
	"angadrive/uploads"

	"github.com/gin-gonic/gin"
)

func handleChunkUpload(c *gin.Context) {
	uploadID := c.Param("uuid")
	chunkIndexStr := c.PostForm("chunkIndex")

	file, _, err := c.Request.FormFile("chunk")
	if err != nil {
		c.String(400, "Missing chunk")
		return
	}
	defer file.Close()

	chunkIndex, err := uploads.ParseChunkIndex(chunkIndexStr)
	if err != nil {
		c.String(400, "Invalid chunkIndex")
		return
	}

	if err := uploads.WriteChunk(uploadID, chunkIndex, file); err != nil {
		c.String(400, "Could not decompress chunk. Make sure it's gzipped.")
		return
	}

	c.String(200, "Chunk received")
}

func finalizeUpload(c *gin.Context) {
	uploadID := c.Param("uuid")
	totalChunksStr := c.PostForm("totalChunks")
	originalFileName := c.PostForm("originalFileName")
	collectionID := c.PostForm("collectionId")

	userToken := c.PostForm("token")
	email := c.PostForm("email")
	password := c.PostForm("password")

	accountToken, authErr := resolveUploadAuth(email, password, userToken)
	if authErr != nil {
		c.String(authErr.status, authErr.message)
		return
	}

	totalChunks, err := uploads.ParseChunkIndex(totalChunksStr)
	if err != nil {
		c.String(400, "Invalid totalChunks")
		return
	}

	result, err := uploads.Finalize(uploadID, totalChunks, originalFileName, accountToken)
	if err != nil {
		var missing *uploads.ErrMissingChunks
		switch {
		case err.Error() == "missing originalFileName":
			c.String(400, err.Error())
		case err.Error() == "invalid totalChunks":
			c.String(400, err.Error())
		case asMissingChunks(err, &missing):
			c.JSON(400, gin.H{"missingChunks": missing.Missing, "message": "Some chunks are missing"})
			// Do not delete timer here, allow re-upload of missing chunks or timeout
		default:
			c.String(500, err.Error())
		}
		return
	}

	// If a collection ID is provided, add the file to the collection
	if collectionID != "" {
		addReq := requestHandler.AddFileToCollectionRequest{
			CollectionID:  collectionID,
			FileDirectory: result.FileDirectory,
			Auth:          requestHandler.AuthInfo{Token: accountToken},
		}
		if _, err := requestHandler.AddFileToCollection(addReq); err != nil {
			// Log this error, but don't fail the entire upload.
			fmt.Printf("Warning: Failed to add file %s to collection %s: %v\n", result.FileDirectory, collectionID, err)
		}
	}

	broadcastUploadSuccess(accountToken, result.FileDirectory)

	c.JSON(200, result)
}

type uploadAuthError struct {
	status  int
	message string
}

func resolveUploadAuth(email, password, userToken string) (string, *uploadAuthError) {
	if email != "" && password != "" {
		if accounts.Authenticate(email, password) {
			user, err := database.FindUserByEmail(email)
			if err != nil {
				return "", &uploadAuthError{401, "Authentication successful but failed to retrieve user details"}
			}
			return user.Token, nil
		}
		return "", &uploadAuthError{401, "Invalid email or password"}
	}
	if userToken != "" {
		return userToken, nil
	}
	return "", &uploadAuthError{400, "Missing authentication details (token or email/password)"}
}

func asMissingChunks(err error, target **uploads.ErrMissingChunks) bool {
	if m, ok := err.(*uploads.ErrMissingChunks); ok {
		*target = m
		return true
	}
	return false
}

// broadcastUploadSuccess pushes the file_update pulse after any successful
// upload (HTTP or WebSocket).
func broadcastUploadSuccess(accountToken, fileDirectory string) {
	if fileData, err := database.GetFile(fileDirectory); err == nil {
		var FileUpdate requestHandler.FileUpdate
		FileUpdate.File = fileData
		FileUpdate.Toggle = true
		go requestHandler.UserFilesPulse(FileUpdate)
	} else {
		fmt.Printf("Warning: failed to load uploaded file %s for pulse: %v\n", fileDirectory, err)
	}
	go requestHandler.UpdateUserCount()
}

func setupUploaderRoutes(r *gin.Engine) {
	uploads.InitChunkStore()

	r.POST("/upload/:uuid", handleChunkUpload)
	r.POST("/upload/success/:uuid", finalizeUpload)
}
