import express from "express";
import { noteRouter } from "./routers/noteRouter.js";
 
const app = express();
 
app.use(express.json());
 
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
 
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "S-Space API is running" });
});
 
app.use("/notes", noteRouter);
 
export default app;