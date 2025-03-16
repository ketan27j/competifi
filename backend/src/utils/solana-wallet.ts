import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import * as sss from 'shamir-secret-sharing';
import * as crypto from 'crypto';

// Database models (using TypeORM as an example)
// import { Entity, Column, PrimaryGeneratedColumn, Repository } from 'typeorm';

// ======= MODELS =======

// @Entity()
// class User {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @Column()
//     username: string;

//     // Other user details
// }

// @Entity()
// class UserWallet {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @Column()
//     userId: string;

//     @Column()
//     publicKey: string;

//     @Column({ nullable: true })
//     encryptedKeyShare: string;  // Server's encrypted share of the private key
  
//     @Column()
//     derivationPath: string;     // For HD wallet approach
// }

// ======= CONFIG & UTILS =======

// Master seed configuration (store in secure environment variables)
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC;
const SERVER_ENCRYPTION_KEY = process.env.SERVER_ENCRYPTION_KEY;

// Encryption/decryption utilities
function encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string, key: string): string {
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

// ======= HD WALLET IMPLEMENTATION =======

// class HDWalletManager {
//     private masterSeed: Buffer;
//     private walletRepository: Repository<UserWallet>;

//     constructor(mnemonic: string, walletRepository: Repository<UserWallet>) {
//         this.masterSeed = mnemonicToSeedSync(mnemonic);
//         this.walletRepository = walletRepository;
//     }

    // Generate a new Solana wallet for a user using HD derivation
    function createWalletForUser(userId: string): Promise<{ publicKey: string }> {
        // Create a unique derivation path for the user
        // Format: m/44'/501'/userId'/0' (501 is Solana's coin type)
        // Using a hash of userId to create a numerical index
        const userIdHash = crypto.createHash('sha256').update(userId).digest();
        const userIndex = userIdHash.readUInt32LE(0) % 2147483648; // Ensure it's a valid index
        const derivationPath = `m/44'/501'/${userIndex}'/0'`;

        // Derive the keypair
        const derivedResult = derivePath(derivationPath, this.masterSeed.toString('hex'));
        const keypair = Keypair.fromSeed(derivedResult.key);

        // Store the wallet info
        // const wallet = new UserWallet();
        // wallet.userId = userId;
        // wallet.publicKey = keypair.publicKey.toString();
        // wallet.derivationPath = derivationPath;
        // this.walletRepository.save(wallet);

        return { publicKey: keypair.publicKey.toString() };
    }

    // Get a user's keypair when needed for transactions
    // function getUserKeypair(userId: string): Promise<Keypair | null> {
    //     const wallet = this.walletRepository.findOne({ where: { userId } });
        
    //     if (!wallet) return null;

    //     // Re-derive the keypair using the stored derivation path
    //     const derivedResult = derivePath(wallet.derivationPath, this.masterSeed.toString('hex'));
    //     return Keypair.fromSeed(derivedResult.key);
    // }
// }

// ======= SPLIT KEY MANAGEMENT IMPLEMENTATION =======

// class SplitKeyManager {
//     private walletRepository: Repository<UserWallet>;
//     private serverEncryptionKey: string;

//     constructor(serverEncryptionKey: string, walletRepository: Repository<UserWallet>) {
//         this.serverEncryptionKey = serverEncryptionKey;
//         this.walletRepository = walletRepository;
//     }

    // Create a new wallet using Shamir's Secret Sharing
    async function createWalletForUser(userId: string): Promise<{ publicKey: string, clientKeyShare: string }> {
        // Generate new Solana keypair
        const keypair = Keypair.generate();
        const privateKey = Buffer.from(keypair.secretKey).toString('hex');
        
        // Split the private key into 2 shares (threshold: 2)
        // This means both shares are needed to reconstruct the key
        const shares = sss.split(privateKey, { shares: 2, threshold: 2 });
        
        // Encrypt the server's share
        const encryptedServerShare = encrypt(shares[0], this.serverEncryptionKey);
        
        // Store the wallet info
        // const wallet = new UserWallet();
        // wallet.userId = userId;
        // wallet.publicKey = keypair.publicKey.toString();
        // wallet.encryptedKeyShare = encryptedServerShare;
        // await this.walletRepository.save(wallet);

        // Return the public key and client's share
        // The client share should be stored securely on the user's device
        return {
            publicKey: keypair.publicKey.toString(),
            clientKeyShare: shares[1]
        };
    }

    // Reconstruct a keypair for transaction signing
    async function reconstructKeypair(userId: string, clientKeyShare: string): Promise<Keypair | null> {
        const wallet = await this.walletRepository.findOne({ where: { userId } });
        
        if (!wallet || !wallet.encryptedKeyShare) return null;

        // Decrypt the server's share
        const serverKeyShare = decrypt(wallet.encryptedKeyShare, this.serverEncryptionKey);
        
        // Combine the shares to reconstruct the private key
        const shares = [serverKeyShare, clientKeyShare];
        const privateKeyHex = sss.combine(shares);
        
        // Convert hex to Uint8Array for Solana Keypair
        const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
        
        // Create keypair from the private key
        return Keypair.fromSecretKey(privateKeyBytes);
    }
// }

// ======= USAGE EXAMPLES =======

// // Initialize managers
// async function initializeWalletManagers() {
//     // Get repositories from your database connection
//     const walletRepository = getWalletRepository(); // Implement based on your DB setup
    
//     // Create managers
//     const hdWalletManager = new HDWalletManager(MASTER_MNEMONIC, walletRepository);
//     const splitKeyManager = new SplitKeyManager(SERVER_ENCRYPTION_KEY, walletRepository);
    
//     return { hdWalletManager, splitKeyManager };
// }

// // Example: Creating a new user with both wallet types
// async function onboardNewUser(username: string) {
//     // Create user record
//     const user = new User();
//     user.username = username;
//     const userRepository = getUserRepository(); // Implement based on your DB setup
//     await userRepository.save(user);
    
//     const { hdWalletManager, splitKeyManager } = await initializeWalletManagers();
    
//     // Create HD wallet
//     const hdWallet = await hdWalletManager.createWalletForUser(user.id);
//     console.log(`HD Wallet created: ${hdWallet.publicKey}`);
    
//     // Create split key wallet
//     const splitKeyWallet = await splitKeyManager.createWalletForUser(user.id);
//     console.log(`Split key wallet created: ${splitKeyWallet.publicKey}`);
//     console.log(`Client key share (store securely on user device): ${splitKeyWallet.clientKeyShare}`);
    
//     return {
//         userId: user.id,
//         hdWalletPublicKey: hdWallet.publicKey,
//         splitKeyWalletPublicKey: splitKeyWallet.publicKey,
//         clientKeyShare: splitKeyWallet.clientKeyShare
//     };
// }

// Example: Sign a transaction using HD wallet
async function signTransactionWithHDWallet(userId: string, transaction: any) {
    const { hdWalletManager } = await initializeWalletManagers();
    const keypair = await hdWalletManager.getUserKeypair(userId);
    
    if (!keypair) {
        throw new Error('Wallet not found');
    }
    
    // Sign the transaction with the reconstructed keypair
    transaction.sign(keypair);
    return transaction;
}

// Example: Sign a transaction using split key wallet
async function signTransactionWithSplitKey(userId: string, clientKeyShare: string, transaction: any) {
    const { splitKeyManager } = await initializeWalletManagers();
    const keypair = await splitKeyManager.reconstructKeypair(userId, clientKeyShare);
    
    if (!keypair) {
        throw new Error('Failed to reconstruct wallet');
    }
    
    // Sign the transaction with the reconstructed keypair
    transaction.sign(keypair);
    return transaction;
}