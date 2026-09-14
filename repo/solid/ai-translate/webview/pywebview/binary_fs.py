import os


APPDATA = os.getenv("appdata")


class FS:
    def readBinary(self, fileName: str) -> str:
        filePath = os.path.join(APPDATA, 'ai-translate', fileName)
        if os.path.exists(filePath): 
            with open(filePath, 'rb') as file: return file.read().decode('latin1')

    def writeBinary(self, fileName: str, textFile: str):
        if isinstance(textFile, str) and isinstance(fileName, str): 
            filePath = os.path.join(APPDATA, 'ai-translate', fileName)
            textFileBinary = textFile.encode('latin1')
            with open(filePath, 'wb') as file: file.write(textFileBinary)

