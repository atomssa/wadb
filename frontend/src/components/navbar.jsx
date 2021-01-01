import React, { Component } from "react";
import ReactModal from "react-modal";
import Settings from "./settings";
class NavBar extends Component {
  state = { settingsModal: false };
  toggleSettingsModal = () => {
    console.log(`Toggling settingsModal: cur = ${this.state.settingsModal}`);
    this.setState({ settingsModal: !this.state.settingsModal });
  };

  render() {
    const {
      devices,
      settings,
      pingServer,
      pickProcess,
      killSelectedAdb,
      reloadDevices,
      addRemoveExcludeRegexp,
      toggleTailMode,
      searchFilter,
    } = this.props;
    return (
      <div className="navbar">
        <div className="navbar-group">
          <button className="navbar-item" onClick={pingServer}>
            Ping Server
          </button>

          <button className="navbar-item" onClick={this.toggleSettingsModal}>
            Settings
          </button>

          <button className="navbar-item" onClick={toggleTailMode}>
            Tail
          </button>

          <button className="navbar-item" onClick={pingServer}>
            Clear
          </button>

          <button className="navbar-item" onClick={pingServer}>
            Clear ADB
          </button>

          <div className="settings">
            <ReactModal
              isOpen={this.state.settingsModal}
              onAfterOpen={this.onAfterOpen}
              style={customStyles}
              ariaHideApp={false}
              contentLabel="Settings"
            >
              <Settings
                settings={settings}
                toggleSettingsModal={this.toggleSettingsModal}
                addRemoveExcludeRegexp={addRemoveExcludeRegexp}
              />
            </ReactModal>
          </div>
        </div>

        <div className="navbar-group">
          <button className="navbar-item" onClick={() => reloadDevices(false)}>
            Refresh
          </button>

          <select
            className="navbar-item"
            style={{ overflow: "auto" }}
            name="pids"
            id="pid-select"
            defaultValue="{}"
            //onFocus={() => reloadDevices(false)}
            onChange={pickProcess}
          >
            <option value="{}" disabled>
              --Please pick a pid--
            </option>
            {Object.keys(devices).map((dev) => (
              <optgroup key={dev} label={dev}>
                {devices[dev].map((pkg) => (
                  <option
                    key={pkg.pkg}
                    value={`{"pkg":"${pkg.pkg}","device":"${dev}"}`}
                    style={{
                      fontWeight: pkg.selected ? "bold" : "normal",
                      color: pkg.selected ? "green" : "",
                    }}
                  >
                    {`${pkg.pkg}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button className="navbar-item" onClick={killSelectedAdb}>
            Kill
          </button>
          <input
            className="navbar-item"
            type="text"
            name="search"
            placeholder="search in log..."
            onChange={searchFilter}
          />
        </div>
      </div>
    );
  }
}

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "10px 10px",
  },
};

export default NavBar;
