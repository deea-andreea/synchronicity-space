import { Router } from "express";
import * as authController from "../controllers/authController.js";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);
authRouter.get("/friends/:userId", authController.getFriends);

authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/verify-email", authController.verifyEmail);