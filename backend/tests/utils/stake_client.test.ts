import { StakeClient } from '../../src/utils/stake_client';
import { SolanaUtils } from '../../src/utils/solana_utils';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as dotenv from 'dotenv';

describe('Solana Wallet Utils - Integration Tests', () => {
    const userId = 'test-user-id';
    let stakeClient: StakeClient;
    let connection: Connection;
    let solanaUtils: SolanaUtils;
    let userPubKey: string = "4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c";
    dotenv.config();

    const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
    beforeAll(async () => {
        solanaUtils = new SolanaUtils(connection);
        // let wallet = Keypair.generate();
        connection = new Connection(solanaEndpoint, 'confirmed');
        //const wallet = await solanaUtils.createWalletForUser(userId);
        const privateKeyString = "191,30,121,205,146,114,208,157,229,140,137,41,189,1,8,120,247,27,90,162,78,106,178,57,240,55,185,175,175,24,42,141,49,118,54,73,227,38,136,157,70,68,92,89,145,50,227,248,133,251,248,23,215,106,220,238,147,249,239,51,234,46,191,141";
        const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
        const keypair = await solanaUtils.createKeypairFromPrivateKey(new Uint8Array(privateKeyArray));
        const walletAdapter = await solanaUtils.createWalletAdapter(keypair);
        stakeClient = new StakeClient(connection,walletAdapter);
    });

    // it('should create a wallet for a user using HD derivation', async () => {
    
    //     const result = await solanaUtils.createWalletForUser(userId);
    
    //     expect(result).toHaveProperty('keypair');
    //     const walletPubKey = result.keypair.publicKey.toString();
    //     const walletPriKey = result.keypair.secretKey.toString();
    //     expect(walletPubKey).not.toBeNull();
    //     expect(walletPriKey).not.toBeNull();
    //   });

    // it('should get pool info', async () => {
    //         const result = await stakeClient.getPoolInfo();
    //         expect(result).not.toBeNull();
    //     }
    // );

    // it('should get user stake info', async () => {
    //     const result = await stakeClient.getUserStakeInfo();
    //     expect(result).not.toBeNull();
    // });
    it('should initialize stake pool', async () => {
            const result = await stakeClient.initializePool(0.1 * LAMPORTS_PER_SOL,86400);
            expect(result).not.toBeNull();
        }
    );

    // it('should stake SOl for user', async () => {
    //         const result = await stakeClient.stake(1);
    //         expect(result).not.toBeNull();
    //     }
    // );
});