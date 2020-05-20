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

const Temp = mongoose.model("Temp", TempSchema);

client.on("connect", () => {
  client.subscribe("home/rtl_433", function(err) {
    if (!err) {
      console.log("connected");
    } else {
      console.log(err);
    }
  });
});

client.on("message", (topic, message: string) => {
  let tempJson = JSON.parse(message);
  console.log(tempJson);
  const temp = new Temp();
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
  Temp.find({}, (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});
