import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { Chart } from "react-google-charts";

type Data = { date: Date; temp: number };

function App() {
  const [data, setData] = useState<any[]>();
  useEffect(() => {
    axios.get("http://localhost:9000/").then(response => {
      let rdata = Array<[Date, number]>();
      const { data } = response;
      if (typeof data !== "undefined") {
        data.forEach(d => {
          if (typeof d["temperature_C"] !== "undefined")
            rdata.push([new Date(d["time"]), d["temperature_C"]]);
        });
        rdata = rdata.sort().slice();
        console.log(rdata);
        setData(rdata);
      }
    });
  }, []);

  return (
    <div className={"my-pretty-chart-container"}>
      <Chart
        chartType="LineChart"
        rows={data}
        columns={[
          { type: "date", label: "Time" },
          { type: "number", label: "temp" }
        ]}
        width="100%"
        height="400px"
        legendToggle
      />
    </div>
  );
}

export default App;
