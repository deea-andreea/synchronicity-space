import { Router } from "express";
import { User, Role, Permission } from "../models/index.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            where: { username, password },
            include: [{
                model: Role,
                include: [Permission]
            }]
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const permissions = user.Role?.Permissions?.map(p => p.name) || [];

        res.json({
            id: user.id,
            username: user.username,
            role: user.Role?.name || 'user',
            permissions: permissions
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});

authRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;
    

    try {
        const userRole = await Role.findOne({ where: { name: 'user' } });

        const newUser = await User.create({
            username,
            password, 
            roleId: userRole.id 
        });

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Username already taken." });
        }
        res.status(500).json({ error: err.message });
    }
});