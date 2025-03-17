import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index';
import { User } from '@prisma/client';

const router = express.Router();

// Configure Google OAuth strategy
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID as string,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//   callbackURL: "/auth/google/callback"
// },
// async (accessToken, refreshToken, profile, done) => {
//   try {
//     // Check if user already exists
//     if (!profile.emails || profile.emails.length === 0) {
//       return done(new Error('No email found in profile'), false);
//     }
//     let user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
//     if (!user) {
//       // Create new user
//       user = await prisma.user.create({
//         data: {
//           email: profile.emails ? profile.emails[0].value : '',
//           name: profile.displayName,
//           googleId: profile.id,
//           password: ''
//         }
//       });
//     }
//     done(null, user);
//   } catch (error) {
//     done(error, false);
//   }
// }));

// Google login route
// router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google login callback route
// router.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     if (!req.user) {
//       res.status(400).json({ message: 'User not authenticated' });
//       return;
//     }

//     const user = req.user as User;

//     // Successful authentication, generate token
//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET as string,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name
//       }
//     });
//   }
// );

// Initialize passport
// router.use(passport.initialize());

// Register a new user
router.post('/register', async (req , res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        googleId: ''
      }
    });

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;