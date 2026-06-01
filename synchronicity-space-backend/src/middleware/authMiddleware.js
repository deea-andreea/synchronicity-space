import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_labs';

export const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. Security token missing.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Session signature is invalid or expired.' });
    }
};

export const hasPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
            return res.status(403).json({ 
                error: `Access Forbidden: Your account role missing scope [${requiredPermission}]` 
            });
        }
        next();
    };
};