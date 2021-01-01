import React from "react";
import AdbLine from "./adbline";

const AdbLines = (props) => {
  const { lineGrp } = props;
  const bg = lineGrp[0].bg;
  const lvl = lineGrp[0].lvl ? lineGrp[0].lvl.toLowerCase() : "nolvl";

  const cls = `adb adb-b${bg} adb-${lvl}`;
  return lineGrp.some((line) => line.show) ? (
    <div className={`adb adb-b${bg}`}>
      {lineGrp.map((line) =>
        line.show ? <AdbLine line={line} cls={cls} key={line.ln} /> : null
      )}
    </div>
  ) : null;
};

export default AdbLines;
