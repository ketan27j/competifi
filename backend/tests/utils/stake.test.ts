// import { randomBytes } from 'node:crypto';
// import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccount, createMint, getAssociatedTokenAddressSync, mintTo } from '@solana/spl-token';
// import { LAMPORTS_PER_SOL, PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
// import { describe, it, expect, beforeAll, jest } from '@jest/globals';
// import { Idl, AnchorProvider, Program, Wallet, BN } from '@project-serum/anchor';
// import idl from '../../src/idl/competifi.json';
// import * as dotenv from 'dotenv';

// import { 
//   confirmTransaction, 
//   createAccountsMintsAndTokenAccounts, 
//   makeKeypairs 
// } from '@solana-developers/helpers';

// // Work on both Token Program and new Token Extensions Program
// const TOKEN_PROGRAM = TOKEN_2022_PROGRAM_ID;

// const SECONDS = 1000;

// // Tests must complete within this time
// const ANCHOR_SLOW_TEST_THRESHOLD = 40 * SECONDS;
// jest.setTimeout(ANCHOR_SLOW_TEST_THRESHOLD);

// const getRandomBigNumber = (size = 8) => {
//   return new BN(randomBytes(size));
// };

// describe('run-to-earn', () => {
//   dotenv.config();
//   const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
//   const connection = new Connection(solanaEndpoint, 'confirmed');
  
//   // Admin wallet setup - replace with your private key or use environment variable
//   const privateKeyString = process.env.ADMIN_PRIVATE_KEY || "";
//   const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
//   const adminWallet = new Wallet(Keypair.fromSecretKey(new Uint8Array(privateKeyArray)));
//   const provider = new AnchorProvider(connection, adminWallet, { commitment: 'confirmed' });

//   const payer = (provider.wallet as Wallet).payer;

//   // Program ID from your deployed contract - update with your program ID
//   const programId = new PublicKey("J5zNJDGWbtDNoR82eQ8joEoGP7VPweLHpAjWoGqToUsT");
//   const program = new Program(idl as Idl, programId, provider);

//   // Account storage
//   const accounts: Record<string, PublicKey> = {
//     tokenProgram: TOKEN_PROGRAM,
//   };

//   // Contest creator and token mints
//   let contestCreator: Keypair;
//   let rewardTokenMint: PublicKey;
//   let entryFeeTokenMint: PublicKey;
  
//   // Runners (participants)
//   let runner1: Keypair;
//   let runner2: Keypair;
//   let runner3: Keypair;
  
//   // Winner will be determined later
//   let winnerKeypair: Keypair;

//     // Token accounts
//     let creatorRewardTokenAccount: PublicKey;
//     let creatorEntryFeeTokenAccount: PublicKey;

//     let runner1RewardTokenAccount: PublicKey;
//     let runner1EntryFeeTokenAccount: PublicKey;

//     let runner2RewardTokenAccount: PublicKey;
//     let runner2EntryFeeTokenAccount: PublicKey;

//     let runner3RewardTokenAccount: PublicKey;
//     let runner3EntryFeeTokenAccount: PublicKey;

//   // Token amounts
//   const rewardAmount = new BN(5_000_000);
//   const entryFeeAmount = new BN(1_000_000);
  
//   beforeAll(async () => {
//     // Create keypairs for all participants and tokens
//     [contestCreator, runner1, runner2] = makeKeypairs(6);
    
//     console.log("Contest Creator:", contestCreator.publicKey.toString());
//     console.log("Runner 1:", runner1.publicKey.toString());
//     console.log("Runner 2:", runner2.publicKey.toString());

//     // // Create token mints and distribute tokens
//     // const usersMintsAndTokenAccounts = await createAccountsMintsAndTokenAccounts(
//     //   [
//     //     // Contest Creator's token balances [rewardToken, entryFeeToken]
//     //     [10_000_000, 0],
//     //     // Runner 1's token balances
//     //     [0, 2_000_000],
//     //     // Runner 2's token balances
//     //     [0, 2_000_000],
//     //   ],
//     //   0.1 * LAMPORTS_PER_SOL,
//     //   connection,
//     //   payer
//     // //   [rewardTokenMint, entryFeeTokenMint] // Use our predefined mints
//     // );
    
//     // const users = usersMintsAndTokenAccounts.users;
//     // // Replace keypairs with funded ones
//     // contestCreator = users[0];
//     // runner1 = users[1];
//     // runner2 = users[2];
    
//     // const mints = usersMintsAndTokenAccounts.mints;
//     // rewardTokenMint = mints[0];
//     // entryFeeTokenMint = mints[1];
    
//     // console.log("Reward Token Mint:", rewardTokenMint.publicKey.toString());
//     // console.log("Entry Fee Token Mint:", entryFeeTokenMint.publicKey.toString());
    
//     // const tokenAccounts = usersMintsAndTokenAccounts.tokenAccounts;
    
//     // // Contest creator's token accounts
//     // const creatorRewardTokenAccount = tokenAccounts[0][0];
//     // const creatorEntryFeeTokenAccount = tokenAccounts[0][1];
    
//     // // Runner 1's token accounts
//     // const runner1RewardTokenAccount = tokenAccounts[1][0];
//     // const runner1EntryFeeTokenAccount = tokenAccounts[1][1];
    
//     // // Runner 2's token accounts
//     // const runner2RewardTokenAccount = tokenAccounts[2][0];
//     // const runner2EntryFeeTokenAccount = tokenAccounts[2][1];
//     // Create token mints one by one instead of in a batch
//     const mintAuthority = payer;
//     const freezeAuthority = null;
//     const decimals = 6;
//     // Create reward token mint
//     const rewardMintKeypair = Keypair.generate();
//     rewardTokenMint = await createMint(
//       connection,
//       payer,
//       mintAuthority.publicKey,
//       freezeAuthority,
//       decimals,
//       rewardMintKeypair,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     // Create entry fee token mint
//     const entryFeeMintKeypair = Keypair.generate();
//     entryFeeTokenMint = await createMint(
//       connection,
//       payer,
//       mintAuthority.publicKey,
//       freezeAuthority,
//       decimals,
//       entryFeeMintKeypair,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     console.log("Reward Token Mint:", rewardTokenMint.toString());
//     console.log("Entry Fee Token Mint:", entryFeeTokenMint.toString());
    
//     // Create token accounts for all participants
//     creatorRewardTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       rewardTokenMint,
//       contestCreator.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     creatorEntryFeeTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       entryFeeTokenMint,
//       contestCreator.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     runner1RewardTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       rewardTokenMint,
//       runner1.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     runner1EntryFeeTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       entryFeeTokenMint,
//       runner1.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     runner2RewardTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       rewardTokenMint,
//       runner2.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     runner2EntryFeeTokenAccount = await createAssociatedTokenAccount(
//       connection,
//       payer,
//       entryFeeTokenMint,
//       runner2.publicKey,
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     // Mint tokens to participants
//     // Contest creator gets reward tokens
//     await mintTo(
//       connection,
//       payer,
//       rewardTokenMint,
//       creatorRewardTokenAccount,
//       mintAuthority,
//       10_000_000,
//       [],
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     // Runners get entry fee tokens
//     await mintTo(
//       connection,
//       payer,
//       entryFeeTokenMint,
//       runner1EntryFeeTokenAccount,
//       mintAuthority,
//       2_000_000,
//       [],
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );
    
//     await mintTo(
//       connection,
//       payer,
//       entryFeeTokenMint,
//       runner2EntryFeeTokenAccount,
//       mintAuthority,
//       2_000_000,
//       [],
//       { commitment: 'confirmed' },
//       TOKEN_PROGRAM
//     );

//     // Save accounts for later use
//     accounts.contestCreator = contestCreator.publicKey;
    
//     accounts.rewardTokenMint = rewardTokenMint;
//     accounts.entryFeeTokenMint = entryFeeTokenMint;
    
//     accounts.creatorRewardTokenAccount = creatorRewardTokenAccount;
//     accounts.creatorEntryFeeTokenAccount = creatorEntryFeeTokenAccount;
    
//     accounts.runner1 = runner1.publicKey;
//     accounts.runner1RewardTokenAccount = runner1RewardTokenAccount;
//     accounts.runner1EntryFeeTokenAccount = runner1EntryFeeTokenAccount;
    
//     accounts.runner2 = runner2.publicKey;
//     accounts.runner2RewardTokenAccount = runner2RewardTokenAccount;
//     accounts.runner2EntryFeeTokenAccount = runner2EntryFeeTokenAccount;
//   });

//   it('Contest creator creates an offer (escrow) with rewards', async () => {
//     // Pick a random ID for the contest
//     const contestId = getRandomBigNumber();
    
//     // Determine the offer and vault addresses
//     const contestOffer = PublicKey.findProgramAddressSync(
//       [Buffer.from('offer'), accounts.contestCreator.toBuffer(), contestId.toArrayLike(Buffer, 'le', 8)],
//       program.programId,
//     )[0];
    
//     const rewardVault = getAssociatedTokenAddressSync(
//       accounts.rewardTokenMint, 
//       contestOffer, 
//       true, 
//       TOKEN_PROGRAM
//     );
    
//     // Save for later use
//     accounts.contestOffer = contestOffer;
//     accounts.rewardVault = rewardVault;
    
//     // Contest creator makes an offer: puts up reward tokens and wants entry fee tokens
//     const transactionSignature = await program.methods
//       .makeOffer(contestId, rewardAmount, entryFeeAmount)
//       .accounts({
//         maker: accounts.contestCreator,
//         tokenMintA: accounts.rewardTokenMint,
//         tokenMintB: accounts.entryFeeTokenMint,
//         makerTokenAccountA: accounts.creatorRewardTokenAccount,
//         offer: accounts.contestOffer,
//         vault: accounts.rewardVault,
//         // associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
//         tokenProgram: TOKEN_PROGRAM,
//         // systemProgram: new PublicKey('11111111111111111111111111111111'),
//       })
//       .signers([contestCreator])
//       .rpc();
    
//     await confirmTransaction(connection, transactionSignature);
    
//     // Verify the vault has the reward tokens
//     const vaultBalanceResponse = await connection.getTokenAccountBalance(rewardVault);
//     const vaultBalance = new BN(vaultBalanceResponse.value.amount);
//     console.log("Vault Balance:", vaultBalance.toString());
//     expect(vaultBalance.eq(rewardAmount)).toBeTruthy();
    
//     // Verify the offer details
//     const offerAccount = await program.account.offer.fetch(contestOffer);
//     expect(offerAccount.maker.equals(contestCreator.publicKey)).toBeTruthy();
//     expect(offerAccount.tokenMintA.equals(accounts.rewardTokenMint)).toBeTruthy();
//     expect(offerAccount.tokenMintB.equals(accounts.entryFeeTokenMint)).toBeTruthy();
//     expect(offerAccount.tokenBWantedAmount.eq(entryFeeAmount)).toBeTruthy();
//   });
  
// //   it('Runners register for the contest by paying entry fees', async () => {
// //     // This would be a separate instruction in a real implementation
// //     // For our test, we'll just simulate runner registration
// //     console.log("All runners have paid their entry fees");
    
// //     // In a real implementation, each runner would send tokens to a registration account
// //     // Since our escrow example doesn't have this functionality, we'll just simulate it
// //   });
  
// //   it('Run the race and determine the winner', async () => {
// //     // Simulate a race and pick a winner
// //     // In a real implementation, this would involve an oracle or some other mechanism
    
// //     // Let's say runner2 wins the race
// //     winnerKeypair = runner2;
// //     accounts.winner = winnerKeypair.publicKey;
// //     accounts.winnerRewardTokenAccount = accounts.runner2RewardTokenAccount;
// //     accounts.winnerEntryFeeTokenAccount = accounts.runner2EntryFeeTokenAccount;
    
// //     console.log("Runner 2 won the race!");
// //   });
  
// //   it('Winner claims the reward', async () => {
// //     // Only the winner should be able to take the offer
// //     const transactionSignature = await program.methods
// //       .takeOffer()
// //       .accounts({
// //         taker: accounts.winner,
// //         maker: accounts.contestCreator,
// //         tokenMintA: accounts.rewardTokenMint,
// //         tokenMintB: accounts.entryFeeTokenMint,
// //         takerTokenAccountA: accounts.winnerRewardTokenAccount,
// //         takerTokenAccountB: accounts.winnerEntryFeeTokenAccount,
// //         makerTokenAccountB: accounts.creatorEntryFeeTokenAccount,
// //         offer: accounts.contestOffer,
// //         vault: accounts.rewardVault,
// //         associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
// //         tokenProgram: accounts.tokenProgram,
// //         systemProgram: new PublicKey('11111111111111111111111111111111'),
// //       })
// //       .signers([winnerKeypair])
// //       .rpc();
    
// //     await confirmTransaction(connection, transactionSignature);
    
// //     // Verify the winner received the reward tokens
// //     const winnerRewardBalanceResponse = await connection.getTokenAccountBalance(accounts.winnerRewardTokenAccount);
// //     const winnerRewardBalance = new BN(winnerRewardBalanceResponse.value.amount);
// //     expect(winnerRewardBalance.eq(rewardAmount)).toBeTruthy();
    
// //     // Verify the contest creator received the entry fee from the winner
// //     const creatorEntryFeeBalanceResponse = await connection.getTokenAccountBalance(accounts.creatorEntryFeeTokenAccount);
// //     const creatorEntryFeeBalance = new BN(creatorEntryFeeBalanceResponse.value.amount);
// //     expect(creatorEntryFeeBalance.eq(entryFeeAmount)).toBeTruthy();
// //   });
  
// //   it('Non-winner cannot claim the reward', async () => {
// //     // Create a new contest
// //     const contestId = getRandomBigNumber();
    
// //     const contestOffer = PublicKey.findProgramAddressSync(
// //       [Buffer.from('offer'), accounts.contestCreator.toBuffer(), contestId.toArrayLike(Buffer, 'le', 8)],
// //       program.programId,
// //     )[0];
    
// //     const rewardVault = getAssociatedTokenAddressSync(
// //       accounts.rewardTokenMint, 
// //       contestOffer, 
// //       true, 
// //       TOKEN_PROGRAM
// //     );
    
// //     accounts.contestOffer = contestOffer;
// //     accounts.rewardVault = rewardVault;
    
// //     // Contest creator makes an offer
// //     await program.methods
// //       .makeOffer(contestId, rewardAmount, entryFeeAmount)
// //       .accounts({
// //         maker: accounts.contestCreator,
// //         tokenMintA: accounts.rewardTokenMint,
// //         tokenMintB: accounts.entryFeeTokenMint,
// //         makerTokenAccountA: accounts.creatorRewardTokenAccount,
// //         offer: accounts.contestOffer,
// //         vault: accounts.rewardVault,
// //         associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
// //         tokenProgram: accounts.tokenProgram,
// //         systemProgram: new PublicKey('11111111111111111111111111111111'),
// //       })
// //       .signers([contestCreator])
// //       .rpc();
    
// //     // For this race, runner1 is the loser, runner3 is the winner
// //     let loserKeypair = runner1;
    
// //     // Set up winner accounts (not used in this test but needed for a real implementation)
// //     winnerKeypair = runner3;
// //     accounts.winner = winnerKeypair.publicKey;
    
// //     // Try to claim reward as a loser (should fail)
// //     try {
// //       await program.methods
// //         .takeOffer()
// //         .accounts({
// //           taker: loserKeypair.publicKey,
// //           maker: accounts.contestCreator,
// //           tokenMintA: accounts.rewardTokenMint,
// //           tokenMintB: accounts.entryFeeTokenMint,
// //           takerTokenAccountA: accounts.runner1RewardTokenAccount,
// //           takerTokenAccountB: accounts.runner1EntryFeeTokenAccount,
// //           makerTokenAccountB: accounts.creatorEntryFeeTokenAccount,
// //           offer: accounts.contestOffer,
// //           vault: accounts.rewardVault,
// //           associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
// //           tokenProgram: accounts.tokenProgram,
// //           systemProgram: new PublicKey('11111111111111111111111111111111'),
// //         })
// //         .signers([loserKeypair])
// //         .rpc();
      
// //       // If we get here, the transaction succeeded, which is not what we want
// //       expect(false).toBeTruthy(); // This should not execute
// //     } catch (error) {
// //       // We expect this to fail since the loser shouldn't be able to claim
// //       console.log("As expected, non-winner (runner1) cannot claim the reward");
// //       expect(true).toBeTruthy();
// //     }
    
// //     // Now let the actual winner claim the reward
// //     await program.methods
// //       .takeOffer()
// //       .accounts({
// //         taker: winnerKeypair.publicKey,
// //         maker: accounts.contestCreator,
// //         tokenMintA: accounts.rewardTokenMint,
// //         tokenMintB: accounts.entryFeeTokenMint,
// //         takerTokenAccountA: accounts.runner3RewardTokenAccount,
// //         takerTokenAccountB: accounts.runner3EntryFeeTokenAccount,
// //         makerTokenAccountB: accounts.creatorEntryFeeTokenAccount,
// //         offer: accounts.contestOffer,
// //         vault: accounts.rewardVault,
// //         associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
// //         tokenProgram: accounts.tokenProgram,
// //         systemProgram: new PublicKey('11111111111111111111111111111111'),
// //       })
// //       .signers([winnerKeypair])
// //       .rpc();
    
// //     console.log("Winner (runner3) successfully claimed the reward");
// //   });
// });