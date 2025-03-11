// backend/src/routes/challenge.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all public challenges
router.get('/public', authenticate, async (req, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        isPrivate: false,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    res.json(challenges);
  } catch (error) {
    console.error('Error fetching public challenges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's challenges
router.get('/my', authenticate, async (req, res) => {
  try {
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId: req.user!.id
      },
      include: {
        challenge: true,
        dailyProgress: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    res.json(userChallenges);
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new challenge
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      entryFee,
      startDate,
      endDate,
      goalType,
      goalTarget,
      isPrivate
    } = req.body;

    // Generate invitation code for private challenges
    const invitationCode = isPrivate ? uuidv4().substring(0, 8) : null;

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        entryFee,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        goalType,
        goalTarget,
        isPrivate,
        invitationCode,
        participants: {
          create: {
            userId: req.user!.id
          }
        }
      }
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a challenge
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { invitationCode } = req.body;

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if the challenge is private and requires an invitation code
    if (challenge.isPrivate && challenge.invitationCode !== invitationCode) {
      return res.status(403).json({ message: 'Invalid invitation code' });
    }

    // Check if user is already participating
    const existingParticipation = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: req.user!.id,
          challengeId: id
        }
      }
    });

    if (existingParticipation) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }

    // Join the challenge
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId: req.user!.id,
        challengeId: id
      }
    });

    res.status(201).json(userChallenge);
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get challenge leaderboard
router.get('/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get participants and their progress
    const participants = await prisma.userChallenge.findMany({
      where: {
        challengeId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true
          }
        },
        dailyProgress: true
      }
    });

    // Calculate total progress for each participant
    const leaderboard = participants.map(participant => {
      const totalProgress = participant.dailyProgress.reduce(
        (sum, day) => sum + day.progress,
        0
      );
      
      const daysCompleted = participant.dailyProgress.filter(
        day => day.goalAchieved
      ).length;

      return {
        userId: participant.user.id,
        name: participant.user.name,
        profileImageUrl: participant.user.profileImageUrl,
        totalProgress,
        daysCompleted,
        hasCompletedGoal: participant.hasCompletedGoal
      };
    });

    // Sort by total progress in descending order
    leaderboard.sort((a, b) => b.totalProgress - a.totalProgress);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;