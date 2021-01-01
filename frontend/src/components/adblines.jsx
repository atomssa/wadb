import React from "react";

const AdbLines = (props) => {
  const { lineGrp } = props;
  const bg = lineGrp[0].bg;
  const lvl = lineGrp[0].lvl ? lineGrp[0].lvl.toLowerCase() : "nolvl";

  const cls = `adb adb-b${bg} adb-${lvl}`;
  return (
    <div className={`adb adb-b${bg}`}>
      {lineGrp.map((line) => (
        <React.Fragment key={line.ln}>
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
      ))}
    </div>
  );
};

export default AdbLines;
