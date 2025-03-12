// backend/src/routes/health.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';
import axios from 'axios';

const router = express.Router();

// Connect to Google Fit
router.post('/connect/google-fit', authenticate, async (req, res) => {
  try {
    const { accessToken, refreshToken, expiresAt } = req.body;

    // Store or update the token
    await prisma.userHealthToken.upsert({
      where: {
        userId_provider: {
          userId: req.user!.id,
          provider: 'GOOGLE_FIT'
        }
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      create: {
        userId: req.user!.id,
        provider: 'GOOGLE_FIT',
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    res.json({ message: 'Google Fit connected successfully' });
  } catch (error) {
    console.error('Error connecting to Google Fit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect to Apple Health
router.post('/connect/apple-health', authenticate, async (req, res) => {
  try {
    const { accessToken } = req.body;

    // Store or update the token
    await prisma.userHealthToken.upsert({
      where: {
        userId_provider: {
          userId: req.user!.id,
          provider: 'APPLE_HEALTH'
        }
      },
      update: {
        accessToken
      },
      create: {
        userId: req.user!.id,
        provider: 'APPLE_HEALTH',
        accessToken,
        refreshToken: ''
      }
    });

    res.json({ message: 'Apple Health connected successfully' });
  } catch (error) {
    console.error('Error connecting to Apple Health:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Connect to Fitbit
router.post('/connect/fitbit', authenticate, async (req, res) => {
  try {
    const { accessToken, refreshToken, expiresAt } = req.body;

    // Store or update the token
    await prisma.userHealthToken.upsert({
      where: {
        userId_provider: {
          userId: req.user!.id,
          provider: 'FITBIT'
        }
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      create: {
        userId: req.user!.id,
        provider: 'FITBIT',
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    res.json({ message: 'Fitbit connected successfully' });
  } catch (error) {
    console.error('Error connecting to Fitbit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record daily progress
router.post('/record-progress', authenticate, async (req, res) => {
  try {
    const { userChallengeId, date, progress, verificationData } = req.body;

    // Get the challenge details
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true }
    });

    if (!userChallenge) {
      res.status(404).json({ message: 'Challenge participation not found' });
      return;
    }

    // Verify that the user owns this challenge participation
    if (userChallenge.userId !== req.user!.id) {
      res.status(403).json({ message: 'Not authorized to record progress for this challenge' });
      return;
    }

    // Check if goal was achieved
    const goalAchieved = progress >= userChallenge.challenge.goalTarget;

    // Create or update daily progress
    const dailyProgress = await prisma.dailyProgress.upsert({
      where: {
        userChallengeId_date: {
          userChallengeId,
          date: new Date(date)
        }
      },
      update: {
        progress,
        goalAchieved,
        verificationData
      },
      create: {
        userChallengeId,
        date: new Date(date),
        progress,
        goalAchieved,
        verificationData
      }
    });

    // Check if the challenge period has ended and update overall completion status
    const now = new Date();
    if (now > userChallenge.challenge.endDate) {
      // Count days where goal was achieved
      const dailyProgressRecords = await prisma.dailyProgress.findMany({
        where: {
          userChallengeId
        }
      });

      const totalDays = Math.ceil(
        (userChallenge.challenge.endDate.getTime() - userChallenge.challenge.startDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      const daysAchieved = dailyProgressRecords.filter(day => day.goalAchieved).length;

      // If achieved goal on all days, mark as completed
      if (daysAchieved === totalDays) {
        await prisma.userChallenge.update({
          where: { id: userChallengeId },
          data: { hasCompletedGoal: true }
        });
      }
    }

    res.json(dailyProgress);
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;