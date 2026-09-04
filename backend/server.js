require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server
});

// Store latest state of every robot
const fleet = new Map();


// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Fleet Management Backend is running"
  });
});


// Robot simulator connects here
wss.on("connection", (ws) => {

  console.log("WebSocket client connected");


  ws.on("message", (message) => {

    try {

      const robot = JSON.parse(message.toString());

      console.log("Received:", robot);


      // Store latest robot state
      fleet.set(robot.robot_id, robot);

      // Broadcast robot update to dashboard clients
      wss.clients.forEach((client) => {
        if (
          client !== ws &&
          client.readyState === WebSocket.OPEN
        ) {
          client.send(JSON.stringify(robot));
        }
      });


    } catch (error) {

      console.error("Invalid robot data:", error);

    }

  });


  ws.on("close", () => {

    console.log("WebSocket client disconnected");

  });

});


// Get current fleet state
app.get("/robots", (req, res) => {

  res.json(
    Array.from(fleet.values())
  );

});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`Backend running on port ${PORT}`);

});