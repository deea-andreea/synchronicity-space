import 'dotenv/config';

import express from "express";
import { noteRouter } from "./routers/noteRouter.js";
import { generatorRouter } from "./routers/generatorRouter.js";
import { albumRouter } from "./routers/albumRouter.js";
import { userRouter } from "./routers/userRouter.js";
import { statsRouter } from "./routers/statsRouter.js";
import { authRouter } from "./routers/authRouter.js";
 
const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://172.20.10.3:5173",
    "https://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
 
app.use(express.json());

app.use("/auth", authRouter);

app.use("/generator", generatorRouter);

/* 

app.use("/albums", isAuthenticated, hasPermission("view_library"), albumRouter);
app.use("/stats", isAuthenticated, hasPermission("view_stats"), statsRouter);
app.use("/notes", isAuthenticated, hasPermission("leave_notes"), noteRouter);
*/

app.use("/albums", albumRouter);
app.use("/users", userRouter);
app.use("/stats", statsRouter);
app.use("/notes", noteRouter);
 
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "S-Space API is running" });
});
 
export default app;