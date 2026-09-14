import webview, sys
from clipboard import Clipboard
from settings import SettingsApi
from xlsx import XLSX, os
from server import server, distDir, PORT
from window import get_screen_width
from typing import Tuple
#from binary_fs import FS, os



class Api(Clipboard, XLSX, SettingsApi):
    def OpenConfigWindow(self):
        port = PORT if os.path.exists(distDir) else "5173"
        window = webview.create_window("Settings", 
            js_api= Api(),
            url= f"http://localhost:{port}/settings",
            width= 750,
            height= 500
        )
        window.show()
        window.focus = True


def screen_res() -> Tuple[int]:
    return (350,650) if SettingsApi().GetConfig() is not None else (750,500)

if __name__ == "__main__":
    main_window = webview.create_window("AI Translate", 
        js_api= Api(),
        url= server if os.path.exists(distDir) else "http://localhost:5173/",
        http_port= PORT,
        width= screen_res()[0],
        height= screen_res()[1],
        y= 0,
        x= abs(get_screen_width()-screen_res()[0])
    )
    main_window.on_top = True

    webview.settings = { 
        'ALLOW_DOWNLOADS': False,
        "OPEN_EXTERNAL_LINKS_IN_BROWSER": False,
        'ALLOW_FILE_URLS': True,
        'OPEN_DEVTOOLS_IN_DEBUG': True,
    }

    webview.start(debug= '-debug' in sys.argv)



