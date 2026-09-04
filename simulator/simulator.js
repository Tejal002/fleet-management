require("dotenv").config();

const WebSocket = require("ws");
const FLEET_SIZE = Number(process.env.FLEET_SIZE || 10);
const UPDATE_INTERVAL = Number(process.env.UPDATE_INTERVAL || 1000);
const SITE_WIDTH = Number(process.env.SITE_WIDTH || 1000);
const SITE_HEIGHT = Number(process.env.SITE_HEIGHT || 600);

const ws = new WebSocket(process.env.BACKEND_WS_URL);


ws.on("open", () => {
  console.log("Connected to backend");
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error.message);
});

ws.on("close", () => {
  console.log("Disconnected from backend");
});



const robots = [];

const startTime = Date.now();

// Create robots
for (let i = 1; i <= FLEET_SIZE; i++) {
  robots.push({
    robot_id: `r${i}`,
    x: Math.random() * SITE_WIDTH,
    y: Math.random() * SITE_HEIGHT,
    battery: 50 + Math.random() * 50,
    status: "idle",

    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4,
  });
}

// Update battery
function updateBattery(robot) {
  if (robot.status === "charging") {
    robot.battery += 0.5;
  } else if (robot.status === "on_mission") {
    robot.battery -= 0.2;
  } else if (robot.status === "active") {
    robot.battery -= 0.15;
  } else {
    robot.battery -= 0.05;
  }

  robot.battery = Math.max(
    0,
    Math.min(100, robot.battery)
  );
}

// Update status
function updateStatus(robot) {
  if (robot.status === "charging") {
    if (robot.battery >= 90) {
      robot.status = "idle";
    }

    return;
  }

  if (robot.battery <= 20) {
    robot.status = "charging";
    return;
  }

  const random = Math.random();

  if (robot.status === "idle" && random < 0.05) {
    robot.status = "on_mission";
  } else if (
    robot.status === "on_mission" &&
    random < 0.1
  ) {
    robot.status = "active";
  } else if (
    robot.status === "active" &&
    random < 0.05
  ) {
    robot.status = "idle";
  }
}

// Update position
function updatePosition(robot) {
  robot.x += robot.dx;
  robot.y += robot.dy;

  if (robot.x <= 0 || robot.x >= SITE_WIDTH) {
    robot.dx *= -1;
  }

  if (robot.y <= 0 || robot.y >= SITE_HEIGHT) {
    robot.dy *= -1;
  }

  robot.x = Math.max(
    0,
    Math.min(SITE_WIDTH, robot.x)
  );

  robot.y = Math.max(
    0,
    Math.min(SITE_HEIGHT, robot.y)
  );
}

// Simulation loop
setInterval(() => {
  const t = Math.floor(
    (Date.now() - startTime) / 1000
  );

  robots.forEach((robot) => {
    updateStatus(robot);
    updateBattery(robot);
    updatePosition(robot);

    const payload = {
      t,
      robot_id: robot.robot_id,
      x: Number(robot.x.toFixed(1)),
      y: Number(robot.y.toFixed(1)),
      status: robot.status,
      battery: Number(robot.battery.toFixed(1)),
    };

    console.log(payload);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  });

  console.log();
}, UPDATE_INTERVAL);