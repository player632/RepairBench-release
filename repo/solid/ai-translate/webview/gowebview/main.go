package main

import (
	"gowebview/app"
	"gowebview/server"
)

func main() { 
	go server.Listen(5173)
	myApp := app.NewWithOptions(app.AppOptions{ 
		AlwaysOnTop: true,
	})
	defer myApp.Window.Terminate()


	myApp.Window.Navigate("http://localhost:5173/")
	myApp.Window.Run()
}

