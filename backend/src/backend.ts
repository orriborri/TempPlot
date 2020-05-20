import express from "express";
import { connect } from "mqtt";
import fs from "fs";
import mongoose from "mongoose";

interface ITempModel extends mongoose.Document {
  time: string;
  module: string;
  id: number;
  channel: number;
  temperature_C: number;
}

let TempSchema = new mongoose.Schema({
  time: String,
  module: String,
  id: Number,
  channel: Number,
  temperature: Number
});

const client = connect("mqtt://192.168.11.151");
mongoose.connect("mongodb://192.168.11.151/temp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on("error", err => {
  console.error("Unable to connect to Mongo via Mongoose", err);
});

const Temp = mongoose.model<ITempModel>("Temp", TempSchema, "Temp");

client.on("connect", () => {
  client.subscribe("home/rtl_433", function(err) {
    if (!err) {
      console.log("connected to rtl_433");
    } else {
      console.log(err);
    }
  });
});

client.on("message", (topic, message: string) => {
  let tempJson = JSON.parse(message);
  const temp = new Temp(tempJson);
  temp.save();
});

const app = express();
const port = 3000;

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});

app.use("/", (req, res) => {
  Temp.find()
    .lean()
    .exec((err, result) => {
      if (err) {
        res.send(err);
      } else {
        let resArr = [{}];
        let oldDate = "";
        let date = "";
        let max = -Infinity;
        let min = Infinity;
        let tempC = 0;
        result.forEach(temp => {
          if (typeof temp.time !== "undefined") {
            date = temp.time.split(" ")[0];
            tempC = temp.temperature_C;
            if (oldDate === "") {
              oldDate = date;
            }
            if (tempC > max) {
              max = tempC;
            }
            if (tempC < min) {
              min = tempC;
            }
            if (oldDate.localeCompare(date) !== 0) {
              resArr.push({ date: date, max: max, min: min });
              oldDate = date;
              max = -Infinity;
              min = Infinity;
            }
          }
        });

        res.send(resArr);
      }
    });
});
