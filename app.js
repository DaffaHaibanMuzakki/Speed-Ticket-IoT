const mqtt = require("mqtt");
const express = require("express");
const http = require("http");      
const path = require("path");      
const { Server } = require("socket.io");
const app = express() ; 
const server = http.createServer(app);
const io = new Server(server);
const mongoose = require('mongoose');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static("public"));

require("dotenv").config();



const options = {
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: "mqtts",
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
};

const client = mqtt.connect(options);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));





const SpeedTicketSchema = new mongoose.Schema({
  nomor_tiket: String,
  kendaraan: String,
  tanggal: Date,
  kecepatan: Number
});

const SpeedTicket = mongoose.model("speed_ticket_data", SpeedTicketSchema);


app.get("/", async (req,res) =>{
  res.render("dashboard");
})


client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud ✅");

  
  client.subscribe("test/topic", (err) => {
    if (!err) {
      console.log("Subscribed to test/topic");
    }
  });

});


client.on("message", async (topic, message) => {
  const ticket = new SpeedTicket({
  tanggal: new Date(),
  kecepatan: parseFloat(message)
});

console.log(`Ini data Kecepatan: ${message}`);

  await SpeedTicket.create(ticket);
  console.log("Data speed ticket saved to database ✅");

  // console.log(`Pesan dari ${topic}: ${message.toString()}`);
  
});


io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("hapus_ticket", async (data) => {
        try {
            await SpeedTicket.findByIdAndDelete(data.id);

            const semuaData = await SpeedTicket.find().sort({ tanggal: -1 });

            io.emit("mqtt_message", { ticketData: semuaData });
        } catch (err) {
            console.error("Gagal hapus data:", err);
        }
    });
});



setInterval(async () => {

  const latestTicket = await SpeedTicket.find().sort({ tanggal: -1 }); 

  
  
  io.emit("mqtt_message", { 
      ticketData: latestTicket 
  });

}, 1000);





server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});