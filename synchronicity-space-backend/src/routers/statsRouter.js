import { Router } from "express";
import { sequelize, Note, Listen } from "../models/index.js";
import { Op } from "sequelize";

export const statsRouter = Router();

statsRouter.post("/listen", async (req, res) => {
    const { userId, albumId, genre } = req.body;
    try {
        await Listen.create({ userId, albumId, genre: genre || "Unknown" });
        res.status(201).json({ message: "Listen recorded" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

statsRouter.get("/summary", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
        const genreCounts = await Listen.findAll({
            where: { userId },
            attributes: [
                'genre',
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('albumId'))), 'count']
            ],
            group: ['genre'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const listens = await Listen.findAll({
            where: { userId, listenDate: { [Op.gte]: sevenDaysAgo } }
        });

        const notes = await Note.findAll({
            where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } }
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekStats = dayNames.map((day, index) => {
            const dailyListensRows = listens.filter(l => new Date(l.listenDate).getDay() === index);
            const uniqueAlbumsThisDay = new Set(dailyListensRows.map(l => l.albumId)).size;
            
            const dailyNotes = notes.filter(n => new Date(n.createdAt).getDay() === index).length;
            
            return {
                weekday: day,
                albums: uniqueAlbumsThisDay,
                notes: dailyNotes
            };
        });

        res.json({
            topGenres: genreCounts.map(g => ({ 
                genre: g.genre, 
                count: parseInt(g.get('count')) 
            })),
            weekStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});