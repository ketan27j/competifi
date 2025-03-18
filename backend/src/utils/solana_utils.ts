import { generateMnemonic, mnemonicToSeed, mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionConfirmationStrategy } from '@solana/web3.js';
import * as sss from 'shamir-secret-sharing';
import * as crypto from 'crypto';

export class SolanaUtils {

    private connection: Connection;

    constructor(connection: Connection) {
      this.connection = connection;
    }

    async encrypt(text: string, key: string): Promise<string> {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    async decrypt(encryptedText: string, key: string): Promise<string> {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Generate a new Solana wallet for a user using HD derivation
    async createWalletForUser(userId: string): Promise<{ keypair: Keypair, publicKey: string, privateKey: string }> {
        const userIdHash = crypto.createHash('sha256').update(userId).digest();
        const userIndex = userIdHash.readUInt32LE(0) % 2147483648; // Ensure it's a valid index
        const derivationPath = `m/44'/501'/${userIndex}'/0'`;

        const mn = await generateMnemonic();
        let masterSeed : Buffer = mnemonicToSeedSync(mn);
        const derivedResult = derivePath(derivationPath, masterSeed.toString('hex'));
        const keypair = Keypair.fromSeed(derivedResult.key);

        console.log('Public key', keypair.publicKey.toString(), 'Private key String', keypair.secretKey.toString(), "Private key uintarray", keypair.secretKey, "Private key array", Array.from(keypair.secretKey));   
        return {    
            keypair,
            publicKey: keypair.publicKey.toString(),
            privateKey: keypair.secretKey.toString()
         };
    }

    async createKeypairFromPrivateKey(privateKeyBytes:Uint8Array) {
        return Keypair.fromSecretKey(privateKeyBytes);
    }

    async createWalletAdapter(keypair: Keypair) {
        return {
            publicKey: keypair.publicKey,
            async signTransaction(transaction: Transaction) {
                transaction.partialSign(keypair);
                return transaction;
            },
            async signAllTransactions(transactions: Transaction[]) {
                return transactions.map(tx => {
                    tx.partialSign(keypair);
                    return tx;
                });
            },
        };
    }

    async requestAirdrop(connection: Connection, publicKey: PublicKey, amount = 5) {
        const signature = await connection.requestAirdrop(
            publicKey,
            amount * LAMPORTS_PER_SOL
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
        // Use the signature as the strategy
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        });
        return signature;
    }

    async getBalance(connection: Connection, publicKey: PublicKey) {
        const balance = await connection.getBalance(publicKey);
        console.log('Balance:', balance / LAMPORTS_PER_SOL);
        return balance / LAMPORTS_PER_SOL;
    }

    // Create a new wallet using Shamir's Secret Sharing
    async createWalletForUserWithSss(userId: string): Promise<{ publicKey: string, clientKeyShare: string }> {
        // Generate new Solana keypair
        const keypair = await this.createWalletForUser(userId);
        const privateKey = Buffer.from(keypair.keypair.secretKey);//.toString('hex');
        
        // Split the private key into 2 shares (threshold: 2)
        // This means both shares are needed to reconstruct the key
        const shamirShares = await sss.split(keypair.keypair.secretKey, 2, 2 );
        
        // Encrypt the server's share
        // const encryptedServerShare = this.encrypt(shares[0], this.serverEncryptionKey);
        const shares: string[] = [];
        for (const share of shamirShares) {
            shares.push(share.toString());
        }
        // Return the public key and client's share
        // The client share should be stored securely on the user's device
        return {
            publicKey: keypair.keypair.publicKey.toString(),
            clientKeyShare: shares[1]
        };
    }

}
