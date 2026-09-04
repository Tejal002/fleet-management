import { useEffect, useMemo, useState } from "react";
import "./App.css";

const WS_URL = "ws://localhost:5000";

function App() {
  const [robots, setRobots] = useState([]);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        console.log("Connected to backend");
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const robot = JSON.parse(event.data);

          setRobots((currentRobots) => {
            const existing = currentRobots.find(
              (r) => r.robot_id === robot.robot_id
            );

            if (existing) {
              return currentRobots.map((r) =>
                r.robot_id === robot.robot_id ? robot : r
              );
            }

            return [...currentRobots, robot];
          });
        } catch (error) {
          console.error("Invalid data:", error);
        }
      };

      socket.onclose = () => {
        console.log("Disconnected from backend");
        setConnected(false);

        // Try reconnecting after 2 seconds
        setTimeout(connect, 2000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const filteredRobots = useMemo(() => {
    return robots.filter((robot) => {
      const matchesSearch = robot.robot_id
        .toLowerCase()
        .includes(search.toLowerCase());

      let matchesFilter = true;

      if (filter === "active") {
        matchesFilter =
          robot.status === "active" ||
          robot.status === "on_mission";
      }

      if (filter === "attention") {
        matchesFilter =
          robot.status === "error" ||
          robot.status === "blocked" ||
          robot.status === "offline" ||
          robot.battery < 20;
      }

      if (filter === "charging") {
        matchesFilter = robot.status === "charging";
      }

      return matchesSearch && matchesFilter;
    });
  }, [robots, search, filter]);

  const activeCount = robots.filter(
    (robot) =>
      robot.status === "active" ||
      robot.status === "on_mission"
  ).length;

  const chargingCount = robots.filter(
    (robot) => robot.status === "charging"
  ).length;

  const attentionCount = robots.filter(
    (robot) =>
      robot.status === "error" ||
      robot.status === "blocked" ||
      robot.status === "offline" ||
      robot.battery < 20
  ).length;

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>Fleet Management</h1>
          <p>Real-time robot monitoring</p>
        </div>

        <div className="connection">
          <span
            className={
              connected
                ? "status-dot connected"
                : "status-dot disconnected"
            }
          />

          {connected ? "Connected" : "Disconnected"}
        </div>
      </header>


      {/* Summary Cards */}
      <section className="summary">

        <div className="card">
          <span>Total Robots</span>
          <strong>{robots.length}</strong>
        </div>

        <div className="card">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>

        <div className="card">
          <span>Charging</span>
          <strong>{chargingCount}</strong>
        </div>

        <div className="card">
          <span>Needs Attention</span>
          <strong>{attentionCount}</strong>
        </div>

      </section>


      {/* Map */}
      <section className="map-section">

        <div className="section-header">
          <div>
            <h2>Site Map</h2>
            <p>Live robot positions</p>
          </div>
        </div>

        <div className="map">

          {robots.map((robot) => (
            <div
              key={robot.robot_id}
              className={`robot robot-${robot.status}`}
              style={{
                left: `${(robot.x / 1000) * 100}%`,
                top: `${(robot.y / 600) * 100}%`,
              }}
              title={`${robot.robot_id} - ${robot.status}`}
            >
              <span className="robot-label">
                {robot.robot_id}
              </span>
            </div>
          ))}

        </div>

      </section>


      {/* Robot list */}
      <section className="robots-section">

        <div className="section-header">

          <div>
            <h2>Robots</h2>
            <p>
              Showing {filteredRobots.length} of {robots.length}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search robot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        {/* Filters */}
        <div className="filters">

          <button
            className={filter === "all" ? "active-filter" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={filter === "active" ? "active-filter" : ""}
            onClick={() => setFilter("active")}
          >
            Active
          </button>

          <button
            className={filter === "charging" ? "active-filter" : ""}
            onClick={() => setFilter("charging")}
          >
            Charging
          </button>

          <button
            className={filter === "attention" ? "active-filter" : ""}
            onClick={() => setFilter("attention")}
          >
            Attention
          </button>

        </div>


        {/* Table */}
        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Robot</th>
                <th>Status</th>
                <th>Battery</th>
                <th>Position</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>

              {filteredRobots.map((robot) => (

                <tr key={robot.robot_id}>

                  <td>
                    <strong>{robot.robot_id}</strong>
                  </td>

                  <td>
                    <span className={`badge ${robot.status}`}>
                      {robot.status}
                    </span>
                  </td>

                  <td>
                    <div className="battery">
                      <div
                        className="battery-bar"
                        style={{
                          width: `${robot.battery}%`,
                        }}
                      />

                    </div>

                    <span>
                      {robot.battery.toFixed(1)}%
                    </span>
                  </td>

                  <td>
                    ({robot.x.toFixed(1)},{" "}
                    {robot.y.toFixed(1)})
                  </td>

                  <td>
                    {robot.t}s
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default App;