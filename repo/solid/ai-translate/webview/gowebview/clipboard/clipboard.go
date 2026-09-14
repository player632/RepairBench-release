package clipboard

import (
	"fmt"
	"syscall"
	"unicode/utf16"
	"unsafe"

	"github.com/lxn/win"
)

type IClipboard interface { 
    GetClipboardText() (string, error)
    GetActiveWindowTitle() (string, error)
}

type Clipboard struct {}

func (C Clipboard) GetClipboardText() (string, error) {
    if !win.OpenClipboard(0) { return "", fmt.Errorf("could not open clipboard") }
    defer win.CloseClipboard()

    h := win.GetClipboardData(win.CF_UNICODETEXT)
    if h == 0 { return "", fmt.Errorf("could not get clipboard data") }

	hg := win.HGLOBAL(h)
    data := win.GlobalLock(hg)
    if data == nil { return "", fmt.Errorf("could not lock global memory") }
    defer win.GlobalUnlock(hg)

    text := syscall.UTF16ToString((*[1 << 20]uint16)(unsafe.Pointer(data))[:])
    return text, nil
}

func (C Clipboard) GetActiveWindowTitle() (string, error) { 
    //hwnd := win.GetForegroundWindow()
    user32 := syscall.NewLazyDLL("user32.dll")
    // pega a função "GetForegroundWindow" na dll
    procGetForegroundWindow := user32.NewProc("GetForegroundWindow")
    hwnd, _, _ := procGetForegroundWindow.Call()

    if hwnd == 0 { return "", fmt.Errorf("no active window found") }
	return getWindowText(hwnd), nil
}

func getWindowText(hwnd uintptr) string {
    // Define o tamanho máximo do título da janela
    const maxCount = 255
    buf := make([]uint16, maxCount)

    // Carrega a função GetWindowTextW da DLL user32
    user32 := syscall.NewLazyDLL("user32.dll")
    getWindowText := user32.NewProc("GetWindowTextW")

    // Chama a função GetWindowTextW
    // &buf[0]: pega o ponteiro para o primeiro item do array "buf"
    _, _, _ = getWindowText.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&buf[0])), uintptr(maxCount))

    // Converte UTF-16 para string
    return string(utf16.Decode(buf))
}