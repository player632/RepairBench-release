import os, json
import subprocess
from typing import Dict, Union



APPDATA = os.getenv("appdata")

class Config:
    wsServerUrl: str
    providers: Dict[str, Union[str, dict]]

    def __init__(self, kargs: Dict[str, Union[str, Dict]]):
        for key, value in kargs.items():
            setattr(self, key, value)


class SettingsApi:
    config: Union[Config, None]
    _configDir = os.path.join(APPDATA, "ai-translate")

    def GetConfig(self):
        if os.path.exists(self._configDir):
            with open(os.path.join(self._configDir, "config.json"), encoding= "utf-8", mode= "r") as file:
                try: return json.load(file)
                except: print("Error while reading json!")


    def SaveConfig(self, dic):
        if isinstance(dic, dict):
            if len(dic.keys()):
                if not os.path.exists(self._configDir): os.makedirs(self._configDir)
                with open(os.path.join(self._configDir, "config.json"), encoding= "utf-8", mode= "w") as file: json.dump(dic, file)


    def OpenConfigDir(self): 
        if os.path.exists(self._configDir) and os.path.isdir(self._configDir):
            subprocess.Popen(f"explorer {self._configDir}", creationflags= subprocess.CREATE_NO_WINDOW)

