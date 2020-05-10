import express from "express";
import { connect } from "mqtt";
import fs from "fs";
import { fileURLToPath } from "url";
import { json } from "body-parser";

type extTemp = { temp: number; time: string };
type tempFile = { maxTemp: extTemp; minTemp: extTemp; data: [measurement] };
type measurement = {
  time: string;
  module: string;
  id: number;
  channel: number;
  temperature_C: number;
};
const client = connect("mqtt://192.168.11.151");

//const url = "mongodb://192.168.11.151:27017";
//const dbName = "temp";

function updateJsonFile(tempString: any) {
  const tempJson = JSON.parse(tempString);
  //fs.mkdirSync("data");
  if (tempJson.id !== 0) {
    const dateTime = tempJson["time"];
    const date = dateTime.split(" ")[0];
    fs.readFile("data/" + date + ".json", "utf8", (err, data) => {
      let dailyTempData: tempFile;
      const temp = tempJson["temperature_C"];
      //  console.log(temp);
      if (err) {
        console.log("dailyfile not found");
        dailyTempData = {
          maxTemp: { temp: temp, time: dateTime },
          minTemp: { temp: temp, time: dateTime },
          data: [tempJson]
        };
      } else {
        //      console.log("oldtemp file: " + data);
        dailyTempData = JSON.parse(data);
        dailyTempData.data.push(tempJson);
      }
      let max = dailyTempData["maxTemp"];
      let min = dailyTempData["minTemp"];

      if (temp > max.temp) {
        dailyTempData["maxTemp"] = { temp: temp, time: dateTime };
      } else if (temp < min.temp) {
        dailyTempData["minTemp"] = { temp: temp, time: dateTime };
      }
      fs.writeFileSync("data/" + date + ".json", JSON.stringify(dailyTempData));
    });
  }
}

client.on("connect", () => {
  client.subscribe("home/rtl_433", function(err) {
    if (!err) {
      console.log("connected");
    } else {
      console.log(err);
    }
  });
});

client.on("message", (topic, message) => {
  //  console.log(topic + " " + message);
  updateJsonFile(message);
});

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  let tempData = new Array<measurement>();
  let maxData = new Array<extTemp>();
  let minData = new Array<extTemp>();
  const dataLs = fs.readdirSync("data");
  dataLs.forEach(file => {
    let temp = JSON.parse(fs.readFileSync("data/" + file, "utf8")) as tempFile;
    temp["data"].forEach(data => tempData.push(data));
    minData.push(temp["minTemp"]);
    maxData.push(temp["maxTemp"]);
  });
  res.send({
    temperaturedata: tempData,
    maxDailyData: maxData,
    minDailyData: minData
  });
});

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});
