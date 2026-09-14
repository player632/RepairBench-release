package server

import (
	"embed"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

//go:embed dist/*
var staticFiles embed.FS

func Listen(port int) { 
	portStr := strconv.Itoa(port)
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	contentHandler := echo.WrapHandler(http.FileServer(http.FS(staticFiles)))
	contentRewrite := middleware.Rewrite(map[string]string{ 
		"/*": "/dist/$1",
	})

	e.GET("/*", contentHandler, contentRewrite)
	go e.Logger.Fatal( e.Start(":"+portStr) )
}


/* e.GET("/", IndexHandler)
e.GET("/:filename", StaticFilesHandler) */

func IndexHandler(c echo.Context) error { 
	file, err := staticFiles.ReadFile("dist/index.html")
	if err == nil { return c.HTML(http.StatusAccepted, string(file)) }
	return c.JSON(http.StatusInternalServerError, map[string]string{"message": "error getting the page"})
}

func StaticFilesHandler(c echo.Context) error { 
	url := c.Request().URL.Path
	c.Response().Header().Set("Content-Type", GetMIME(url))
	fileName := c.Param("filename")
	file, err := staticFiles.ReadFile("dist/"+fileName)
	if err == nil { return c.String(http.StatusAccepted, string(file)) }
	return c.JSON(http.StatusInternalServerError, map[string]string{"message": "error getting asset"})
}

func GetMIME(fileUrl string) string { 
	if strings.HasSuffix(fileUrl, ".js") { 
		return "application/javascript" 
	} else if strings.HasSuffix(fileUrl, ".css") { 
		return "text/css"
	} else { return "text/plain" }

}