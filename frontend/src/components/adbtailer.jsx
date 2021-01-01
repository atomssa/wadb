import React from "react";
import AdbLines from "./adblines";

const AdbTailer = (props) => {
  const { lines } = props;
  return (
    <div id="logContent">
      {lines.map((lineGrp) => (
        <AdbLines key={lineGrp[0].ln} lineGrp={lineGrp} />
      ))}
    </div>
  );
};

export default AdbTailer;
