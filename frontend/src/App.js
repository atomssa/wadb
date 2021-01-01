import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import * as Scroll from "react-scroll";
import axios from "axios";
import produce from "immer";
import AdbTailer from "./components/adbtailer";
import NavBar from "./components/navbar";
import "./App.scss";

class App extends Component {
  state = {
    tailMode: true,
    socket: null,
    devices: [],
    lines: [],
    settings: {
      exclude: {
        title: "Exclude",
        rexps: [
          "Accessing hidden",
          "Thread-.* identical",
          "Handling agent command",
          "chatty",
          "resource failed",
          "identical .* line",
        ],
      },
      columns: {
        title: "Columns",
        columns: [
          { name: "pid", checked: true },
          { name: "tid", checked: false },
          { name: "date", checked: true },
          { name: "time", checked: true },
          { name: "lvl", checked: true },
          { name: "tag", checked: false },
          { name: "device", checked: false },
        ],
      },
      colors: {},
    },
  };

  componentDidMount() {
    this.reloadDevices(true);
  }

  componentWillUnmount() {
    const { socket } = this.state;
    if (socket !== null) {
      socket.emit("stop_everything");
      socket.off();
      socket.close();
      this.setState({ socket: null });
    }
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  _scroll = Scroll.animateScroll;
  scrollToBottom = () => {
    if (this.state.tailMode === true) {
      this._scroll.scrollToBottom();
    }
  };
  toggleTailMode = () => {
    if (this.state.tailMode === true) {
      this.setState({ tailMode: false });
    } else {
      this.setState({ tailMode: true });
      this.scrollToBottom();
    }
  };

  reloadDevices = (launchSocket) => {
    console.log(`reloading device data: launchSocket=${launchSocket}`);
    axios.get(`http://localhost:5000/devices`).then((res) => {
      console.log("GET /devices result: ", res.data);
      let settingsChange = false;
      const newSettings = produce(this.state.settings, (draft) => {
        Object.keys(res.data).forEach((dev) => {
          if (!(dev in draft.colors)) {
            draft.colors[dev] = { bg: Object.keys(draft.colors).length };
            settingsChange = true;
          }
        });
      });
      if (settingsChange) {
        this.setState({ devices: res.data, settings: newSettings });
      } else {
        this.setState({ devices: res.data });
      }
      if (launchSocket === true) this.launchSocket();
    });
  };

  processAdbLog = (newLines) => {
    this.setState({
      lines: produce(this.state.lines, (draft) => {
        newLines.forEach((line) => {
          line.bg = this.state.settings.colors[line.device].bg;
          if (draft.length === 0) draft.push([line]);
          else {
            const last = draft[draft.length - 1];
            if (last[0].lvl === line.lvl && last[0].bg === line.bg)
              last.push(line);
            else draft.push([line]);
          }
        });
      }),
    });
  };

  launchSocket = () => {
    if (this.state.socket === null || !this.state.socket.connected) {
      console.log("Launching SocketIO client");
      let socket = socketIOClient(`http://localhost:5000/test`);
      socket.on("connect", () => {
        console.log("Connected to wesocket server");
      });
      socket.on("disconnect", () => {
        console.log("Disconnected from websocket");
        this.setState({ lines: [] });
      });
      socket.on("adb_log", (msg) => {
        this.processAdbLog(JSON.parse(msg));
      });
      socket.on("echo_test_data_reply", (msg) => {
        const json = JSON.parse(msg);
        console.log("Echo response: ", json);
      });
      socket.emit("echo_test_data", { data: "ping" });
      this.setState({ socket });
    } else {
      console.log("SocketIO already connected.. doing nothing");
    }
  };

  pingServer = () => {
    console.log("Pinging websocket server");
    if (this.state.socket) {
      this.state.socket.emit("echo_test_data", { data: "ping" });
    } else {
      console.log("socket to webserver not available");
    }
  };

  launchAdb = (device, pkg) => {
    console.log(`launching adb on ${device} for pkg=${pkg}`);
    const rexps = this.state.settings.exclude.rexps;
    this.state.socket.emit("launch_adb", { device, pkg, rexps });
  };

  stopAdb = (device, pid) => {
    console.log(`stopping adb on ${device} for pid=${pid}`);
    this.state.socket.emit("stop_adb", { device, pid });
  };

  killSelectedAdb = (device, pid) => {};

  pickProcess = (event) => {
    console.log(event.target.value);
    const value = JSON.parse(event.target.value);
    if (value.device && value.pkg) {
      console.log(
        `process selector changed dev=${value.device} pkg=${value.pkg}`
      );
      this.launchAdb(value.device, value.pkg);
      this.setState({
        devices: produce(this.state.devices, (draft) => {
          draft[value.device].forEach((pkg) => {
            if (pkg.pkg === value.pkg) pkg.selected = true;
          });
        }),
      });
    }
  };

  addRemoveExcludeRegexp = (rexp, add) => {
    this.setState({
      settings: produce(this.state.settings, (draft) => {
        if (add && !draft.exclude.rexps.includes(rexp)) {
          draft.exclude.rexps.push(rexp);
        } else if (!add) {
          draft.exclude.rexps = draft.exclude.rexps.filter(
            (_rexp) => _rexp !== rexp
          );
        }
      }),
    });
  };

  render() {
    return (
      <div className="App">
        <NavBar
          devices={this.state.devices}
          settings={this.state.settings}
          pingServer={this.pingServer}
          stopAdb={this.stopAdb}
          launchAdb={this.launchAdb}
          launchSocekt={this.launchSocket}
          pickProcess={this.pickProcess}
          killSelectedAdb={this.killSelectedAdb}
          reloadDevices={this.reloadDevices}
          addRemoveExcludeRegexp={this.addRemoveExcludeRegexp}
          toggleTailMode={this.toggleTailMode}
        />
        <AdbTailer lines={this.state.lines} />
      </div>
    );
  }
}

export default App;
