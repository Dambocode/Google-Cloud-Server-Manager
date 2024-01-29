from flask import Flask, request, render_template, redirect, Response
from src.GoogleCloud import GoogleCloud
from src.Log import Log
import os
import json
from queue import Queue
import time

app = Flask(__name__)

log = Log(app)

def console_logger(message, instance_name=None, zone=None, ssh_username=None):
    readable_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
    text = message
    message = f"{readable_time}"
    if ssh_username:
        message += f" - {ssh_username}"
    if instance_name:
        message += f"@{instance_name}"
    if zone:
        message += f" - {zone}"
    message += f" | {text}"
    log.log_and_notify(message)

gc = GoogleCloud(console_logger=console_logger)

def checkLogin():
    try:
        path = os.getenv('APPDATA')
        with open(path + "\\gcloud\\application_default_credentials.json", 'r') as f:
            credentials_data = f.read()
            credentials_data = json.loads(credentials_data)
            # print(credentials_data)
            if "client_id" in credentials_data:
                return True
            else:
                return False
    except:
        return False
    
@app.route('/')
def index():
    
    # if checkLogin() == True:
        # load projects
        # gc.load_projects()
    with open('config/login.json', 'r') as f:
        data = f.read()
        data = json.loads(data)
    
        
    return render_template('index.html', project_id=data["project_id"], instances=gc.load_instances())  # The HTML file name

@app.route('/api/createInstance', methods=['POST'])
def create_server():
    
    data = request.form.to_dict()
    
    instance_name = f"{data['game']}-{data['serverType']}-{data['instanceName']}".lower().replace(" ", "-")
    
    if "@" in data["username"]:
        ssh_username = data["username"].split("@")[0]
    else:
        ssh_username = data["username"]
    
    # print(data)
    zone_data = f'{data["region"]}-{data["zone"]}'
    console_logger("Creating instance", instance_name=instance_name, zone=zone_data, ssh_username=ssh_username)

    # gc.create_instance(console_logger=console_logger, machine_type=data["machineType"], instance_name=instance_name, zone=zone_data)

    
    gc.upload_file_to_instance(instance_name=instance_name, ssh_username=ssh_username, zone=zone_data, file=data["mod"], serverType=data["serverType"], remote_path=f"{data['serverType']}_{data['game']}")

    # print(response)
    # response = gc.create_instance(machine_type=data["machine_type"], instance_name=data["instanceName"], zone=zone_data, ssh_username=data["username"])
    return redirect('/')  # Redirect after processing
    # Process the data as needed
    # return redirect('/home')  # Redirect after processing

@app.route('/api/loadInstances', methods=['GET'])
def loadInstances():
    console_logger("Loading Instances")
    gc.load_instances()
    return gc.instances

@app.route('/api/login', methods=['GET'])
def login():
    gc.authenticate()
    gc
    # check if authenticated
    if checkLogin() != True:
        return redirect('/login')

@app.route('/api/stopInstance', methods=['GET'])
def stopInstance():
    params = request.args.to_dict()
    instance_name = params["instanceName"]
    gc.stop_instance(instance_name)
    return "Successfully stopped"

@app.route('/api/startInstance', methods=['GET'])
def startInstance():
    params = request.args.to_dict()
    # print(params)
    instance_name = params["instanceName"]
    gc.start_instance(instance_name=instance_name)
    return "Successfully started"

@app.route('/api/saveFile', methods=['POST'])
def saveFile():
    uploaded_files = request.files["fileUpload"]
    params = request.args.to_dict()
    mod_type = params["type"]
    uploaded_files.save(f"files/{mod_type}/{uploaded_files.filename}")

@app.route('/api/getMods', methods=['GET'])
def getMods():
    params = request.args.to_dict()
    mod_type = params["type"]
    print(f"Getting mods for {mod_type}")
    # print(os.listdir(f"mods/forge"))
    print(os.listdir(f"mods/{mod_type}"))
    return os.listdir(f"mods/{mod_type}")
    
    
@app.route('/api/saveMod', methods=['POST'])
def saveMod():
    uploaded_files = request.files["file"]
    mod_type = request.form.to_dict()["type"]
    uploaded_files.filename = uploaded_files.filename.replace(" ", "_").replace("+", "_")
    uploaded_files.save(f"mods/{mod_type}/{uploaded_files.filename}")
    return "Successfully saved"

@app.route('/api/deleteMod', methods=['DELETE'])
def deleteMod():
    params = request.args.to_dict()
    mod_type = params["type"]
    mod_name = params["name"]
    os.remove(f"files/{mod_type}/{mod_name}")
    return "Successfully deleted"


@app.route('/stream')
def stream():
    q = Queue()
    log.subscribers.add(q)  # Add to subscribers
    try:
        return Response(stream_with_context(q), content_type='text/event-stream')
    except GeneratorExit:  # Remove the subscriber when the client disconnects
        log.subscribers.remove(q)

def stream_with_context(q):
    try:
        while True:
            message = q.get()  # Wait for new messages
            yield f"data: {message}\n\n"
    except GeneratorExit:
        pass




if __name__ == '__main__':
    app.run(debug=True)
