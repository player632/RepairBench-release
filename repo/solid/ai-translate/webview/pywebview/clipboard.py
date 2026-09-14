import win32gui, pyperclip


class Clipboard:
    def GetActiveWindowTitle(self) -> str:
        # Obter o identificador da janela ativa
        hwnd = win32gui.GetForegroundWindow()
        # Obter o título da janela usando o identificador
        title = win32gui.GetWindowText(hwnd)
        return title


    def GetClipboardText(self) -> str: 
        try: return pyperclip.paste()
        except: return self.GetClipboardText()