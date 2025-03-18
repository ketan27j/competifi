import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionConfirmationStrategy } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import idl from '../idl/run_stake.json';
import { Idl } from '@project-serum/anchor';
import { Wallet } from '@project-serum/anchor/dist/cjs/provider';

export class StakeClient {
    SOLANA_ENDPOINT: string;
    connection: Connection;
    wallet: Wallet;
    provider: AnchorProvider;
    program: any;
    programId: PublicKey;
    tokenMint: PublicKey;
    constructor(connection:Connection, wallet: Wallet) {
        this.connection = connection;
        this.wallet = wallet;
        this.SOLANA_ENDPOINT = process.env.SOLANA_ENDPOINT || '';

        this.provider = new AnchorProvider(connection, wallet,{ commitment: 'processed' });
        
        // Program ID from your deployed contract
        this.programId = new PublicKey("Ae9WRFzaJBd5pfLBHphQdnfS3qa5qEtruPfMfro2n5ko");
        this.program = new Program(idl as Idl, this.programId, this.provider);
        
        // Token mint for the staking token (SOL or your custom token)
        this.tokenMint = new PublicKey("So11111111111111111111111111111111111111112");
    }

    // Initialize a new staking pool
    async initializePool(minStakeAmount:number, lockPeriod:number) {
        const [poolPda, poolBump] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), this.tokenMint.toBuffer()],
        this.programId
        );
        
        // Convert parameters to BN
        const minStakeAmountBN = new BN(minStakeAmount.toString());
        const lockPeriodBN = new BN(lockPeriod.toString());
        
        // Create token accounts for the pool
        const stakeVault = await getAssociatedTokenAddress(
        this.tokenMint,
        poolPda,
        true // allowOwnerOffCurve
        );
        
        const rewardVault = await getAssociatedTokenAddress(
        this.tokenMint,
        poolPda,
        true // allowOwnerOffCurve
        );
        
        // Oracle public key (replace with your actual oracle)
        const oraclePubkey = new PublicKey("4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c");
        
        try {
        const tx = await this.program.methods
            .initializePool(minStakeAmountBN, lockPeriodBN)
            .accounts({
            pool: poolPda,
            tokenMint: this.tokenMint,
            stakeVault: stakeVault,
            rewardVault: rewardVault,
            authority: this.wallet.publicKey,
            oracle: oraclePubkey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();
        
        console.log("Pool initialization successful:", tx);
        return tx;
        } catch (error) {
        console.error("Error initializing pool:", error);
        throw error;
        }
    }
    
    // Get pool information
    async getPoolInfo() {
        const [poolPda] = await PublicKey.findProgramAddress(
            [Buffer.from("pool"), this.tokenMint.toBuffer()],
            this.programId
        );
        try {
            return await this.program.account.stakePool.fetch(poolPda);
        } catch (error) {
            console.error("Error fetching pool info:", error);
            return null;
        }
    }

    // Get user stake information
    async getUserStakeInfo(userPubkey = this.wallet.publicKey) {
        const [poolPda] = await PublicKey.findProgramAddress(
        [Buffer.from("pool"), this.tokenMint.toBuffer()],
        this.programId
        );
        
        const [userStakePda] = await PublicKey.findProgramAddress(
        [Buffer.from("user_stake"), poolPda.toBuffer(), userPubkey.toBuffer()],
        this.programId
        );
        
        try {
            return await this.program.account.userStake.fetch(userStakePda);
        } catch (error) {
            console.error("Error fetching user stake info:", error);
            return null;
        }
    }

    // Stake SOL into the pool
    async stake(amount: number) {
        const amountLamports = new BN(amount * LAMPORTS_PER_SOL);
        
        const [poolPda] = await PublicKey.findProgramAddress(
            [Buffer.from("pool"), this.tokenMint.toBuffer()],
            this.programId
        );
        
        const [userStakePda] = await PublicKey.findProgramAddress(
            [Buffer.from("user_stake"), poolPda.toBuffer(), this.wallet.publicKey.toBuffer()],
            this.programId
        );
        
        // Get user and pool token accounts
        const userTokenAccount = await getAssociatedTokenAddress(
            this.tokenMint,
            this.wallet.publicKey
        );
        
        const poolTokenAccount = await getAssociatedTokenAddress(
            this.tokenMint,
            poolPda,
            true // allowOwnerOffCurve
        );
        
        try {
            const signature = await this.program.methods
            .stake(amountLamports)
            .accounts({
              pool: poolPda,
              userStake: userStakePda,
              userTokenAccount: userTokenAccount,
              stakeVault: poolTokenAccount,
              user: this.wallet.publicKey,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc();

        console.log("Stake successful:", signature);
        return signature;
        } catch (error) {
        console.error("Error staking:", error);
        throw error;
        }
    }

    // // Unstake SOL from the pool
    // async unstake(amount: number) {
    //     const amountLamports = amount * LAMPORTS_PER_SOL;
        
    //     const [poolPda] = await PublicKey.findProgramAddress(
    //     [Buffer.from("pool"), this.tokenMint.toBuffer()],
    //     this.programId
    //     );
        
    //     const [poolAuthority] = await PublicKey.findProgramAddress(
    //     [Buffer.from("pool"), this.tokenMint.toBuffer()],
    //     this.programId
    //     );
        
    //     const [userStakePda] = await PublicKey.findProgramAddress(
    //     [Buffer.from("user_stake"), poolPda.toBuffer(), this.wallet.publicKey.toBuffer()],
    //     this.programId
    //     );
        
    //     // Get user and pool token accounts
    //     const userTokenAccount = await getAssociatedTokenAddress(
    //     this.tokenMint,
    //     this.wallet.publicKey
    //     );
        
    //     const poolTokenAccount = await getAssociatedTokenAddress(
    //     this.tokenMint,
    //     poolPda,
    //     true // allowOwnerOffCurve
    //     );
        
    //     try {
    //     const tx = await this.program.methods
    //         .unstake(new BN(amountLamports))
    //         .accounts({
    //         pool: poolPda,
    //         poolAuthority: poolAuthority,
    //         userStake: userStakePda,
    //         userTokenAccount: userTokenAccount,
    //         stakeVault: poolTokenAccount,
    //         user: this.wallet.publicKey,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         })
    //         .transaction();
        
    //     // Sign and send transaction
    //     const txSignature = await this.wallet.sendTransaction(tx, this.connection);
    //     await this.connection.confirmTransaction(txSignature, 'confirmed');
        
    //     console.log("Unstake successful:", txSignature);
    //     return txSignature;
    //     } catch (error) {
    //     console.error("Error unstaking:", error);
    //     throw error;
    //     }
    // }

    // // Claim rewards based on running activity
    // async claimRewards(runDistance, runTimestamp) {
    //     const [poolPda] = await PublicKey.findProgramAddress(
    //     [Buffer.from("pool"), this.tokenMint.toBuffer()],
    //     this.programId
    //     );
        
    //     const [poolAuthority] = await PublicKey.findProgramAddress(
    //     [Buffer.from("pool"), this.tokenMint.toBuffer()],
    //     this.programId
    //     );
        
    //     const [userStakePda] = await PublicKey.findProgramAddress(
    //     [Buffer.from("user_stake"), poolPda.toBuffer(), this.wallet.publicKey.toBuffer()],
    //     this.programId
    //     );
        
    //     // Get user and reward token accounts
    //     const userTokenAccount = await getAssociatedTokenAddress(
    //     this.tokenMint,
    //     this.wallet.publicKey
    //     );
        
    //     const rewardVault = await getAssociatedTokenAddress(
    //     this.tokenMint,
    //     poolPda,
    //     true // allowOwnerOffCurve
    //     );
        
    //     // In a real implementation, you'd have an oracle signing this transaction
    //     // For this example, we're using a fixed oracle public key
    //     const oraclePubkey = new PublicKey("ORACLE_PUBLIC_KEY");
        
    //     try {
    //     const tx = await this.program.methods
    //         .claimRewards(new BN(runDistance), new BN(runTimestamp))
    //         .accounts({
    //         pool: poolPda,
    //         poolAuthority: poolAuthority,
    //         userStake: userStakePda,
    //         userTokenAccount: userTokenAccount,
    //         rewardVault: rewardVault,
    //         user: this.wallet.publicKey,
    //         oracle: oraclePubkey,
    //         tokenProgram: TOKEN_PROGRAM_ID,
    //         })
    //         .transaction();
        
    //     // Sign and send transaction
    //     const txSignature = await this.wallet.sendTransaction(tx, this.connection);
    //     await this.connection.confirmTransaction(txSignature, 'confirmed');
        
    //     console.log("Claim rewards successful:", txSignature);
    //     return txSignature;
    //     } catch (error) {
    //     console.error("Error claiming rewards:", error);
    //     throw error;
    //     }
    // }
    }

    // // Example usage
    // async function initializeClientAndStake() {
    // // Connect to Solana network (replace with your preferred endpoint)
    // const connection = new Connection("https://api.mainnet-beta.solana.com");

    // // Initialize wallet adapter (this depends on your frontend setup)
    // // Example with Phantom:
    // const wallet = window.solana;
    // await wallet.connect();

    // // Create client
    // const runStakeClient = new RunStakeClient(connection, wallet);

    // // Stake 1 SOL
    // await runStakeClient.stake(1);

    // // Get user stake info
    // const userStakeInfo = await runStakeClient.getUserStakeInfo();
    // console.log("User stake info:", userStakeInfo);
// }
