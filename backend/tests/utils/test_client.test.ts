import { randomBytes } from 'node:crypto';
import * as anchor from '@coral-xyz/anchor';
import { TOKEN_2022_PROGRAM_ID, type TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { LAMPORTS_PER_SOL, PublicKey, Connection, clusterApiUrl,Keypair } from '@solana/web3.js';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Idl,AnchorProvider,Program,Wallet,BN } from '@project-serum/anchor';
import idl from '../../src/idl/competifi.json';
import * as dotenv from 'dotenv';

import { confirmTransaction, createAccountsMintsAndTokenAccounts, makeKeypairs } from '@solana-developers/helpers';

// Work on both Token Program and new Token Extensions Program
const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

const SECONDS = 1000;

// Tests must complete within half this time otherwise
// they are marked as slow. Since Anchor involves a little
// network IO, these tests usually take about 15 seconds.
const ANCHOR_SLOW_TEST_THRESHOLD = 40 * SECONDS;
jest.setTimeout(ANCHOR_SLOW_TEST_THRESHOLD);
const getRandomBigNumber = (size = 8) => {
  return new BN(randomBytes(size));
};

describe('escrow', () => {
  // Use the cluster and the keypair from Anchor.toml
  // const provider = anchor.AnchorProvider.env();
  // anchor.setProvider(provider);
  dotenv.config();
  const solanaEndpoint = process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet');
  const connection = new Connection(solanaEndpoint, 'confirmed');
  const privateKeyString = process.env.ADMIN_PRIVATE_KEY || "";
  const privateKeyArray = privateKeyString.split(',').map(num => parseInt(num.trim()));
  const adminWallet = new Wallet(Keypair.fromSecretKey(new Uint8Array(privateKeyArray)));
  const provider = new AnchorProvider(connection, adminWallet,{ commitment: 'confirmed' });

  const user = (provider.wallet as anchor.Wallet).payer;
  const payer = user;

  // Program ID from your deployed contract
  const programId = new PublicKey("J5zNJDGWbtDNoR82eQ8joEoGP7VPweLHpAjWoGqToUsT");
  const program = new Program(idl as Idl, programId, provider);
  // const program = anchor.workspace.Escrow as Program<Escrow>;

  // We're going to reuse these accounts across multiple tests
  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
  };

  let alice: anchor.web3.Keypair;
  let bob: anchor.web3.Keypair;
  let tokenMintA: anchor.web3.Keypair;
  let tokenMintB: anchor.web3.Keypair;

  [alice, bob, tokenMintA, tokenMintB] = makeKeypairs(4);

  const tokenAOfferedAmount = new BN(1_000_000);
  const tokenBWantedAmount = new BN(1_000_000);
  //'Creates Alice and Bob accounts, 2 token mints, and associated token accounts for both tokens for both users', 
  beforeAll(async () => {
    const usersMintsAndTokenAccounts = await createAccountsMintsAndTokenAccounts(
      [
        // Alice's token balances
        [
          // 1_000_000_000 of token A
          1_000_000,
          // 0 of token B
          0,
        ],
        // Bob's token balances
        [
          // 0 of token A
          0,
          // 1_000_000_000 of token B
          1_000,
        ],
      ],
      0.1 * LAMPORTS_PER_SOL,
      connection,
      payer,
    );

    // Alice will be the maker (creator) of the offer
    // Bob will be the taker (acceptor) of the offer
    const users = usersMintsAndTokenAccounts.users;
    alice = users[0];
    bob = users[1];
    console.log("Alice",alice.publicKey.toString(),"Bob",bob.publicKey.toString()); 
    // tokenMintA represents the token Alice is offering
    // tokenMintB represents the token Alice wants in return
    const mints = usersMintsAndTokenAccounts.mints;
    tokenMintA = mints[0];
    tokenMintB = mints[1];
    console.log("Token Mint A",tokenMintA.publicKey.toString(),"Token Mint B",tokenMintB.publicKey.toString());
    const tokenAccounts = usersMintsAndTokenAccounts.tokenAccounts;

    // aliceTokenAccountA is Alice's account for tokenA (the token she's offering)
    // aliceTokenAccountB is Alice's account for tokenB (the token she wants)
    const aliceTokenAccountA = tokenAccounts[0][0];
    const aliceTokenAccountB = tokenAccounts[0][1];
    console.log("Alice Token Account A",aliceTokenAccountA.toString(),"Alice Token Account B",aliceTokenAccountB.toString()); 
    // bobTokenAccountA is Bob's account for tokenA (the token Alice is offering)
    // bobTokenAccountB is Bob's account for tokenB (the token Alice wants)
    const bobTokenAccountA = tokenAccounts[1][0];
    const bobTokenAccountB = tokenAccounts[1][1];
    console.log("Bob Token Account A",bobTokenAccountA.toString(),"Bob Token Account B",bobTokenAccountB.toString());
    // Save the accounts for later use
    accounts.maker = alice.publicKey;
    accounts.taker = bob.publicKey;
    accounts.tokenMintA = tokenMintA.publicKey;
    accounts.makerTokenAccountA = aliceTokenAccountA;
    accounts.takerTokenAccountA = bobTokenAccountA;
    accounts.tokenMintB = tokenMintB.publicKey;
    accounts.makerTokenAccountB = aliceTokenAccountB;
    accounts.takerTokenAccountB = bobTokenAccountB;
  });

  it('Puts the tokens Alice offers into the vault when Alice makes an offer', async () => {
    // Pick a random ID for the offer we'll make
    const offerId = getRandomBigNumber();

    // Then determine the account addresses we'll use for the offer and the vault
    const offer = PublicKey.findProgramAddressSync(
      [Buffer.from('offer'), accounts.maker.toBuffer(), offerId.toArrayLike(Buffer, 'le', 8)],
      program.programId,
    )[0];

    const vault = getAssociatedTokenAddressSync(accounts.tokenMintA, offer, true, TOKEN_PROGRAM);
    console.log("Offer",offer.toString(),"Vault",vault.toString());
    accounts.offer = offer;
    accounts.vault = vault;

    const transactionSignature = await program.methods
      .makeOffer(offerId, tokenAOfferedAmount, tokenBWantedAmount)
      .accounts({ ...accounts })
      .signers([alice])
      .rpc();

    await confirmTransaction(connection, transactionSignature);

    // Check our vault contains the tokens offered
    const vaultBalanceResponse = await connection.getTokenAccountBalance(vault);
    const vaultBalance = new BN(vaultBalanceResponse.value.amount);
    console.log("Vault Balance",vaultBalance.toString(),"Token A Offered Amount",tokenAOfferedAmount.toString());
    expect(vaultBalance.eq(tokenAOfferedAmount));

    // Check our Offer account contains the correct data
    const offerAccount = await program.account.offer.fetch(offer);

    expect(offerAccount.maker.equals(alice.publicKey));
    expect(offerAccount.tokenMintA.equals(accounts.tokenMintA));
    expect(offerAccount.tokenMintB.equals(accounts.tokenMintB));
    expect(offerAccount.tokenBWantedAmount.eq(tokenBWantedAmount));
    console.log("Offer Account tokenBWantedAmount",offerAccount.tokenBWantedAmount.toString());
  })

  it("Puts the tokens from the vault into Bob's account, and gives Alice Bob's tokens, when Bob takes an offer", async () => {
    const transactionSignature = await program.methods
      .takeOffer()
      .accounts({ ...accounts })
      .signers([bob])
      .rpc();

    await confirmTransaction(connection, transactionSignature);

    // Check the offered tokens are now in Bob's account
    // (note: there is no before balance as Bob didn't have any offered tokens before the transaction)
    const bobTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.takerTokenAccountA);
    const bobTokenAccountBalanceAfter = new BN(bobTokenAccountBalanceAfterResponse.value.amount);
    console.log("Bob Token Account Balance After",bobTokenAccountBalanceAfter.toString(),"Token A Offered Amount",tokenAOfferedAmount.toString());
    expect(bobTokenAccountBalanceAfter.eq(tokenAOfferedAmount));

    // Check the wanted tokens are now in Alice's account
    // (note: there is no before balance as Alice didn't have any wanted tokens before the transaction)
    const aliceTokenAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.makerTokenAccountB);
    const aliceTokenAccountBalanceAfter = new BN(aliceTokenAccountBalanceAfterResponse.value.amount);
    console.log("Alice Token Account Balance After",aliceTokenAccountBalanceAfter.toString(),"Token B Wanted Amount",tokenBWantedAmount.toString());
    expect(aliceTokenAccountBalanceAfter.eq(tokenBWantedAmount));

        // Check the offered tokens are now in Bob's account
    // (note: there is no before balance as Bob didn't have any offered tokens before the transaction)
    const bobTokenBAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.takerTokenAccountB);
    const bobTokenBAccountBalanceAfter = new BN(bobTokenBAccountBalanceAfterResponse.value.amount);
    console.log("Bob Token Account Balance After",bobTokenBAccountBalanceAfter.toString(),"Token A Offered Amount",tokenAOfferedAmount.toString());

    // Check the wanted tokens are now in Alice's account
    // (note: there is no before balance as Alice didn't have any wanted tokens before the transaction)
    const aliceTokenAAccountBalanceAfterResponse = await connection.getTokenAccountBalance(accounts.makerTokenAccountA);
    const aliceTokenAAccountBalanceAfter = new BN(aliceTokenAAccountBalanceAfterResponse.value.amount);
    console.log("Alice Token Account Balance After",aliceTokenAAccountBalanceAfter.toString(),"Token B Wanted Amount",tokenBWantedAmount.toString());
  })
});
