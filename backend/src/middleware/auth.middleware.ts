import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { User as prismaUser } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User extends prismaUser {}
    interface Request {
      user?: prismaUser;  
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) : Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      email: string;
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
    next(error);
    return;
  }
};