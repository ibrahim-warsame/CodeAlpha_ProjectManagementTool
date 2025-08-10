import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const isProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // This would typically check if the user is a member of the project
    // For now, we'll just pass through - implement actual logic as needed
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied to this project' });
  }
};
