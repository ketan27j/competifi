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

    const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
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

  it('should return keypair from private key bytes', async () => {
    const privateKeyString = "191,30,121,205,146,114,208,157,229,140,137,41,189,1,8,120,247,27,90,162,78,106,178,57,240,55,185,175,175,24,42,141,49,118,54,73,227,38,136,157,70,68,92,89,145,50,227,248,133,251,248,23,215,106,220,238,147,249,239,51,234,46,191,141";
    const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
    const keypair = await solanaUtils.createKeypairFromPrivateKey(new Uint8Array(privateKeyArray));
    expect(keypair).toHaveProperty('publicKey');
    expect(keypair).toHaveProperty('secretKey');
    const walletPubKey = keypair.publicKey.toString();
    const walletPriKey = keypair.secretKey.toString();
    expect(walletPubKey).not.toBeNull();
    expect(walletPriKey).not.toBeNull();
    expect(walletPriKey).toEqual(privateKeyString);
    expect(walletPubKey).toEqual('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c');
  });

  // it('should airdrop SOL to a wallet', async () => {
  //   const result = await solanaUtils.requestAirdrop(connection,new PublicKey('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c'), 5);
  //   expect(result).toEqual(1);
  // });

  it('should return balance of a wallet', async () => {
    const balance = await solanaUtils.getBalance(connection,new PublicKey('4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c'));  
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

