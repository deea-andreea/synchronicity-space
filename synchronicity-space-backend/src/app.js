import express from "express";
import { noteRouter } from "./routers/noteRouter.js";
import { generatorRouter } from "./routers/generatorRouter.js";
 
const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
 
app.use(express.json());
app.use("/generator", generatorRouter);
 
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "S-Space API is running" });
});
 
app.use("/notes", noteRouter);
 
export default app;