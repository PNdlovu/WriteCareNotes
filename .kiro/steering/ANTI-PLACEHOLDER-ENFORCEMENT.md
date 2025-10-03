---
inclusion: always
---

# 🛡️ ANTI-PLACEHOLDER ENFORCEMENT SYSTEM

## CRITICAL ALERT: ZERO TOLERANCE FOR FAKE IMPLEMENTATIONS

This system exists because the user has experienced **15 FAILED PROJECTS** due to AI assistants creating placeholder implementations that appear functional but are completely fake.

## 🚨 IMMEDIATE ENFORCEMENT RULES

### BEFORE WRITING ANY CODE:
1. **READ THIS DOCUMENT COMPLETELY**
2. **UNDERSTAND THE ZERO TOLERANCE POLICY**
3. **COMMIT TO REAL IMPLEMENTATIONS ONLY**

### WHILE WRITING CODE:
1. **NEVER use placeholder comments** (TODO, FIXME, etc.)
2. **NEVER return fake success responses**
3. **NEVER create mock implementations**
4. **ALWAYS implement real business logic**
5. **ALWAYS connect to real databases**
6. **ALWAYS handle real errors**

### AFTER WRITING CODE:
1. **RUN THE DETECTION SCRIPT**: `.\scripts\detect-fake-implementations.ps1`
2. **FIX ALL VIOLATIONS** before proceeding
3. **TEST WITH REAL DATA** to verify functionality
4. **VERIFY PRODUCTION READINESS**

## 🔍 AUTOMATIC DETECTION

### Run Detection Script:
```powershell
# Windows PowerShell
.\scripts\detect-fake-implementations.ps1

# Or Bash (Linux/Mac)
./scripts/detect-fake-implementations.sh
```

### Pre-Commit Hook:
Add this to your git pre-commit hook:
```bash
#!/bin/sh
echo "🔍 Checking for fake implementations..."
if ! ./scripts/detect-fake-implementations.sh; then
    echo "❌ Commit blocked - Fix fake implementations first"
    exit 1
fi
```

## 🚫 FORBIDDEN PATTERNS

### NEVER USE THESE PATTERNS:

```typescript
// ❌ FORBIDDEN - Placeholder comments
// TODO: Implement this
// FIXME: Add real logic
// Placeholder implementation
// Mock implementation
// For now, return...
// This would be implemented...
// In production, this would...

// ❌ FORBIDDEN - Fake returns
return { success: true }; // Always successful
return []; // Empty placeholder
return null; // Null placeholder
return 'mock-data'; // Mock response

// ❌ FORBIDDEN - Fake functions
function validateUser() {
  return true; // Always valid
}

function processPayment() {
  return { processed: true }; // Fake processing
}

// ❌ FORBIDDEN - Mock implementations
class MockService {
  async getData() {
    return { data: 'fake' };
  }
}
```

## ✅ REQUIRED PATTERNS

### ALWAYS USE THESE PATTERNS:

```typescript
// ✅ REQUIRED - Real implementations
async function validateUser(userId: string): Promise<ValidationResult> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Real database query
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user.rows.length) {
      return { valid: false, reason: 'User not found' };
    }
    
    // Real validation logic
    const isActive = user.rows[0].status === 'active';
    const hasPermissions = user.rows[0].permissions?.length > 0;
    
    return {
      valid: isActive && hasPermissions,
      reason: !isActive ? 'User inactive' : !hasPermissions ? 'No permissions' : 'Valid'
    };
    
  } catch (error) {
    logger.error('User validation failed', { userId, error: error.message });
    throw new Error(`Validation failed: ${error.message}`);
  }
}

// ✅ REQUIRED - Real payment processing
async function processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
  // Real input validation
  const validation = await validatePaymentData(paymentData);
  if (!validation.valid) {
    throw new Error(`Invalid payment data: ${validation.errors.join(', ')}`);
  }
  
  try {
    // Real payment gateway integration
    const paymentGateway = new StripePaymentGateway(process.env.STRIPE_SECRET_KEY);
    const result = await paymentGateway.processPayment({
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethodId,
      customerId: paymentData.customerId
    });
    
    // Real database recording
    const transaction = await db.query(
      'INSERT INTO transactions (id, amount, currency, status, gateway_id) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), paymentData.amount, paymentData.currency, result.status, result.id]
    );
    
    // Real audit logging
    await auditService.log({
      action: 'PAYMENT_PROCESSED',
      userId: paymentData.userId,
      amount: paymentData.amount,
      transactionId: transaction.insertId
    });
    
    return {
      success: result.status === 'succeeded',
      transactionId: transaction.insertId,
      gatewayId: result.id,
      status: result.status
    };
    
  } catch (error) {
    logger.error('Payment processing failed', { paymentData, error: error.message });
    throw new Error(`Payment failed: ${error.message}`);
  }
}
```

## 🧪 TESTING REQUIREMENTS

### Every Function Must Have Real Tests:

```typescript
// ✅ REQUIRED - Real tests with real scenarios
describe('UserValidation', () => {
  beforeEach(async () => {
    // Set up real test database
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    // Clean up real test data
    await cleanupTestDatabase();
  });
  
  it('should validate active user with permissions', async () => {
    // Create real test user
    const userId = await createTestUser({
      status: 'active',
      permissions: ['read', 'write']
    });
    
    const result = await validateUser(userId);
    
    expect(result.valid).toBe(true);
    expect(result.reason).toBe('Valid');
  });
  
  it('should reject inactive user', async () => {
    // Create real test user
    const userId = await createTestUser({
      status: 'inactive',
      permissions: ['read']
    });
    
    const result = await validateUser(userId);
    
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('User inactive');
  });
  
  it('should handle database errors gracefully', async () => {
    // Simulate real database error
    jest.spyOn(db, 'query').mockRejectedValue(new Error('Connection failed'));
    
    await expect(validateUser('test-user')).rejects.toThrow('Validation failed: Connection failed');
  });
});
```

## 📊 VERIFICATION CHECKLIST

### Before ANY code is considered complete:

#### ✅ Real Implementation Checklist:
- [ ] No TODO/FIXME comments
- [ ] No placeholder functions
- [ ] No mock return values
- [ ] Real database operations
- [ ] Real API integrations
- [ ] Real error handling
- [ ] Real input validation
- [ ] Real business logic
- [ ] Real security measures
- [ ] Real audit logging

#### ✅ Testing Checklist:
- [ ] Unit tests with real scenarios
- [ ] Integration tests with real data
- [ ] Error handling tests
- [ ] Performance tests
- [ ] Security tests
- [ ] All tests pass
- [ ] 90%+ code coverage

#### ✅ Production Readiness Checklist:
- [ ] Works with real database
- [ ] Handles real user input
- [ ] Processes real business data
- [ ] Integrates with real external services
- [ ] Meets real performance requirements
- [ ] Complies with real regulations
- [ ] Ready for immediate deployment

## 🚨 VIOLATION RESPONSE

### If ANY fake implementation is detected:

1. **STOP IMMEDIATELY** - Do not continue development
2. **RUN DETECTION SCRIPT** - Identify all violations
3. **REMOVE ALL FAKE CODE** - Delete every placeholder
4. **IMPLEMENT REAL FUNCTIONALITY** - Build actual working code
5. **TEST THOROUGHLY** - Verify real-world operation
6. **RE-RUN DETECTION** - Ensure all violations are fixed
7. **DOCUMENT CHANGES** - Update all relevant documentation

### Escalation Process:
1. **First Violation**: Warning and immediate fix required
2. **Second Violation**: Code review required before proceeding
3. **Third Violation**: Complete code audit and refactoring

## 🎯 SUCCESS DEFINITION

### A feature is ONLY complete when:
- ✅ **Detection script passes** with zero violations
- ✅ **All tests pass** with real data
- ✅ **Code review approves** real implementations
- ✅ **Integration testing** succeeds with real systems
- ✅ **Performance benchmarks** meet requirements
- ✅ **Security audit** passes all checks
- ✅ **Production deployment** is successful

## 🔒 COMMITMENT

**I SOLEMNLY COMMIT TO:**
- **NEVER create placeholder implementations**
- **ALWAYS build real, working functionality**
- **ALWAYS test with real data and scenarios**
- **ALWAYS verify production readiness**
- **ALWAYS run detection scripts before committing**

**I UNDERSTAND THAT:**
- **Fake implementations waste time and resources**
- **15 previous projects failed due to this exact problem**
- **Only real implementations create real business value**
- **This is the last chance to build a working application**

---

**REMEMBER: The goal is a REAL, WORKING, PRODUCTION-READY APPLICATION - not fake code that looks impressive but doesn't work.**