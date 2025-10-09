# 🔐 PHASE 1.1: Authentication Service Completion Plan

**Created**: October 9, 2025  
**Status**: In Progress  
**Priority**: CRITICAL (Week 1 - Foundation)  
**Estimated Effort**: 3 days  
**Target Completion**: October 12, 2025  

---

## 📊 CURRENT STATE ASSESSMENT

### ✅ What Exists (Already Complete)

**Auth Services** (4 files, 1,352 lines):
1. ✅ **JWTAuthenticationService.ts** (330 lines)
   - JWT token generation (access + refresh)
   - Token verification and decoding
   - Password hashing (bcrypt)
   - Authentication middleware
   - Role-based access control middleware
   - Login/logout methods
   - **STATUS**: 70% complete, using mock data

2. ✅ **RoleBasedAccessService.ts** (578 lines)
   - RBAC implementation
   - **STATUS**: Needs review

3. ✅ **SessionValidationService.ts** (427 lines)
   - Session management
   - **STATUS**: Needs review

4. ✅ **RateLimitService.ts** (55 lines)
   - Rate limiting
   - **STATUS**: Needs review

**Guards** (3 files):
- ✅ `src/guards/auth.guard.ts` - Auth guard
- ✅ `src/guards/role.guard.ts` - Role guard
- ✅ `src/guards/roles.guard.ts` - Roles guard

**User Entity**:
- ✅ `src/entities/User.ts` (114 lines)
  - Complete user entity with all fields
  - Password hash storage
  - Two-factor authentication fields
  - Login attempts tracking
  - Account locking mechanism
  - Tenant + Organization relationships
  - Soft delete support

### ❌ What's Missing (Needs Implementation)

**Critical Gaps**:
1. ❌ **Database Integration**: All auth methods use mock data
   - `authenticateUser()` - Mock user lookup
   - `authenticate()` middleware - Mock user data
   - `refreshToken()` - Mock user lookup
   - No TypeORM repository injection

2. ❌ **Token Management**:
   - No refresh token storage (database or Redis)
   - No token blacklist for logout
   - No token rotation on refresh

3. ❌ **Security Features**:
   - No account lockout after failed attempts
   - No password reset token storage
   - No email verification tokens
   - No two-factor authentication (2FA) implementation

4. ❌ **Repository Layer**:
   - No UserRepository service
   - No RefreshTokenRepository
   - No PasswordResetTokenRepository

5. ❌ **Integration Points**:
   - No email service integration (password reset)
   - No audit logging integration
   - No rate limiting persistence (currently in-memory)

---

## 🎯 COMPLETION TASKS

### **Task 1: Create Repository Layer** (4 hours)

**1.1 Create UserRepository Service**
```typescript
// src/repositories/UserRepository.ts
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/User';

export class UserRepository {
  private repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    await this.repository.increment({ id: userId }, 'loginAttempts', 1);
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.repository.update({ id: userId }, { loginAttempts: 0 });
  }

  async lockAccount(userId: string, lockUntil: Date): Promise<void> {
    await this.repository.update({ id: userId }, { lockedUntil: lockUntil });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update({ id: userId }, { lastLogin: new Date() });
  }

  // More methods...
}
```

**1.2 Create RefreshToken Entity & Repository**
```typescript
// src/entities/RefreshToken.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('refresh_tokens')
@Index(['userId'])
@Index(['token'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token', length: 500 })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**1.3 Create PasswordResetToken Entity & Repository**
```typescript
// src/entities/PasswordResetToken.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token', length: 255 })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'used', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Acceptance Criteria**:
- [ ] UserRepository created with all CRUD methods
- [ ] RefreshToken entity and repository created
- [ ] PasswordResetToken entity and repository created
- [ ] Database migrations created for new tables
- [ ] Indexes added for performance

---

### **Task 2: Integrate Database with JWTAuthenticationService** (6 hours)

**2.1 Refactor JWTAuthenticationService Constructor**
```typescript
// src/services/auth/JWTAuthenticationService.ts

import { DataSource } from 'typeorm';
import { UserRepository } from '../../repositories/UserRepository';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';

export class JWTAuthenticationService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;
  private rateLimitService: RateLimitService;

  constructor(dataSource: DataSource) {
    this.userRepository = new UserRepository(dataSource);
    this.refreshTokenRepository = new RefreshTokenRepository(dataSource);
    this.rateLimitService = new RateLimitService();
  }

  // Methods...
}
```

**2.2 Replace Mock authenticateUser() with Real Database Lookup**
```typescript
async authenticateUser(
  email: string, 
  password: string, 
  req: Request
): Promise<{ user: AuthenticatedUser; tokens: { accessToken: string; refreshToken: string } }> {
  const rateLimitKey = `auth:${req.ip}:${email}`;
  
  // Check rate limiting
  const canProceed = await this.rateLimitService.checkRateLimit(rateLimitKey);
  if (!canProceed) {
    throw new Error('Too many authentication attempts. Please try again later.');
  }

  // 1. Find user by email (REAL DATABASE LOOKUP)
  const user = await this.userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account is locked. Please try again later.');
  }

  // 3. Verify password (REAL BCRYPT VERIFICATION)
  const isValidPassword = await this.verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    // Increment login attempts
    await this.userRepository.incrementLoginAttempts(user.id);
    
    // Lock account after 5 failed attempts
    if (user.loginAttempts >= 4) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await this.userRepository.lockAccount(user.id, lockUntil);
      throw new Error('Account locked due to too many failed login attempts.');
    }
    
    throw new Error('Invalid credentials');
  }

  // 4. Reset login attempts on successful login
  await this.userRepository.resetLoginAttempts(user.id);

  // 5. Update last login timestamp
  await this.userRepository.updateLastLogin(user.id);

  // 6. Build authenticated user object
  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    organizationId: user.organizationId,
    roles: user.roleId ? [user.roleId] : [], // TODO: Fetch from roles table
    permissions: [], // TODO: Fetch from permissions
    dataAccessLevel: 1, // TODO: Calculate from role
    complianceLevel: 1 // TODO: Calculate from role
  };

  // 7. Generate tokens
  const tokens = await this.generateTokens(authenticatedUser);

  // 8. Store refresh token in database
  await this.refreshTokenRepository.create({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  logger.info('User authenticated successfully', { userId: user.id, email });

  return { user: authenticatedUser, tokens };
}
```

**2.3 Implement Real refreshToken() Method**
```typescript
async refreshToken(refreshToken: string) {
  try {
    // 1. Verify refresh token JWT signature
    const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
    
    // 2. Check if refresh token exists in database and is not revoked
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
    if (!storedToken || storedToken.isRevoked) {
      throw new Error('Invalid refresh token');
    }

    // 3. Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // 4. Fetch user from database
    const user = await this.userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // 5. Revoke old refresh token
    await this.refreshTokenRepository.revoke(storedToken.id);

    // 6. Build authenticated user
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      roles: user.roleId ? [user.roleId] : [],
      permissions: [],
      dataAccessLevel: 1,
      complianceLevel: 1
    };

    // 7. Generate new tokens (refresh token rotation)
    const newTokens = await this.generateTokens(authenticatedUser);

    // 8. Store new refresh token
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: newTokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return { user: authenticatedUser, tokens: newTokens };
  } catch (error: unknown) {
    throw new Error('Invalid refresh token');
  }
}
```

**2.4 Implement Real logout() Method**
```typescript
async logout(userId: string, refreshToken?: string) {
  // 1. Revoke refresh token if provided
  if (refreshToken) {
    const storedToken = await this.refreshTokenRepository.findByToken(refreshToken);
    if (storedToken) {
      await this.refreshTokenRepository.revoke(storedToken.id);
    }
  }

  // 2. Optionally revoke all user tokens
  // await this.refreshTokenRepository.revokeAllForUser(userId);

  logger.info('User logged out', { userId });
  return { success: true };
}
```

**Acceptance Criteria**:
- [ ] `authenticateUser()` uses real database lookup
- [ ] Password verification uses bcrypt against stored hash
- [ ] Account locking after 5 failed attempts (30 min lockout)
- [ ] Login attempts tracked and reset on success
- [ ] Last login timestamp updated
- [ ] Refresh tokens stored in database
- [ ] `refreshToken()` validates against database
- [ ] Refresh token rotation implemented
- [ ] `logout()` revokes refresh tokens
- [ ] All mock data removed

---

### **Task 3: Implement Password Reset Flow** (3 hours)

**3.1 Create PasswordResetTokenRepository**
```typescript
// src/repositories/PasswordResetTokenRepository.ts
import { Repository, DataSource } from 'typeorm';
import { PasswordResetToken } from '../entities/PasswordResetToken';

export class PasswordResetTokenRepository {
  private repository: Repository<PasswordResetToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(PasswordResetToken);
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const resetToken = this.repository.create({ userId, token, expiresAt });
    return this.repository.save(resetToken);
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return this.repository.findOne({ where: { token, used: false } });
  }

  async markAsUsed(tokenId: string): Promise<void> {
    await this.repository.update({ id: tokenId }, { used: true });
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await this.repository.update({ userId, used: false }, { used: true });
  }
}
```

**3.2 Implement Real initiatePasswordReset()**
```typescript
async initiatePasswordReset(email: string) {
  // 1. Find user by email
  const user = await this.userRepository.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists - security best practice
    return { success: true, message: 'If email exists, password reset link sent' };
  }

  // 2. Invalidate any existing reset tokens for this user
  await this.passwordResetTokenRepository.invalidateAllForUser(user.id);

  // 3. Generate reset token (crypto random)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = await this.hashPassword(resetToken); // Hash for storage

  // 4. Store reset token (expires in 1 hour)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await this.passwordResetTokenRepository.create(user.id, hashedToken, expiresAt);

  // 5. Send email with reset link
  // TODO: Integrate with email service
  const resetLink = `https://app.writecarenotes.com/reset-password?token=${resetToken}`;
  logger.info('Password reset initiated', { userId: user.id, email });

  // In production: await this.emailService.sendPasswordResetEmail(user.email, resetLink);

  return { success: true, message: 'Password reset email sent' };
}
```

**3.3 Implement Real resetPassword()**
```typescript
async resetPassword(token: string, newPassword: string) {
  // 1. Hash the token to find in database
  const hashedToken = await this.hashPassword(token);

  // 2. Find valid reset token
  const resetTokenRecord = await this.passwordResetTokenRepository.findByToken(hashedToken);
  if (!resetTokenRecord) {
    throw new Error('Invalid or expired reset token');
  }

  // 3. Check if token is expired
  if (resetTokenRecord.expiresAt < new Date()) {
    throw new Error('Reset token has expired');
  }

  // 4. Hash new password
  const passwordHash = await this.hashPassword(newPassword);

  // 5. Update user password
  await this.userRepository.updatePassword(resetTokenRecord.userId, passwordHash);

  // 6. Mark token as used
  await this.passwordResetTokenRepository.markAsUsed(resetTokenRecord.id);

  // 7. Revoke all refresh tokens (force re-login)
  await this.refreshTokenRepository.revokeAllForUser(resetTokenRecord.userId);

  logger.info('Password reset completed', { userId: resetTokenRecord.userId });

  return { success: true, message: 'Password reset successfully' };
}
```

**Acceptance Criteria**:
- [ ] Password reset tokens stored in database
- [ ] Reset tokens expire after 1 hour
- [ ] Tokens are hashed before storage (security)
- [ ] Old reset tokens invalidated on new request
- [ ] Password reset revokes all refresh tokens
- [ ] Email integration prepared (TODO for later)

---

### **Task 4: Add Two-Factor Authentication (2FA)** (4 hours) ⭐ **OPTIONAL**

**Status**: Optional - Can be implemented in Phase 2

**4.1 Install Dependencies**
```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

**4.2 Implement 2FA Methods**
```typescript
// In JWTAuthenticationService.ts

/**
 * Enable 2FA for user
 */
async enableTwoFactor(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
  const secret = speakeasy.generateSecret({ name: 'WriteCareNotes' });
  
  // Store secret in database
  await this.userRepository.update({ id: userId }, { 
    twoFactorSecret: secret.base32,
    twoFactorEnabled: true 
  });

  // Generate QR code for scanning
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return { secret: secret.base32, qrCodeUrl };
}

/**
 * Verify 2FA token
 */
async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
  const user = await this.userRepository.findById(userId);
  if (!user || !user.twoFactorSecret) {
    return false;
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token
  });

  return verified;
}

/**
 * Disable 2FA for user
 */
async disableTwoFactor(userId: string): Promise<void> {
  await this.userRepository.update({ id: userId }, { 
    twoFactorSecret: null,
    twoFactorEnabled: false 
  });
}
```

**Acceptance Criteria** (Optional):
- [ ] 2FA secret generation
- [ ] QR code generation for Google Authenticator
- [ ] 2FA token verification
- [ ] 2FA can be enabled/disabled per user
- [ ] Login flow checks 2FA if enabled

---

### **Task 5: Create Database Migrations** (2 hours)

**5.1 Create Migration Files**
```bash
# Generate migration for refresh_tokens table
npm run typeorm migration:create -- -n CreateRefreshTokensTable

# Generate migration for password_reset_tokens table
npm run typeorm migration:create -- -n CreatePasswordResetTokensTable
```

**5.2 Write Migration for RefreshTokens**
```typescript
// migrations/XXXXXX-CreateRefreshTokensTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRefreshTokensTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'token', type: 'varchar', length: '500', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'is_revoked', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      })
    );

    await queryRunner.createIndex('refresh_tokens', new TableIndex({
      name: 'IDX_refresh_tokens_user_id',
      columnNames: ['user_id']
    }));

    await queryRunner.createIndex('refresh_tokens', new TableIndex({
      name: 'IDX_refresh_tokens_token',
      columnNames: ['token']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens');
  }
}
```

**5.3 Write Migration for PasswordResetTokens**
```typescript
// migrations/XXXXXX-CreatePasswordResetTokensTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePasswordResetTokensTable1234567891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'token', type: 'varchar', length: '255', isNullable: false },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'used', type: 'boolean', default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      })
    );

    await queryRunner.createIndex('password_reset_tokens', new TableIndex({
      name: 'IDX_password_reset_tokens_user_id',
      columnNames: ['user_id']
    }));

    await queryRunner.createIndex('password_reset_tokens', new TableIndex({
      name: 'IDX_password_reset_tokens_token',
      columnNames: ['token']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}
```

**Acceptance Criteria**:
- [ ] Migration created for `refresh_tokens` table
- [ ] Migration created for `password_reset_tokens` table
- [ ] Foreign keys to `users` table
- [ ] Indexes on `user_id` and `token` columns
- [ ] Migrations tested (up and down)

---

### **Task 6: Fix TypeScript Errors in Auth Services** (2 hours)

**6.1 Run TypeScript Compiler**
```bash
npx tsc --noEmit --project tsconfig.json | Select-String "src/services/auth" | Select-String "error TS"
```

**6.2 Common Errors to Fix**:
- Import errors (missing types)
- Type mismatches
- `any` types to be replaced with proper types
- Nullable type issues
- Missing return types

**Acceptance Criteria**:
- [ ] 0 TypeScript errors in `src/services/auth/`
- [ ] 0 TypeScript errors in `src/guards/`
- [ ] All methods have explicit return types
- [ ] No `any` types (use proper interfaces)

---

### **Task 7: Create Auth Routes & Controller** (2 hours)

**7.1 Create AuthController**
```typescript
// src/controllers/auth/AuthController.ts
import { Request, Response } from 'express';
import { JWTAuthenticationService } from '../../services/auth/JWTAuthenticationService';
import { DataSource } from 'typeorm';

export class AuthController {
  private authService: JWTAuthenticationService;

  constructor(dataSource: DataSource) {
    this.authService = new JWTAuthenticationService(dataSource);
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
        });
        return;
      }

      const result = await this.authService.authenticateUser(email, password, req);
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            tenantId: result.user.tenantId,
            roles: result.user.roles
          },
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }
      });
    } catch (error: unknown) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: (error as Error).message }
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' }
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken
        }
      });
    } catch (error: unknown) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: (error as Error).message }
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { refreshToken } = req.body;
      
      await this.authService.logout(user.id, refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: { code: 'LOGOUT_FAILED', message: (error as Error).message }
      });
    }
  };

  // More methods...
}
```

**7.2 Create Auth Routes**
```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth/AuthController';
import { DataSource } from 'typeorm';

export function createAuthRoutes(dataSource: DataSource): Router {
  const router = Router();
  const authController = new AuthController(dataSource);

  router.post('/login', authController.login);
  router.post('/refresh', authController.refreshToken);
  router.post('/logout', authController.logout);
  router.post('/password-reset/initiate', authController.initiatePasswordReset);
  router.post('/password-reset/complete', authController.resetPassword);
  router.post('/password/change', authController.changePassword);

  return router;
}
```

**7.3 Register Auth Routes in Main Router**
```typescript
// src/routes/index.ts (add this)
import { createAuthRoutes } from './auth.routes';

router.use('/auth', createAuthRoutes(AppDataSource));
```

**Acceptance Criteria**:
- [ ] AuthController created with all methods
- [ ] Auth routes created and registered
- [ ] Routes accessible at `/api/auth/*`
- [ ] Proper error handling and validation
- [ ] Response format consistent

---

### **Task 8: Write Integration Tests** (3 hours)

**8.1 Create Auth Tests**
```typescript
// tests/integration/auth/JWTAuthenticationService.test.ts
import { JWTAuthenticationService } from '../../../src/services/auth/JWTAuthenticationService';
import { DataSource } from 'typeorm';
import { User } from '../../../src/entities/User';

describe('JWTAuthenticationService', () => {
  let authService: JWTAuthenticationService;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test database
    dataSource = await createTestDataSource();
    authService = new JWTAuthenticationService(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('authenticateUser', () => {
    it('should authenticate valid user', async () => {
      // Create test user
      const user = await createTestUser(dataSource, {
        email: 'test@example.com',
        password: 'password123'
      });

      const req = { ip: '127.0.0.1' } as any;
      const result = await authService.authenticateUser('test@example.com', 'password123', req);

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const req = { ip: '127.0.0.1' } as any;
      
      await expect(
        authService.authenticateUser('test@example.com', 'wrongpassword', req)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Test account lockout mechanism
    });
  });

  describe('refreshToken', () => {
    it('should refresh valid token', async () => {
      // Test refresh token flow
    });

    it('should reject revoked token', async () => {
      // Test revoked token rejection
    });
  });

  // More tests...
});
```

**Acceptance Criteria**:
- [ ] 70%+ test coverage for JWTAuthenticationService
- [ ] Tests for login success/failure
- [ ] Tests for account lockout
- [ ] Tests for refresh token flow
- [ ] Tests for password reset flow
- [ ] All tests passing

---

## 📈 SUCCESS METRICS

### Definition of Done (Phase 1.1 Complete):

**Functionality**:
- [ ] ✅ Users can login with email/password
- [ ] ✅ JWT tokens generated (access + refresh)
- [ ] ✅ Refresh token rotation working
- [ ] ✅ Account lockout after 5 failed attempts
- [ ] ✅ Password reset flow functional
- [ ] ✅ Logout revokes refresh tokens
- [ ] ✅ All auth methods use real database (no mocks)

**Code Quality**:
- [ ] ✅ 0 TypeScript errors in auth services
- [ ] ✅ All mock data removed
- [ ] ✅ Proper error handling
- [ ] ✅ Logging implemented
- [ ] ✅ 70%+ test coverage

**Database**:
- [ ] ✅ Migrations created and run
- [ ] ✅ RefreshToken table created
- [ ] ✅ PasswordResetToken table created
- [ ] ✅ Indexes added for performance

**API**:
- [ ] ✅ `/api/auth/login` working
- [ ] ✅ `/api/auth/refresh` working
- [ ] ✅ `/api/auth/logout` working
- [ ] ✅ `/api/auth/password-reset/*` working

**Documentation**:
- [ ] ✅ API endpoints documented
- [ ] ✅ Authentication flow documented
- [ ] ✅ Code comments added

---

## ⏱️ TIME BREAKDOWN

| Task | Estimated Time | Priority |
|------|----------------|----------|
| 1. Create Repository Layer | 4 hours | CRITICAL |
| 2. Integrate Database with Auth Service | 6 hours | CRITICAL |
| 3. Implement Password Reset Flow | 3 hours | HIGH |
| 4. Add Two-Factor Authentication | 4 hours | OPTIONAL |
| 5. Create Database Migrations | 2 hours | CRITICAL |
| 6. Fix TypeScript Errors | 2 hours | CRITICAL |
| 7. Create Auth Routes & Controller | 2 hours | CRITICAL |
| 8. Write Integration Tests | 3 hours | HIGH |
| **TOTAL (without 2FA)** | **22 hours (~3 days)** | - |
| **TOTAL (with 2FA)** | **26 hours (~3.5 days)** | - |

---

## 🚨 RISKS & MITIGATION

### Risk 1: Database Connection Issues
- **Mitigation**: Test database connection early, use connection pooling
- **Owner**: Database team

### Risk 2: TypeScript Errors from Repository Integration
- **Mitigation**: Fix incrementally, test after each change
- **Owner**: Developer

### Risk 3: Migration Failures
- **Mitigation**: Test migrations on dev database first, have rollback plan
- **Owner**: Database team

### Risk 4: Security Vulnerabilities
- **Mitigation**: Code review, security audit, follow OWASP guidelines
- **Owner**: Security team

---

## 🔄 NEXT STEPS AFTER PHASE 1.1

Once Authentication Service is complete, proceed to:

**Phase 1.2: Organization & Multi-Tenancy Service** (Week 2, 4 days)
- Create OrganizationService
- Implement tenant isolation middleware
- Test multi-tenancy thoroughly

**Phase 1.3: Resident Service** (Weeks 3-4, 5 days)
- Fix ResidentService DI issues
- Complete admission/discharge workflows
- Integrate with authentication

---

## 📞 QUESTIONS BEFORE STARTING?

1. **Should we implement 2FA now or defer to Phase 2?**
   - Recommendation: Defer to Phase 2 (saves 4 hours)

2. **Do we need email service integration for password reset?**
   - Recommendation: Create stub for now, integrate in Phase 5

3. **Should we use Redis for refresh token storage?**
   - Recommendation: PostgreSQL for now, Redis optimization in Phase 3

4. **What's the password policy?**
   - Recommendation: Min 8 chars, 1 uppercase, 1 number, 1 special char

5. **Do we need social auth (Google, Microsoft)?**
   - Recommendation: Defer to Phase 6 (advanced features)

---

**Ready to begin? Let's start with Task 1: Create Repository Layer!** 🚀

---

**Document Version**: 1.0  
**Last Updated**: October 9, 2025  
**Next Review**: After Phase 1.1 completion  
**Owner**: Development Team  
**Status**: READY TO START
