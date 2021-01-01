from threading import Thread, Event
import subprocess as sp
import re
import time
import json
from queue import Queue
from collections import namedtuple

ThreadHolder = namedtuple("ThreadHolder", ["thread", "stop_evt", "rexp"])

DISPATCHER = "dispatcher"
HEARTBEAT = "heartbeat"
ADB_EXE = "/mnt/c/Users/etato/AppData/Local/Android/Sdk/platform-tools/adb.exe"


class Adb(object):
    def __init__(self, socketio, namespace):
        self.__ns = namespace
        self.__socketio = socketio

        self.__adb_procs = {}
        self.__threads = {}

        self.__my_env = {"TEST": "OK"}
        self.__RE = re.compile(
            r"(?P<date>\d\d-\d\d)\s*(?P<ts>\d\d:\d\d:\d\d\.\d\d\d)\s*(?P<pid>\d*)\s*(?P<tid>\d*)\s*(?P<lvl>[A-Z])\s*(?P<tag>[^:]*)\:(?P<msg>.*)")
        self.__RE_START = re.compile(
            r" Start proc (?P<pid>[^:]*):(?P<pkg>[^\/]*)/(?P<uid>[^\s]*)(?:[^{]*){(?P<main>.*)}")
        # USER           PID  PPID     VSZ    RSS WCHAN            ADDR S NAME
        # u0_a421       6976   726 5460220 127684 0                   0 S com.atomssa.games.gsnova
        # self._RE_PS = re.compile(
        #    r"(?P<uid>[^\s]*)\s*(?P<pid>\d*)\s*(?P<ppid>\d*)\s*(?P<vsz>\d*)\s*(?P<rss>\d*)\s*(?P<wchan>\d*)\s*(?P<addr>\d*)\s*(?P<status>[^\s]*)\s*(?P<pkg>[^\s]*)\s*")
        self.__RE_PS = re.compile(
            r"(?P<uid>[^\s]*)\s*(?P<pid>\d*)\s*(?:\d*)\s*(?:\d*)\s*(?:\d*)\s*(?:\d*)\s*(?:\d*)\s*(?P<status>[^\s]*)\s*(?P<pkg>[^\s]*)\s*")
        self.__queue = Queue()
        self.__line_num = 0
        self.__helper = {HEARTBEAT: self.__heartbeat,
                         DISPATCHER: self.__dispatcher}

    def __adb_cmd(self, device):
        return [ADB_EXE, "-s", device, "logcat"]

    def __adb_ps_cmd(self, device):
        return [ADB_EXE, "-s", device, "shell", "ps", "-A"]

    def __thread_key(self, device, pkg):
        return f"{device}:{pkg}"

    def __print_threads(self):
        for thread in self.__threads.keys():
            print(f"Existing threadd: {thread}")
        for proc in self.__adb_procs.keys():
            print(f"Existing proc: {proc}")

    def __filter_out_pkgs(self, m):
        return (m["pkg"].startswith("com.android") or
                m["pkg"].startswith("com.google") or
                m["pkg"].startswith("android") or
                ("oneplus" in m["pkg"]))

    def get_pids(self, device):
        cmd = self.__adb_cmd(device)
        cmd.append("-d")
        proc = sp.Popen(cmd, stdout=sp.PIPE)
        res = proc.communicate()[0].strip().decode("utf-8").splitlines()
        pkg_pids = {}
        for out in res:
            line = self.__parse_line(device, out)
            m = self.__RE_START.match(line["msg"])
            if m and not self.__filter_out_pkgs(m):
                pkg_pids.setdefault(m["pkg"], []).append(int(m["pid"]))
        pkgs = {k: {"pids": v, "selected": False} for k, v in pkg_pids.items()}
        return pkgs

    def __get_pkgs(self, device):
        cmd = self.__adb_ps_cmd(device)
        proc = sp.Popen(cmd, stdout=sp.PIPE)
        res = proc.communicate()[0].strip().decode("utf-8").splitlines()
        pkgs = []
        for out in res:
            m = self.__RE_PS.match(out)
            if m and m["uid"].startswith("u") and m["status"] != "D" and not self.__filter_out_pkgs(m):
                pkgs.append({"pkg": m["pkg"], "selected": False})
        return pkgs

    def get_devices(self):
        cmd = [ADB_EXE, "devices"]
        proc = sp.Popen(cmd, stdout=sp.PIPE)
        res = proc.communicate()[0].strip().decode("utf-8").splitlines()
        devices = {}
        for out in res:
            if not out.startswith("List"):
                device = out.split()[0]
                devices[device] = self.__get_pkgs(device)
        return devices

    def __parse_line(self, device, line):
        m = self.__RE.match(line)
        base = {"ln": self.__line_num, "device": device}
        if (m):
            rv = {**base, **m.groupdict()}
            rv["pid"] = int(rv["pid"])
        else:
            rv = {**base, **{"msg": line}}
        rv["msg"].strip()
        self.__line_num = self.__line_num + 1
        return rv

    def __launch_adb(self,  device, pkg, stop_evt, rexp):
        key = self.__thread_key(device, pkg)
        cmd = self.__adb_cmd(device)
        #cmd.extend(["--pid", pid])
        proc = sp.Popen(cmd, stdout=sp.PIPE,
                        env=self.__my_env, bufsize=1)
        self.__adb_procs[key] = proc
        pids = set()
        with proc.stdout:
            for line in iter(proc.stdout.readline, b''):
                pl = self.__parse_line(
                    device, line.strip().decode("utf-8"))
                m = self.__RE_START.match(pl["msg"])
                if m and m["pkg"] == pkg:
                    pids.add(int(m["pid"]))
                    print(f"pids for {pkg}/{device} updated: {pids}")
                if ("pid" not in pl) or (pl["pid"] in pids) and rexp.match(pl["msg"]):
                    self.__queue.put(pl)
                if stop_evt.is_set():
                    break
        proc.kill()
        del self.__threads[key]
        del self.__adb_procs[key]
        print(f"Adb command killed. leaving...")

    # ^((?!Accessing hidden|Thread-.* identical|Handling agent command|chatty|resource failed|identical .* line).)*$
    def __mk_re(self, rexps):
        _re = r"^((?!" + r"|".join([fr"{x}" for x in rexps]) + r").)*$"
        return re.compile(_re)

    def update_adb_rexps(self, rexps):
        for key, thread in self.__threads.items():
            if key not in self.__helper:
                thread.rexp = self.__mk_re(rexps)

    def launch_adb_thread(self, device, pkg, rexps):
        self.__print_threads()
        if device in self.__threads:
            print(
                f"a thread is already running for {device}:{pkg}. doing nothing..")
        else:
            print(f"launching adb thread for {device}:{pkg})")
            key = self.__thread_key(device, pkg)
            # no need to check if thread is alive, b/c it just got created
            stop_evt = Event()
            rexp = self.__mk_re(rexps)
            adb_thread = self.__socketio.start_background_task(
                lambda: self.__launch_adb(device, pkg, stop_evt, rexp))
            self.__threads[key] = ThreadHolder(
                adb_thread, stop_evt, rexp)

    def stop_adb_thread(self, device, pkg):
        key = self.__thread_key(device, pkg)
        if key in self.__threads:
            if self.__threads[key].thread.isAlive():
                print(f"stopping adb thread for {key}")
                self.__threads[key].stop_evt.set()
                del self.__threads[key]
            else:
                print(f"adb thread for {key} is already dead")
        else:
            print(f"adb thread for {key} not found")

    def __dispatcher(self, stop_evt):
        lines = []

        def __send():
            if lines:
                print(f"sending {len(lines)} lines. l0={lines[0]}")
                self.__socketio.emit('adb_log', json.dumps(lines),
                                     namespace=self.__ns)
                lines.clear()

        while not stop_evt.is_set():
            line = self.__queue.get()  # blocks if queue is empty
            if HEARTBEAT in line:
                __send()
            else:
                lines.append(line)
                if len(lines) > 1000:
                    __send()
            self.__socketio.sleep(0)
        del self.__threads[DISPATCHER]
        print("dispatcher thread stopped")

    def __heartbeat(self, stop_evt):
        while not stop_evt.is_set():
            t = time.time()
            self.__queue.put({HEARTBEAT: t})
            time.sleep(0.1)
        del self.__threads[HEARTBEAT]
        print("heartbeat thread stopped")

    def launch_heartbeat_thread(self):
        self.launch_helper_thread(HEARTBEAT)

    def stop_heartbeat_thread(self):
        self.stop_helper_thread(HEARTBEAT)

    def launch_dispatcher_thread(self):
        self.launch_helper_thread(DISPATCHER)

    def stop_dispatcher_thread(self):
        self.stop_helper_thread(DISPATCHER)

    def launch_helper_thread(self, key):
        if key in self.__threads:
            print(f"{key} thread alrady in threads. doing nothing")
        else:
            print(f"Launching {key} thread")
            stop_evt = Event()
            thread = self.__socketio.start_background_task(
                lambda: self.__helper[key](stop_evt))
            self.__threads[key] = ThreadHolder(thread, stop_evt, r"")

    def stop_helper_thread(self, key):
        if key in self.__threads:
            if self.__threads[key].thread.isAlive():
                print(f"stopping {key} thread")
                self.__threads[key].stop_evt.set()
                del self.__threads[key]
            else:
                print(f"{key} thread is already dead")
        else:
            print(f"{key} thread not found")

    def stop_all_threads(self):
        print(f"stopping all threads")
        for key, thread in self.__threads.items():
            print(f"stopping {key} thread")
            if thread.thread.isAlive():
                thread.stop_evt.set()
