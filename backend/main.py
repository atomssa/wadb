import flask
from flask import send_from_directory
from flask import jsonify
from flask import Response
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, send, emit
from reader.adb import Adb
import json
import os
import argparse

parser = argparse.ArgumentParser(description="Launch adb on wesocket server")
parser.add_argument('-s', '--static-folder', required=False, default="")
parser.add_argument('-a', '--adb-exe', required=True)
args = parser.parse_args()

print(args)

app = flask.Flask(
    __name__, static_folder=args.static_folder)
app.config['DEBUG'] = True
cors = CORS(app)
app.config["CORS_HEADERS"] = 'Content-Type'

socketio = SocketIO(app, async_mode="threading",
                    logger=False, engineio_logger=False)
# socketio = SocketIO(app, async_mode=None, logger=False)
socketio.init_app(app, cors_allowed_origins="*")

NS = "/wadb"
adb = Adb(socketio, NS, args.adb_exe)


@app.route('/', methods=['GET'], defaults={'path': ''})
@app.route('/<path:path>')
@cross_origin()
def home(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


@app.route('/hello')
@cross_origin()
def hello_world():
    return jsonify({"msg": "Hello world"})


@app.route('/devices')
@cross_origin()
def get_devices():
    return jsonify(adb.get_devices())


# SocketIO part


@socketio.on('echo_test_data', namespace=NS)
def api_echo_test_data(arg):
    print("received event" + str(arg))
    arg["data"] = "pong"
    print("responding back" + str(arg))
    socketio.emit('echo_test_data_reply', json.dumps(arg), namespace=NS)
    return 'OK'


@socketio.on('connect', namespace=NS)
@cross_origin()
def api_connect():
    print("Clients wants to connect")
    socketio.emit('connection_established', json.dumps({
                  'data': 'Connected'}), namespace=NS)
    adb.launch_dispatcher_thread()
    adb.launch_heartbeat_thread()
    return 'OK'


@socketio.on('launch_adb', namespace=NS)
@cross_origin()
def launch_adb(args):
    # launch helper threads in case they were killed
    adb.launch_dispatcher_thread()
    adb.launch_heartbeat_thread()
    device = args["device"]
    pkg = args["pkg"]
    rexps = args["rexps"]
    print(f"Client wants launch adb: pkg={pkg} on {device}")
    adb.launch_adb_thread(device, pkg, rexps)
    return 'OK'


@socketio.on('stop_adb', namespace=NS)
@cross_origin()
def stop_adb(args):
    device = args["device"]
    pkg = args["pkg"]
    print('Client wants to stop adb: pkg={pkg} on {device}')
    adb.stop_adb_thread(device, pkg)
    return 'OK'


@socketio.on('stop_everything', namespace=NS)
@cross_origin()
def stop_everything():
    print('Client wants to stop everything')
    adb.stop_all_threads()
    return 'OK'


@socketio.on('disconnect', namespace=NS)
@cross_origin()
def api_disconnect():
    print('Client wants to disconnect. Quid?')
    return 'OK'


#  app.run(debug=True, use_reloader=True, threaded=True)
socketio.run(app, debug=True, host='0.0.0.0')
