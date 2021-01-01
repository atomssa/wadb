import React from "react";

const AdbLine = (props) => {
  const { line, cls } = props;
  return (
    <React.Fragment>
      {line.pid ? (
        <span className={cls}>
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
        <span className={cls}>
          {" "}
          {line.date}
          {"/"}
          {line.ts}{" "}
        </span>
      ) : null}
      {line.lvl ? <span className={cls}> {line.lvl} </span> : null}
      <span className={cls}> {line.msg} </span>
      <br />
    </React.Fragment>
  );
};

export default AdbLine;
