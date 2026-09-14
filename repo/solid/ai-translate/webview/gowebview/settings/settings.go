package settings

import (
	"fmt"
	"os"
	"os/exec"
	"path"
	"syscall"
)

type ISettings interface {
	OpenConfigDir() error
	GetConfig() string
	SaveConfig(content string)
}

type Settings struct{}

var APPDATA = os.Getenv("appdata")
var appDir = path.Join(APPDATA, "ai-translate")
var configFilePath = path.Join(appDir, "config.json")

func (S Settings) OpenConfigDir() error {
	cmd := exec.Command("explorer " + appDir)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Start()
}

func (S Settings) GetConfig() string {
	file, err := os.ReadFile(configFilePath)

	if err != nil {
		fmt.Println(err)
		return ""
	}
	return string(file)
}

func (S Settings) SaveConfig(content string) {
	file, err := os.OpenFile(configFilePath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err == nil {
		file.WriteString(content)
	}
}
