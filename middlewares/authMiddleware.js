import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return res.status(401).json({
                message: 'Authorization token missing',
                success: false
            });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    message: 'Authorization failed',
                    success: false
                });
            } else {
                req.body.userId = decoded.id;
                req.user = { userId: decoded.id };
                next();
            }
        });
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed',
            success: false
        });
    }
};

export default authMiddleware;
