package main

import (
	"fmt"
	"gowebview/clipboard"
	"gowebview/settings"
)

func A() { 
	fmt.Println("Hello from go, Rafael!")
}

func B() { 
	clip := clipboard.Clipboard{}
	set := settings.Settings{}
	text, err := clip.GetClipboardText()
	if err == nil { fmt.Println(text) }
	var title, err2 = clip.GetActiveWindowTitle()
	if err2 == nil { fmt.Println(title) }
	fmt.Println(set.GetConfig())
}