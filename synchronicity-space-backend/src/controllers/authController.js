import { User, Role, Permission, Friendship } from "../models/index.js";
import { Op } from "sequelize";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_labs';
export const login = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            message: "Payload validation failed: Request body cannot be empty."
        });
    }
    const { username, password } = req.body;

    try {
        const user = await User.findOne({
            where: { username },
            include: [{
                model: Role,
                include: [Permission]
            }]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email identity before logging in.' });
        }

        const permissions = user.Role?.Permissions?.map(p => p.name) || [];

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                roleName: user.Role?.name || 'user',
                permissions: permissions
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            id: user.id,
            username: user.username,
            role: user.Role?.name || 'user',
            permissions: permissions
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing registration fields.' });
        }

        const userRole = await Role.findOne({ where: { name: 'user' } });

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ error: 'Email is already registered.' });

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Username already exists.' });

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = await User.create({
            username,
            email,
            password,
            roleId: userRole.id,
            isVerified: false,
            verificationToken
        });

        const verifyLink = `https://172.20.10.3:5173/verify-email?token=${verificationToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            tls: { rejectUnauthorized: false }
        });

        transporter.sendMail({
            from: `"Synchronicity Space" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Identity',
            html: `
        <p>Hello ${username},</p>
        <p>Thank you for registering. Please click the link below to verify your email identity and activate your account:</p>
        <p><a href="${verifyLink}">${verifyLink}</a></p>
    `
        }).then(() => {
            console.log(`📧 Verification email successfully sent to ${email}`);
        }).catch((mailError) => {
            console.error("🔴 Background Email Delivery Failed:", mailError);
        });

        return res.status(201).json({
            message: 'Registration successful. Please check your email to verify your identity.'
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getFriends = async (req, res) => {
    try {
        const { userId } = req.params;

        const friendships = await Friendship.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { userId: userId },
                    { friendId: userId }
                ]
            }
        });

        const friendIds = friendships.map(f =>
            f.userId === userId ? f.friendId : f.userId
        );

        const friends = await User.findAll({
            where: {
                id: { [Op.in]: friendIds }
            },
            attributes: ['id', 'username', 'avatar']
        });

        res.json(friends);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "No account found matching that email address." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // 🚀 Dynamic Frontend URL Handling (Fallback to Localhost IP if needed)
        const frontendUrl = process.env.NODE_ENV === 'production'
            ? 'https://synchronicity-space.vercel.app' // Replace with your primary Vercel domain if different
            : 'https://172.20.10.3:5173';

        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `"Synchronicity Space Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Synchronicity Space Password',
            html: `
                <p>Hello,</p>
                <p>You requested a password reset for your Synchronicity Space account.</p>
                <p>Please click the link below to reset your password. This link will expire in 10 minutes:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
            `
        };

        // 🚀 Fire and forget in the background! Removed 'await' so it doesn't freeze your route.
        transporter.sendMail(mailOptions)
            .then(() => {
                console.log(`📧 Recovery email successfully sent to: ${email}`);
            })
            .catch((mailError) => {
                console.error("🔴 Background Recovery Email Delivery Failed:", mailError);
            });

        // 🌟 Instantly respond to the frontend UI
        return res.json({ message: "A security recovery link has been sent to your email address." });

    } catch (err) {
        console.error("Forgot Password Controller Crash:", err);
        return res.status(500).json({ error: "Failed to process security recovery operation." });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: "Recovery token is invalid or expired." });
        }

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: "Password updated successfully over encrypted tunnel." });
    } catch (err) {
        res.status(500).json({ error: "Failed to update security credentials." });
    }
};

export const verifyEmail = async (req, res) => {
    const token = req.body?.token || req.query?.token;

    try {
        if (!token) {
            return res.status(400).json({ error: "Verification token context is missing." });
        }

        const user = await User.findOne({ where: { verificationToken: token } });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token." });
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        return res.json({ message: "Identity verified successfully! You can now log in." });
    } catch (err) {
        console.error("Database Verification Loop Crash Error Logs:", err);
        return res.status(500).json({ error: "Internal database verification operation failed." });
    }
};