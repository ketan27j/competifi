import { SolanaUtils } from '../../src/utils/solana_utils';
import { prisma } from '../../src/index'; // Ensure this import is correct
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

describe('Solana Wallet Utils - Integration Tests', () => {
    const userId = 'test-user-id';
    let solanaUtils: SolanaUtils;
    let connection: Connection;
    dotenv.config();

  beforeAll(async () => {
    // Set up test database connection if needed
    // await prisma.$connect();
    const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
    connection = new Connection(solanaEndpoint, 'confirmed');
    solanaUtils = new SolanaUtils(connection);
  });

  // it('should create a wallet for a user using HD derivation', async () => {
  //   const result = await solanaUtils.createWalletForUser(userId);
  //   expect(result).toHaveProperty('keypair');
  //   const walletPubKey = result.keypair.publicKey.toString();
  //   const walletPriKey = result.keypair.secretKey.toString();
  //   expect(walletPubKey).not.toBeNull();
  //   expect(walletPriKey).not.toBeNull();
  // });

  // it('should return keypair from private key bytes', async () => {
  //   const privateKeyString = process.env.ADMIN_PRIVATE_KEY || "";
  //   const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
  //   const keypair = await solanaUtils.createKeypairFromPrivateKey(new Uint8Array(privateKeyArray));
  //   expect(keypair).toHaveProperty('publicKey');
  //   expect(keypair).toHaveProperty('secretKey');
  //   const walletPubKey = keypair.publicKey.toString();
  //   const walletPriKey = keypair.secretKey.toString();
  //   expect(walletPubKey).not.toBeNull();
  //   expect(walletPriKey).not.toBeNull();
  //   expect(walletPriKey).toEqual(privateKeyString);
  //   expect(walletPubKey).toEqual('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c');
  // });

  // it('should airdrop SOL to a wallet', async () => {
  //   const result = await solanaUtils.requestAirdrop(connection,new PublicKey('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c'), 5);
  //   expect(result).toBeGreaterThan(1);
  // });

  // it('should airdrop SOL to a wallet', async () => {
  //   const result = await solanaUtils.requestAirdrop(connection,new PublicKey('F3m283YDP1wHu8sYW3FHAW4qDh1rX9HAxc7fYHGNhxdH'), 5);
  //   expect(result).toBeGreaterThan(1);
  // });

  it('should return balance of a wallet', async () => {
    const balance = await solanaUtils.getBalance(connection,new PublicKey('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c'));  
    expect(balance).toBeGreaterThan(0);
  });
  it('should return balance of a wallet', async () => {
    const balance = await solanaUtils.getBalance(connection,new PublicKey('F3m283YDP1wHu8sYW3FHAW4qDh1rX9HAxc7fYHGNhxdH'));  
    expect(balance).toBeGreaterThan(0);
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

