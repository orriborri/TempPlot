import express from 'express';
import { connect } from 'mqtt';

const client = connect('mqtt://192.168.11.151');

client.on('connect', () => {
    client.subscribe('home/rtl_433', function (err) {
        if (!err) {
            console.log("connected")
        } else {
            console.log(err)
        }
    })
})
client.on('message', (topic, message) => {
    console.log(topic + ' ' + message)
})

const app = express();
const port = 3000;
app.get('/', (req, res) => {
    res.send('The sedulous hyena ate the antelope!');
});
app.listen(port, err => {
    if (err) {
        return console.error(err);
    }
    return console.log(`server is listening on ${port}`);
});