import os, sys
from typing import Dict
from flask import Flask, send_from_directory, Response, request
import requests
from http.client import HTTPResponse



def Headers(headers: Dict[str, str]): 
    default = { 
        "Accept": "*/*",
        "Accept-Language": "*",
        "Sec-Fetch-Mode": "cors",
        "User-Agent": "node",
        "Accept-Encoding": "gzip, deflate"
    }

    if isinstance(headers, dict):
        if "Content-Length" in headers: default["Content-Length"] = headers["Content-Length"]
        if "Authorization" in headers: default["Authorization"] = headers["Authorization"]
        if "Content-Type" in headers: default["Content-Type"] = headers["Content-Type"]
        if "Connection" in headers: default["Connection"] = headers["Connection"]

    return default



resource_path = sys._MEIPASS if "_MEIPASS" in dir(sys) else os.getcwd()
distDir = os.path.join(resource_path, 'dist')
server = Flask(__name__, static_folder= distDir)
PORT = 36567
print(distDir)
#os.system("dir "+distDir)

@server.route('/')
@server.route('/<route>')
def index(route: str= ""): 
    file = "index.html" if "." not in route else route
    return send_from_directory(server.static_folder, file)


@server.route('/assets/<name>')
def assets(name: str): return send_from_directory(server.static_folder, 'assets/'+name)



@server.route("/proxy", methods=['GET', 'POST'])
def proxy_client():
    #query = request.args
    url = request.headers.get('Url')
    if not url: return Response("Error: URL not provided in headers", status=400)
    headers = Headers(dict(request.headers))
    body = request.get_data()

    try:
        response = requests.request(method=request.method, url=url, headers=headers, data=body)
        content_type = response.headers.get('Content-Type', 'text/plain')
        
        if 'text/event-stream' in content_type:
            return Response(response.iter_content(chunk_size=1024), mimetype="text/event-stream")
        return Response(response.text, mimetype= content_type, status= response.status_code)


    except requests.RequestException as e: return Response(f"Request failed: {str(e)}", status=500)



def sse_client(response: HTTPResponse):
    while True:
        chunk = response.read().decode('utf-8')
        if not chunk: break
        yield chunk