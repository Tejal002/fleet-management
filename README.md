# FINDINGS

## 1. Key Design Decisions

- Used WebSockets for real-time robot telemetry instead of REST polling.
- WebSockets provide immediate updates with less repeated HTTP traffic.
- The tradeoff is additional complexity around reconnects and connection handling.
- The backend stores the latest robot state in an in-memory Map for fast access.
- The WebSocket endpoint is publicly reachable because the browser must connect to it.

## 2. Observed Performance

My baseline configuration:

- Fleet size: 10 robots
- Update interval: 1000 ms
- Telemetry rate: ~10 messages/second

The system successfully handled continuous robot movement and real-time updates at this configuration.

As fleet size increases, message rate increases approximately linearly:

| Robots | Update Interval | Approx. Rate |
|---:|---:|---:|
| 10 | 1000 ms | 10 msg/s |
| 100 | 1000 ms | 100 msg/s |
| 800 | 1000 ms | 800 msg/s |

The first expected scaling pressure is WebSocket fan-out and browser rendering because every telemetry update can trigger dashboard updates.

## 3. What I Cut

To keep the implementation focused, I did not add:

- Persistent telemetry history
- Redis/Kafka message broker
- Horizontal backend scaling
- Canvas/WebGL rendering
- Advanced authentication

## 4. What I Would Build Next

- Add persistent telemetry history and time-range APIs.
- Use Canvas/WebGL for large fleets.
- Add message queuing for higher ingestion rates.
- Add stronger authentication, rate limiting, and monitoring.
- Run controlled load tests at 100, 500, and 800 robots.
