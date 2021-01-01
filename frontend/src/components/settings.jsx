import React, { Component } from "react";
import { Tabs, Tab, TabList, TabPanel } from "react-tabs";
//import "react-tabs/style/react-tabs.css";
import "../react-tabs.scss";

class Settings extends Component {
  state = { excludeRexp: "" };
  render() {
    const {
      settings,
      toggleSettingsModal,
      addRemoveExcludeRegexp,
    } = this.props;
    return (
      <div className="settings">
        <Tabs>
          <TabList>
            <Tab>Exclusion</Tab>
            <Tab>Columns</Tab>
          </TabList>

          <TabPanel>
            <div
              style={{
                margin: "10px 20px 10px 20px",
                padding: "10px 20px 10px 20px",
              }}
            >
              <input
                type="text"
                id="rexp"
                placeholder="rexp to exclude.."
                onInput={(e) => this.setState({ excludeRexp: e.target.value })}
              />
              <button
                type="button"
                className="settings-widget"
                style={{ marginLeft: "10px" }}
                onClick={() =>
                  addRemoveExcludeRegexp(this.state.excludeRexp, true)
                }
              >
                Add
              </button>
              <div
                style={{
                  margin: "10px 20px 10px 20px",
                }}
              >
                {settings.exclude.rexps.map((rexp) => (
                  <p className="adb adb-nolvl" key={rexp}>
                    <button
                      className="adb adb-nolvl settings-widget"
                      style={{ margin: "0px 5px 0px 3px", padding: 0 }}
                      onClick={() => addRemoveExcludeRegexp(rexp, false)}
                    >
                      remove
                    </button>
                    {rexp}
                  </p>
                ))}
              </div>
            </div>
          </TabPanel>

          <TabPanel>
            <div
              style={{
                margin: "10px 20px 10px 20px",
                padding: "10px 20px 10px 20px",
              }}
            >
              {settings.columns.columns.map((col) => (
                <p className="adb" key={col.name}>
                  <input
                    type="checkbox"
                    id={col.name}
                    defaultChecked={col.checked}
                  />
                  <label htmlFor={col.name}>{col.name}</label>
                </p>
              ))}
            </div>
          </TabPanel>
        </Tabs>
        <div className="settings" style={{ width: "800px" }}>
          <button
            className="settings-widget"
            onClick={toggleSettingsModal}
            style={{ float: "right" }}
          >
            Apply
          </button>
          <button
            className="settings-widget"
            onClick={toggleSettingsModal}
            style={{ float: "right" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
}

export default Settings;
