// backend/src/routes/payment.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../index';
import * as web3 from '@solana/web3.js';

const router = express.Router();

// Initialize Solana connection (devnet for testing)
const connection = new web3.Connection(
  web3.clusterApiUrl('devnet'),
  'confirmed'
);

// Process payment for joining a challenge
router.post('/stake', authenticate, async (req, res) => {
  try {
    const { userChallengeId, transactionHash } = req.body;

    // Verify the userChallenge exists and belongs to the user
    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        id: userChallengeId,
        userId: req.user!.id
      },
      include: {
        challenge: true
      }
    });

    if (!userChallenge) {
      return res.status(404).json({ message: 'Challenge participation not found' });
    }

    // Verify the transaction on Solana
    try {
      const transaction = await connection.getTransaction(
        transactionHash,
        { commitment: 'confirmed' }
      );

      if (!transaction) {
        return res.status(400).json({ message: 'Transaction not found on blockchain' });
      }

      // Update payment status
      await prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: {
          paymentStatus: 'PAID',
          transactionHash
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          message: `You've successfully staked ${userChallenge.challenge.entryFee} for the "${userChallenge.challenge.title}" challenge.`,
          type: 'PAYMENT_RECEIVED'
        }
      });

      res.json({
        message: 'Payment successful',
        status: 'PAID'
      });
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return res.status(400).json({ message: 'Failed to verify transaction' });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment status
router.get('/status/:userChallengeId', authenticate, async (req, res) => {
  try {
    const { userChallengeId } = req.params;

    const userChallenge = await prisma.userChallenge.findUnique({
      where: {
        id: userChallengeId,
        userId: req.user!.id
      },
      select: {
        paymentStatus: true,
        transactionHash: true
      }
    });

    if (!userChallenge) {
      return res.status(404).json({ message: 'Challenge participation not found' });
    }

    res.json(userChallenge);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Distribute rewards for a completed challenge
router.post('/distribute-rewards/:challengeId', authenticate, async (req