import app from "./src/app.js";
import http from "http";
import { WebSocketServer } from "ws";
import { setBroadcast } from "./src/routers/generatorRouter.js";

 
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({server});

wss.on("connection", (ws) => {
  console.log("client connected");
  ws.on("close", () => console.log("client disconnected"));
});

setBroadcast((payload) => {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  })
})
 
server.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));