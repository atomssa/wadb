import React from "react";

const AdbLine = (props) => {
  const { line, cls } = props;
  const _cls = `${line.show ? "adb" : "adb-rem"} ${cls}`;
  return (
    <React.Fragment>
      {line.pid ? (
        <span className={_cls}>
          {line.pid < 9999 ? " " : ""}
          {`${line.pid}`}
        </span>
      ) : null}
      {/* {line.device ? (
          <span>
            {" "}
            {line.device}/{bg}{" "}
          </span>
        ) : null} */}
      {line.date ? (
        <span className={_cls}>
          {" "}
          {line.date}
          {"/"}
          {line.ts}{" "}
        </span>
      ) : null}
      {line.lvl ? <span className={_cls}> {line.lvl} </span> : null}
      <span className={_cls}> {line.msg} </span>
      <br />
    </React.Fragment>
  );
};

export default AdbLine;
