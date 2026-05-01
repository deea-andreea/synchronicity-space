import { Router } from "express";
import { getAllUsers, getUserById } from "../store/userStore.js";

export const userRouter = Router();

userRouter.get("/", (req, res) => {
  res.json(getAllUsers());
});

userRouter.get("/:id", (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: `User '${req.params.id}' not found` });
  res.json(user);
});
