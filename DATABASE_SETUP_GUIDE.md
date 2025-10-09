# Database Setup Guide

**Status**: PostgreSQL 17 is running ✅  
**Action Required**: Update database password in `.env` file

---

## Quick Setup

### Step 1: Update Database Password

Edit `.env` file and update this line:
```bash
DB_PASSWORD=password    # ← Change to your PostgreSQL password
```

### Step 2: Create Database

Open pgAdmin or run this SQL:
```sql
CREATE DATABASE writecarenotes;
```

Or use command line:
```powershell
psql -U postgres -c "CREATE DATABASE writecarenotes;"
```

### Step 3: Run Migrations

```powershell
npx knex migrate:latest --knexfile knexfile.js
```

This will create:
- `refresh_tokens` table (for JWT refresh tokens)
- `password_reset_tokens` table (for password reset flow)
- `roles` table with 10 system roles
- All necessary indexes and foreign keys

### Step 4: Verify Setup

```powershell
# Check migrations ran
npx knex migrate:list --knexfile knexfile.js

# Check roles seeded
psql -U postgres -d writecarenotes -c "SELECT name, display_name FROM roles;"
```

---

## Troubleshooting

### "password authentication failed"
- Update `DB_PASSWORD` in `.env` to match your PostgreSQL password
- Check PostgreSQL is running: `Get-Service postgresql*`

### "database does not exist"
- Create database: `CREATE DATABASE writecarenotes;`
- Or let migration create it (if permissions allow)

### "permission denied to create database"
- Use postgres superuser or admin account
- Grant CREATE DATABASE permission to your user

---

## What Gets Created

### Tables

**refresh_tokens**
- Stores JWT refresh tokens
- Supports token rotation
- Tracks revocation (logout)
- Expires after 7 days

**password_reset_tokens**
- One-time use reset tokens
- SHA-256 hashed for security
- Expires after 1 hour
- Auto-invalidates old tokens

**roles** (10 system roles)
1. System Administrator - Full system access
2. Organization Administrator - Full org access
3. Compliance Officer - Audit & compliance
4. Care Home Manager - Department management
5. Senior Nurse - Advanced clinical care
6. Care Staff - Frontline care delivery
7. Support Worker - Activity assistance
8. Finance Administrator - Financial management
9. Receptionist - Front desk operations
10. Family Member - Limited resident access

### Indexes
- `refresh_tokens`: user_id, token, expires_at, is_revoked
- `password_reset_tokens`: user_id, token, expires_at, used
- `roles`: name, is_system_role

### Foreign Keys
- `refresh_tokens.user_id` → `users.id` (CASCADE DELETE)
- `password_reset_tokens.user_id` → `users.id` (CASCADE DELETE)

---

## Next Steps After Setup

1. **Test Authentication**
   ```powershell
   # Start server
   npm run dev
   
   # Test login (requires a user in database)
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Create First User**
   ```sql
   INSERT INTO users (
     tenant_id, email, password_hash, first_name, last_name, role_id, is_active
   ) VALUES (
     gen_random_uuid(),
     'admin@example.com',
     -- Password: 'password123' (use bcrypt.hash('password123', 12) in node)
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLHJ4tg2',
     'System',
     'Admin',
     (SELECT id FROM roles WHERE name = 'system_admin'),
     true
   );
   ```

3. **Test Password Reset**
   - Configure SMTP in `.env`
   - Trigger reset: POST `/api/auth/password-reset/initiate`
   - Check email for reset link

---

## Production Deployment

Before deploying to production:

1. **Change ALL secrets in .env**
   ```bash
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

2. **Use production SMTP service**
   - SendGrid, AWS SES, Mailgun, or Postmark
   - Better deliverability than Gmail

3. **Enable SSL for database**
   ```bash
   DB_SSL=true
   ```

4. **Set production URLs**
   ```bash
   NODE_ENV=production
   APP_URL=https://your-domain.com
   API_URL=https://api.your-domain.com
   CORS_ORIGIN=https://your-domain.com
   ```

5. **Run migrations on production database**
   ```bash
   NODE_ENV=production npx knex migrate:latest
   ```

---

## Files Created This Session

1. `database/migrations/20251009_001_update_auth_tables_for_entities.ts`
   - Updates auth tables to match TypeORM entities
   - Handles both new installations and existing schemas

2. `database/migrations/20251009_002_seed_system_roles.ts`
   - Seeds 10 system roles with permissions
   - Enables permission-based access control

3. `.env`
   - Complete environment configuration
   - Database, JWT, SMTP, and app settings

---

**Ready to proceed?** Update the DB_PASSWORD in `.env` and run migrations!
