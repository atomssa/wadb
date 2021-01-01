import React from "react";
import AdbLine from "./adbline";

const AdbTailer = (props) => {
  const { lines } = props;
  return (
    <div id="logContent">
      {lines.map((lineGrp) => (
        <AdbLine
          key={lineGrp[0].ln}
          bg={lineGrp[0].bg}
          lvl={lineGrp[0].lvl ? lineGrp[0].lvl.toLowerCase() : "nolvl"}
          lineGrp={lineGrp}
        />
      ))}
    </div>
  );
};

export default AdbTailer;
