import { SolanaWallet } from '../../src/utils/solana-wallet';
import { prisma } from '../../src/index'; // Ensure this import is correct
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { clusterApiUrl, Connection } from '@solana/web3.js';

describe('Solana Wallet Utils - Integration Tests', () => {
    const userId = 'test-user-id';
    let solanaWallet: SolanaWallet;
    let connection: Connection;

  beforeAll(async () => {
    // Set up test database connection if needed
    // await prisma.$connect();
    connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    solanaWallet = new SolanaWallet(connection);
  });

//   afterAll(async () => {
//     // Clean up test database
//     await prisma.userWallet.deleteMany({ where: { userId } });
//     // await prisma.$disconnect();
//   });

  it('should create a wallet for a user using HD derivation', async () => {
    
    const result = await solanaWallet.createWalletForUser(userId);

    expect(result).toHaveProperty('keypair');
    const walletPubKey = result.keypair.publicKey.toString();
    const walletPriKey = result.keypair.secretKey.toString();
    expect(walletPubKey).not.toBeNull();
    expect(walletPriKey).not.toBeNull();
  });

//   it('should create a wallet for a user using Shamir\'s Secret Sharing', async () => {
//     const result = await createWalletForUser(userId);

//     expect(result).toHaveProperty('publicKey');
//     expect(result).toHaveProperty('clientKeyShare');
//     const wallet = await prisma.userWallet.findUnique({ where: { userId } });
//     expect(wallet).not.toBeNull();
//     expect(wallet?.publicKey).toEqual(result.publicKey);
//   });
});
// Removed incorrect function definitions

