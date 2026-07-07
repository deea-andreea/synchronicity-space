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

userRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { username, avatar } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
