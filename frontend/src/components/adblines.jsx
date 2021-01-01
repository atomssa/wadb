import React from "react";
import AdbLine from "./adbline";

const AdbLines = (props) => {
  const { lineGrp } = props;
  const bg = lineGrp[0].bg;
  const lvl = lineGrp[0].lvl ? lineGrp[0].lvl.toLowerCase() : "nolvl";
  const show = lineGrp.some((line) => line.show);
  const cls = `${show ? "adb" : "adb-rem"} adb-b${bg} adb-${lvl}`;
  return (
    <div className={`${show ? "adb" : "adb-rem"} adb-b${bg}`}>
      {lineGrp.map((line) =>
        line.show ? (
          <AdbLine
            line={line}
            cls={`${line.show ? "adb" : "adb-rem"} ${cls}`}
            key={line.ln}
          />
        ) : null
      )}
    </div>
  );
};

export default AdbLines;
