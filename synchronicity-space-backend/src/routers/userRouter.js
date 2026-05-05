import { Router } from "express";
import { getAllUsers, getUserById } from "../store/userStore.js";
import { User } from '../models/User.js';

export const userRouter = Router();

userRouter.get("/", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

userRouter.get("/:id", (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: `User '${req.params.id}' not found` });
  res.json(user);
});
