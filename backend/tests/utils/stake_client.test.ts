// // import { StakeClient } from '../../src/utils/stake_client';
// // import { SolanaUtils } from '../../src/utils/solana_utils';
// // import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// // import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// // import * as dotenv from 'dotenv';
// // import { Wallet } from '@project-serum/anchor';

// // describe('Solana Wallet Utils - Integration Tests', () => {
// //     let stakeClient: StakeClient;
// //     let connection: Connection;
// //     let solanaUtils: SolanaUtils;
// //     let keypair:Keypair
// //     let userPubKey: string = "F3m283YDP1wHu8sYW3FHAW4qDh1rX9HAxc7fYHGNhxdH";
// //     dotenv.config();

// //     const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
// //     beforeAll(async () => {
// //         solanaUtils = new SolanaUtils(connection);
// //         // let wallet = Keypair.generate();
// //         connection = new Connection(solanaEndpoint, 'confirmed');
// //         //const wallet = await solanaUtils.createWalletForUser(userId);
// //         const privateKeyString = process.env.ADMIN_PRIVATE_KEY || "";
// //         const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
// //         keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
// //         console.log("Admin wallet",keypair.publicKey.toString());
// //         const privateKeyString2 = process.env.ADMIN_PRIVATE_KEY || "";
// //         const privateKeyArray2 = privateKeyString2.split(',').map(num => parseInt(num.trim()));
// //         const  keypair2 = Keypair.fromSecretKey(new Uint8Array(privateKeyArray2));
// //         console.log("User wallet",keypair2.publicKey.toString());
// //         stakeClient = new StakeClient(connection,new Wallet(keypair),new Wallet(keypair2));
// //     });

// //     it('should initialize stake pool', async () => {
// //             const signer = new Keypair();
// //             const result = await stakeClient.initializePool(1 * LAMPORTS_PER_SOL,86400);
// //             expect(result).not.toBeNull();
// //         }
// //     );
// //     // it('should create a wallet for a user using HD derivation', async () => {
    
// //     //     const result = await solanaUtils.createWalletForUser(userId);
    
// //     //     expect(result).toHaveProperty('keypair');
// //     //     const walletPubKey = result.keypair.publicKey.toString();
// //     //     const walletPriKey = result.keypair.secretKey.toString();
// //     //     expect(walletPubKey).not.toBeNull();
// //     //     expect(walletPriKey).not.toBeNull();
// //     //   });

// //     // it('should get pool info', async () => {
// //     //         const result = await stakeClient.getPoolInfo();
// //     //         expect(result).not.toBeNull();
// //     //     }
// //     // );

// //     // it('should get user stake info', async () => {
// //     //     const result = await stakeClient.getUserStakeInfo();
// //     //     expect(result).not.toBeNull();
// //     // });

// //     // it('should stake SOl for user', async () => {
// //     //         const result = await stakeClient.stake(1);
// //     //         expect(result).not.toBeNull();
// //     //     }
// //     // );
// // });

// import { randomBytes } from 'node:crypto';
// import * as anchor from '@coral-xyz/anchor';
// import { TOKEN_2022_PROGRAM_ID, type TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
// import { LAMPORTS_PER_SOL, PublicKey, Connection, clusterApiUrl,Keypair } from '@solana/web3.js';
// import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
// import { Idl,AnchorProvider,Program,Wallet,BN } from '@project-serum/anchor';
// import idl from '../../src/idl/run_stake.json';
// import * as dotenv from 'dotenv';
// import { confirmTransaction, createAccountsMintsAndTokenAccounts, makeKeypairs } from '@solana-developers/helpers';

// // Work on both Token Program and new Token Extensions Program
// const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

// const SECONDS = 1000;

// // Tests must complete within half this time otherwise
// // they are marked as slow. Since Anchor involves a little
// // network IO, these tests usually take about 15 seconds.
// const ANCHOR_SLOW_TEST_THRESHOLD = 40 * SECONDS;
// jest.setTimeout(ANCHOR_SLOW_TEST_THRESHOLD);
// const getRandomBigNumber = (size = 8) => {
//   return new BN(randomBytes(size));
// };

// describe('escrow', () => {
//   // Use the cluster and the keypair from Anchor.toml
//   // const provider = anchor.AnchorProvider.env();
//   // anchor.setProvider(provider);
//   dotenv.config();
//   const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
//   const connection = new Connection(solanaEndpoint, 'confirmed');
//   const privateKeyString = process.env.ADMIN_PRIVATE_KEY || "";
//   const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
//   const adminWallet = new Wallet(Keypair.fromSecretKey(new Uint8Array(privateKeyArray)));
//   const provider = new AnchorProvider(connection, adminWallet,{ commitment: 'confirmed' });

//   const user = (provider.wallet as anchor.Wallet).payer;
//   const payer = user;

//   // Program ID from your deployed contract
//   const programId = new PublicKey("Ae9WRFzaJBd5pfLBHphQdnfS3qa5qEtruPfMfro2n5ko");
//   const program = new Program(idl as Idl, programId, provider);
//   // const program = anchor.workspace.Escrow as Program<Escrow>;

//   // We're going to reuse these accounts across multiple tests
//   const accounts: Record<string, PublicKey> = {
//     tokenProgram: TOKEN_PROGRAM,
//     systemProgram: anchor.web3.SystemProgram.programId,
//     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//   };

//   let alice: anchor.web3.Keypair;
//   let bob: anchor.web3.Keypair;
//   let tokenMintA: anchor.web3.Keypair;
//   let tokenMintB: anchor.web3.Keypair;

//   [alice, bob, tokenMintA, tokenMintB] = makeKeypairs(4);

//   const tokenAOfferedAmount = new BN(1_000_000);
//   const tokenBWantedAmount = new BN(1_000_000);
//   //'Creates Alice and Bob accounts, 2 token mints, and associated token accounts for both tokens for both users', 
//   beforeAll(async () => {
//     const usersMintsAndTokenAccounts = await createAccountsMintsAndTokenAccounts(
//       [
//         // Alice's token balances
//         [
//           // 1_000_000 of token A
//           1_000_000,
//           // 0 of token B
//           0,
//         ],
//         // Bob's token balances
//         [
//           // 0 of token A
//           0,
//           // 1_000_000 of token B
//           1_000_000,
//         ],
//       ],
//       0.1 * LAMPORTS_PER_SOL,
//       connection,
//       payer,
//     );

//     // Alice will be the maker (creator) of the offer
//     // Bob will be the taker (acceptor) of the offer
//     const users = usersMintsAndTokenAccounts.users;
//     alice = users[0];
//     bob = users[1];
//     console.log("Alice",alice.publicKey.toString(),"Bob",bob.publicKey.toString()); 
//     // tokenMintA represents the token Alice is offering
//     // tokenMintB represents the token Alice wants in return
//     const mints = usersMintsAndTokenAccounts.mints;
//     tokenMintA = mints[0];
//     tokenMintB = mints[1];
//     console.log("Token Mint A",tokenMintA.publicKey.toString(),"Token Mint B",tokenMintB.publicKey.toString());
//     const tokenAccounts = usersMintsAndTokenAccounts.tokenAccounts;

//     // aliceTokenAccountA is Alice's account for tokenA (the token she's offering)
//     // aliceTokenAccountB is Alice's account for tokenB (the token she wants)
//     const aliceTokenAccountA = tokenAccounts[0][0];
//     const aliceTokenAccountB = tokenAccounts[0][1];
//     console.log("Alice Token Account A",aliceTokenAccountA.toString(),"Alice Token Account B",aliceTokenAccountB.toString()); 
//     // bobTokenAccountA is Bob's account for tokenA (the token Alice is offering)
//     // bobTokenAccountB is Bob's account for tokenB (the token Alice wants)
//     const bobTokenAccountA = tokenAccounts[1][0];
//     const bobTokenAccountB = tokenAccounts[1][1];
//     console.log("Bob Token Account A",bobTokenAccountA.toString(),"Bob Token Account B",bobTokenAccountB.toString());
//     // Save the accounts for later use
//     // accounts.maker = alice.publicKey;
//     // accounts.taker = bob.publicKey;
//     accounts.tokenMint = new PublicKey("So11111111111111111111111111111111111111112"); //tokenMintA.publicKey;
//     accounts.authority= adminWallet.publicKey;
//     // accounts.makerTokenAccountA = aliceTokenAccountA;
//     // accounts.takerTokenAccountA = bobTokenAccountA;
//     // accounts.tokenMintB = tokenMintB.publicKey;
//     // accounts.makerTokenAccountB = aliceTokenAccountB;
//     // accounts.takerTokenAccountB = bobTokenAccountB;
//   });

//   it('Puts the tokens Alice offers into the vault when Alice makes an offer', async () => {
//     const [pool,poolBump] = await PublicKey.findProgramAddressSync(
//       [Buffer.from('pool'), accounts.tokenMint.toBuffer()],
//       program.programId,
//     );
//     console.log("Pool", pool.toString());
//     const minStakeAmountBN = new BN("1");
//     const lockPeriodBN = new BN("86400");
//     const vault = await getOrCreateAssociatedTokenAccount(
//         connection,
//         adminWallet.payer,
//         accounts.tokenMint,
//         pool,
//         true
//     );
//     console.log("Stake Vault", vault.address.toString());
//     const oraclePubkey = new PublicKey("4L5XRZ1Qqn6mBMdBpG8abghXAP6Xva5aevoMnqnWKV2c");
//     accounts.pool = pool;
//     accounts.stakeVault = vault.address;
//     accounts.oracle = oraclePubkey; 

//     const transactionSignature = await program.methods
//       .initializePool(minStakeAmountBN, lockPeriodBN)
//       .accounts({ ...accounts })
//       .signers([adminWallet.payer])
//       .rpc();

//     await confirmTransaction(connection, transactionSignature);
//     console.log(`Use 'solana confirm -v ${transactionSignature}' to see the logs`);
//     // Check our vault contains the tokens offered
//     const vaultBalanceResponse = await connection.getTokenAccountBalance(vault.address);
//     const vaultBalance = new BN(vaultBalanceResponse.value.amount);
//     console.log("Vault Balance",vaultBalance.toString());
//     // expect(vaultBalance.eq(tokenAOfferedAmount));

//     // Check our Offer account contains the correct data
//     const poolAccount = await program.account.offer.fetch(pool);
//     console.log("Pool Account",poolAccount);
//     expect(poolAccount.notEqual(null));
//     expect(poolAccount.authority.equals(adminWallet.publicKey));
//     // expect(poolAccount.maker.equals(alice.publicKey));
//     // expect(poolAccount.tokenMintA.equals(accounts.tokenMintA));
//     // expect(poolAccount.tokenMintB.equals(accounts.tokenMintB));
//     // expect(poolAccount.tokenBWantedAmount.eq(tokenBWantedAmount));
//   })

// //   it("Puts the tokens from the vault into Bob's account, and gives Alice Bob's tokens, when Bob takes an offer", async () => {
// //     const transactionSignature = await program.methods
// //       .takeOffer()
// //       .accounts({ ...accounts })
// //       .signers([bob])
// //       .rpc();

// //     await confirmTransaction(connection, transactionSignature);

// //     // Check the offered tokens are now in Bob's account
// //     // (note: there is no before balance as Bob didn't have any offered tokens before the transaction)
// //     const bobTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.takerTokenAccountA);
// //     const bobTokenAccountBalanceAfter = new BN(bobTokenAccountBalanceAfterResponse.value.amount);
// //     expect(bobTokenAccountBalanceAfter.eq(tokenAOfferedAmount));

// //     // Check the wanted tokens are now in Alice's account
// //     // (note: there is no before balance as Alice didn't have any wanted tokens before the transaction)
// //     const aliceTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.makerTokenAccountB);
// //     const aliceTokenAccountBalanceAfter = new BN(aliceTokenAccountBalanceAfterResponse.value.amount);
// //     expect(aliceTokenAccountBalanceAfter.eq(tokenBWantedAmount));
// //   });
// });
