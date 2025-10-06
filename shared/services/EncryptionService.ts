import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly key: Buffer;

  constructor(encryptionKey?: string) {
    // Use provided key or generate from environment
    const keyString = encryptionKey || process.env.ENCRYPTION_KEY || 'writecarenotes-default-key-2025';
    this.key = crypto.scryptSync(keyString, 'salt', this.keyLength);
  }

  async encrypt(data: string): Promise<string> {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      cipher.setAAD(Buffer.from('WriteCarenotes-Auth'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine iv + tag + encrypted data
      const result = iv.toString('hex') + tag.toString('hex') + encrypted;
      return Buffer.from(result).toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const data = buffer.toString('hex');
      
      const iv = Buffer.from(data.slice(0, this.ivLength * 2), 'hex');
      const tag = Buffer.from(data.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2), 'hex');
      const encrypted = data.slice((this.ivLength + this.tagLength) * 2);
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      decipher.setAAD(Buffer.from('WriteCarenotes-Auth'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || this.generateSalt();
    const hash = crypto.pbkdf2Sync(password, passwordSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: passwordSalt };
  }

  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: computedHash } = await this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateAPIKey(): string {
    return 'wc_' + crypto.randomBytes(24).toString('hex');
  }
}