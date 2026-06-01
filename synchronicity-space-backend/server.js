import app from "./src/app.js";
import https from "https";
import fs from "fs";
import { sequelize } from './src/database.js';
// import { WebSocketServer } from "ws";
import { setBroadcast } from "./src/routers/generatorRouter.js";
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './src/graphql/schema.ts';
import { rootValue } from './src/graphql/resolvers.ts';
import { connectNoSql } from "./src/nosql.js";
import { Server } from 'socket.io';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 3000;

// app.all('/graphql', createHandler({schema, rootValue}))

const sslOptions = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

const server = https.createServer(sslOptions, app);
// const wss = new WebSocketServer({ server });

const io = new Server(server, {
  cors: {
    origin: [`https://172.20.10.3:5173`],
    methods: ["GET", "POST"]
  }
})

// wss.on("connection", (ws) => {
//   console.log("client connected");
//   ws.on("close", () => console.log("client disconnected"));
// });

setBroadcast((payload) => {
  // const message = JSON.stringify(payload);
  // wss.clients.forEach((client) => {
  //   if (client.readyState === 1) client.send(message);
  // });
  io.emit("broadcast_event", payload);
})

// server.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
// server.listen(3000, () => {
//   console.log(' GraphQL API at http://localhost:3000/graphql');
// })

const userSocketMap = {};
async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Tables have been synchronized.");
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await connectNoSql();
    io.on("connection", (socket) => {
      socket.on("register_user", (userId) => {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} is now linked to socket ${socket.id}`);
      });

      socket.on("send_invite", ({ senderName, friendIds, sessionId }) => {
        console.log(`Invite from ${senderName} to friends:`, friendIds);
        friendIds.forEach((friendId) => {
          const targetSocketId = userSocketMap[friendId];
          if (targetSocketId) {
            console.log(`Sending invite to friend ${friendId} at socket ${targetSocketId}`);
            io.to(targetSocketId).emit("receive_invite", {
              message: `${senderName} invited you to a listening session!`,
              sessionId: sessionId,
              senderName: senderName
            });
          }
          else {
            console.log(`Friend ${friendId} is not online (no socket found)`);
          }
        });
      });

      socket.on("send_message", (data) => {
        const { sessionId, text, senderId, senderName } = data;

        console.log(`Message in ${sessionId} from ${senderName}: ${text}`);

        io.to(sessionId).emit("receive_message", {
          senderId,
          senderName,
          text,
          timestamp: new Date()
        });
      });

      socket.on("join_session", (sessionId) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined room: ${sessionId}`);
      });

      socket.on("disconnect", () => {
        for (const userId in userSocketMap) {
          if (userSocketMap[userId] === socket.id) {
            console.log(`User ${userId} disconnected. Removing socket ${socket.id}`);
            delete userSocketMap[userId];
            break;
          }
        }
      });
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on https://172.20.10.3:${PORT}`);
    });

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();