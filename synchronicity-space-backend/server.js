import app from "./src/app.js";
import http from "http";
import { WebSocketServer } from "ws";
import { setBroadcast } from "./src/routers/generatorRouter.js";
import { createHandler } from 'graphql-http/lib/use/express'; 
import { schema } from './src/graphql/schema.ts';
import { rootValue } from './src/graphql/resolvers.ts';

 
const PORT = process.env.PORT || 3000;

app.all('/graphql', createHandler({schema, rootValue}))

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
 
// server.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
server.listen(3000, () => {
  console.log(' GraphQL API at http://localhost:3000/graphql');
})