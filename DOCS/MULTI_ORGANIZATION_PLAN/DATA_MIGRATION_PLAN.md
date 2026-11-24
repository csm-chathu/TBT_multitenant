# Data Migration Plan: Single Org → Multi-Org (Option 2)

**Purpose:** Migrate existing RenewHealth data from current single-database setup to new multi-organization architecture  
**Risk Level:** Medium (data is critical)  
**Downtime:** 30 minutes - 2 hours (depending on data volume)  
**Testing:** 2-3 days recommended before production migration

---

## 🔍 Current State Assessment

### Your Existing Setup
```
Current Database: renewhealth_db (MySQL)
├─ users (email, password, name)
├─ applications (phone_number, service_config)
├─ messages (from, to, body, ticket_id)
├─ tickets (subject, status)
├─ customers (phone, email, name)
└─ Other tables...

Twilio Setup:
├─ Single account
└─ One phone number (+1-212-555-1234)
```

### After Migration (New Setup)
```
Master Database: renewhealth_master
├─ users (preserved from current)
├─ user_organizations (NEW)
├─ organizations (NEW)
├─ roles_permissions (NEW)
├─ phone_number_routing (NEW)
├─ audit_logs (NEW)
└─ system_config (NEW)

Organization 1 Database: renewhealth_org1
├─ messages (migrated from current)
├─ tickets (migrated from current)
├─ customers (migrated from current)
└─ conversations (migrated/created)
```

---

## 📋 Migration Strategy

### Phase 1: Preparation (Day 1)

#### 1.1 Backup Everything
```bash
# Back up current production database
mysqldump -h db-host -u user -p renewhealth_db > renewhealth_backup_$(date +%Y%m%d).sql

# Store in multiple locations:
# 1. Local backup server
# 2. Cloud storage (S3)
# 3. External drive (physical backup)
```

**Verification:**
```bash
# Verify backup integrity
mysql -h backup-host -u user -p renewhealth_backup < renewhealth_backup_20261124.sql
# Count tables and rows
USE renewhealth_backup;
SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES;
```

#### 1.2 Create New Master Database
```sql
CREATE DATABASE renewhealth_master;
CREATE DATABASE renewhealth_org1;

-- Use master database
USE renewhealth_master;

-- Create master tables
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  twilio_number VARCHAR(20) UNIQUE NOT NULL,
  database_host VARCHAR(255),
  database_port INT,
  database_name VARCHAR(255),
  database_user VARCHAR(255),
  database_password TEXT,
  branding_color VARCHAR(7) DEFAULT '#667eea',
  status ENUM('active', 'inactive', 'suspended'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  organization_id INT NOT NULL,
  role VARCHAR(50) DEFAULT 'agent',
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  UNIQUE KEY unique_user_org (user_id, organization_id)
);

CREATE TABLE phone_number_routing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  organization_id INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 1,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE roles_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSON,
  description VARCHAR(500)
);

CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(500)
);

CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  organization_id INT,
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

#### 1.3 Create Organization-Specific Database
```sql
USE renewhealth_org1;

-- Copy structure from current production
-- (These tables already exist in your current DB)
CREATE TABLE messages LIKE renewhealth_db.messages;
CREATE TABLE tickets LIKE renewhealth_db.tickets;
CREATE TABLE customers LIKE renewhealth_db.customers;
CREATE TABLE conversations LIKE renewhealth_db.conversations;

-- Add organization context if needed
ALTER TABLE messages ADD COLUMN organization_id INT DEFAULT 1;
ALTER TABLE tickets ADD COLUMN organization_id INT DEFAULT 1;
ALTER TABLE customers ADD COLUMN organization_id INT DEFAULT 1;
ALTER TABLE conversations ADD COLUMN organization_id INT DEFAULT 1;
```

---

### Phase 2: Data Migration (Day 1-2)

#### 2.1 Migrate Users to Master Database
```sql
-- Step 1: Copy users from current DB to master DB
INSERT INTO renewhealth_master.users 
(email, password_hash, first_name, last_name, avatar_url, is_active)
SELECT 
  email, 
  password_hash, 
  first_name, 
  last_name, 
  avatar_url, 
  is_active
FROM renewhealth_db.users;

-- Verify count matches
SELECT 'Current DB' as source, COUNT(*) as user_count FROM renewhealth_db.users
UNION ALL
SELECT 'Master DB' as source, COUNT(*) as user_count FROM renewhealth_master.users;

-- Should show same count for both
```

#### 2.2 Create Organization Record
```sql
-- Create Renew Health organization
INSERT INTO renewhealth_master.organizations 
(name, twilio_number, database_host, database_port, database_name, database_user, database_password, status)
VALUES (
  'Renew Health',
  '+1-212-555-1234',  -- Your existing Twilio number
  'db-host',          -- Your database host
  3306,               -- MySQL default port
  'renewhealth_org1', -- New organization database name
  'db_user',          -- Database user
  CONCAT('aes_encrypt(\'', 'db_password', '\')'),  -- Encrypted password
  'active'
);

-- Note the organization ID (usually 1)
SELECT id, name, twilio_number FROM renewhealth_master.organizations;
-- Expected: id=1, name='Renew Health', twilio_number='+1-212-555-1234'
```

#### 2.3 Map Users to Organization
```sql
-- Assign all existing users to Renew Health organization
INSERT INTO renewhealth_master.user_organizations (user_id, organization_id, role)
SELECT id, 1, 'admin' FROM renewhealth_master.users;

-- Verify mapping
SELECT COUNT(*) as mapped_users FROM renewhealth_master.user_organizations 
WHERE organization_id = 1;
-- Should match user count
```

#### 2.4 Set Up Phone Number Routing
```sql
-- Configure incoming SMS routing
INSERT INTO renewhealth_master.phone_number_routing (phone_number, organization_id, is_active)
VALUES ('+1-212-555-1234', 1, true);

-- Verify routing
SELECT phone_number, organization_id FROM renewhealth_master.phone_number_routing;
```

#### 2.5 Set Up Roles and Permissions
```sql
-- Define role capabilities
INSERT INTO renewhealth_master.roles_permissions (role_name, permissions, description)
VALUES 
  ('admin', '{"send_message":true, "manage_users":true, "view_reports":true, "delete_data":true}', 'Full system access'),
  ('manager', '{"send_message":true, "manage_users":true, "view_reports":true}', 'Team management and reporting'),
  ('agent', '{"send_message":true, "view_tickets":true}', 'Handle customer messages'),
  ('viewer', '{"view_tickets":true, "view_reports":true}', 'Read-only access');
```

#### 2.6 Migrate Organization Data (Messages, Tickets, Customers)
```sql
-- Migrate messages
INSERT INTO renewhealth_org1.messages
SELECT * FROM renewhealth_db.messages;

-- Migrate tickets
INSERT INTO renewhealth_org1.tickets
SELECT * FROM renewhealth_db.tickets;

-- Migrate customers
INSERT INTO renewhealth_org1.customers
SELECT * FROM renewhealth_db.customers;

-- Migrate conversations
INSERT INTO renewhealth_org1.conversations
SELECT * FROM renewhealth_db.conversations;

-- Verify counts
SELECT 'Messages' as table_name, COUNT(*) as row_count FROM renewhealth_org1.messages
UNION ALL
SELECT 'Tickets', COUNT(*) FROM renewhealth_org1.tickets
UNION ALL
SELECT 'Customers', COUNT(*) FROM renewhealth_org1.customers
UNION ALL
SELECT 'Conversations', COUNT(*) FROM renewhealth_org1.conversations;
```

#### 2.7 Verify Data Integrity
```sql
-- Check for null values in critical fields
SELECT 'messages' as table_name, COUNT(*) as null_count 
FROM renewhealth_org1.messages 
WHERE id IS NULL OR from_number IS NULL OR to_number IS NULL

UNION ALL

SELECT 'tickets', COUNT(*) 
FROM renewhealth_org1.tickets 
WHERE id IS NULL OR subject IS NULL

UNION ALL

SELECT 'customers', COUNT(*) 
FROM renewhealth_org1.customers 
WHERE id IS NULL OR phone_number IS NULL;

-- Should show 0 for all (no nulls in critical fields)
```

---

### Phase 3: Testing (Day 2-3)

#### 3.1 Functional Testing
```
Test Cases:
1. User Login
   [ ] User can log in with existing credentials
   [ ] Session created with organization context
   [ ] JWT token includes org_id

2. Organization Switching
   [ ] User can see assigned organizations
   [ ] Can switch between organizations
   [ ] Data switches correctly

3. Message Retrieval
   [ ] Fetch messages from org1
   [ ] Verify message count matches original DB
   [ ] Check all message fields present

4. Send Message
   [ ] Can send new message
   [ ] Message saved to org1 database only
   [ ] Twilio API called correctly

5. Ticket Management
   [ ] Tickets display correctly
   [ ] Can create new ticket
   [ ] Ticket linked to customer

6. Webhook Routing
   [ ] Incoming SMS routed to org1
   [ ] Message saved to correct database
   [ ] No cross-org data leakage
```

#### 3.2 Performance Testing
```bash
# Test queries on new databases
# Should be fast - each org DB only has that org's data

# Query messages (org1 should be fast)
mysql -h db-host -D renewhealth_org1 -e "SELECT COUNT(*) FROM messages;"

# Check indexes
mysql -h db-host -D renewhealth_org1 -e "SHOW INDEX FROM messages;"

# Test complex query performance
time mysql -h db-host -D renewhealth_org1 -e "
  SELECT m.id, m.from_number, m.to_number, c.name
  FROM messages m
  LEFT JOIN customers c ON m.customer_id = c.id
  LIMIT 1000;
"
# Should complete in < 100ms
```

#### 3.3 Data Validation
```
Checklist:
[ ] User count in master DB = original user count
[ ] Message count in org1 DB = original message count
[ ] Ticket count in org1 DB = original ticket count
[ ] Customer count in org1 DB = original customer count
[ ] All foreign key relationships intact
[ ] No duplicate records
[ ] No data loss
[ ] Timestamps preserved
[ ] Phone numbers valid
[ ] Email addresses valid
```

---

### Phase 4: Pre-Production Migration (Day 3)

#### 4.1 Staging Environment Test
```
Steps:
1. Deploy new backend code to staging
2. Point to master DB (renewhealth_master) and org1 DB (renewhealth_org1)
3. Run full integration test suite
4. Test with real Twilio sandbox credentials
5. Verify webhooks work
6. Test organization switching 10+ times
7. Load test: Send 100 messages, fetch 1000 records
8. User acceptance testing (if applicable)
```

#### 4.2 Final Validation
```
Before Production:
[ ] All tests passing
[ ] No error logs
[ ] Performance acceptable (< 200ms per request)
[ ] Webhooks routing correctly
[ ] Data integrity verified
[ ] Backup verified again
[ ] Rollback procedure documented
[ ] Team trained
[ ] Monitoring configured
```

---

### Phase 5: Production Migration (Day 4)

#### 5.1 Maintenance Window
```
Timing:
- Schedule during low-traffic period (e.g., 2 AM - 4 AM)
- Notify users of maintenance window
- Disable Twilio webhooks temporarily
- Stop all background jobs

Duration: 30 minutes to 2 hours
Depends on:
- Total data volume
- Number of messages/tickets
- Database size
```

#### 5.2 Production Migration Steps
```
Timeline:

T-30 mins:
[ ] Final backup of production database
[ ] Alert team (migration in progress)
[ ] Stop message processing service

T-10 mins:
[ ] Verify backup integrity
[ ] All systems ready

T-0 mins:
[ ] Start migration
[ ] Copy users to master DB
[ ] Copy org data to org1 DB
[ ] Create organization record
[ ] Map users to organization
[ ] Configure routing

T+10 mins:
[ ] Data validation running
[ ] No errors reported

T+20 mins:
[ ] Enable new backend code
[ ] Test login (10+ users)
[ ] Test message sending
[ ] Verify organization switching

T+25 mins:
[ ] Re-enable Twilio webhooks
[ ] Monitor webhook processing

T+30 mins:
[ ] All systems operational
[ ] Announce migration complete
[ ] Monitor for 2 hours
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### Quick Rollback (< 15 minutes)

```bash
# Step 1: Stop all services
systemctl stop nestjs-backend
systemctl stop frontend-app

# Step 2: Point backend back to old database
# Update .env file
DATABASE_URL=mysql://user:pass@db-host:3306/renewhealth_db

# Step 3: Restart services with old database
systemctl start nestjs-backend
systemctl start frontend-app

# Step 4: Verify old system is back
curl http://localhost:3000/health
# Should respond with current database info

# Step 5: Notify team
# "Rolled back to previous version at 2:15 AM due to [issue]"
```

### Full Rollback Strategy
```
If migration fails:
1. Restore from backup (< 10 mins)
2. Verify data integrity (< 5 mins)
3. Restart application (< 2 mins)
4. Run tests (< 10 mins)
5. Troubleshoot issue (varies)
6. Retry migration (or schedule for later)
```

### Verification After Rollback
```sql
-- Verify old data is intact
USE renewhealth_db;
SELECT COUNT(*) FROM messages;
SELECT COUNT(*) FROM tickets;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM customers;

-- Compare with backup record
-- Should match backup counts exactly
```

---

## 📊 Data Volume Estimation

### For Migration Timing
```
Data Volume → Migration Time

0 - 10K messages    → 1-5 minutes
10K - 100K          → 5-15 minutes
100K - 1M           → 15-45 minutes
1M+                 → 45 minutes - 2 hours

Actual time depends on:
- Server hardware
- Network speed
- Other database load
- Query optimization
```

**For RenewHealth (estimated):**
```
Messages: ~10,000-50,000      → ~5-15 mins
Tickets: ~1,000-5,000         → ~1-5 mins
Customers: ~500-2,000         → < 1 min
Total Migration: ~15-30 mins (average)
```

---

## ✅ Post-Migration Verification

### Day 1 (After Migration)
```
Checklist:
[ ] All users can log in
[ ] Can see their organization
[ ] Can send/receive messages
[ ] Can view tickets
[ ] No data appears to be missing
[ ] Performance is acceptable
[ ] No error logs
[ ] Backup was successful
```

### Day 2-7 (Post-Migration Monitoring)
```
Daily Checks:
[ ] Review error logs (should be empty)
[ ] Check message processing latency
[ ] Verify webhook delivery rate > 99%
[ ] Check database query performance
[ ] Monitor disk space usage
[ ] Review audit logs for anomalies
[ ] User reports (monitor for complaints)
```

### Week 2+ (Stability Monitoring)
```
Ongoing:
[ ] Weekly backup integrity tests
[ ] Monthly performance review
[ ] Database optimization (if needed)
[ ] Update documentation
[ ] Archive old backups (after 30 days)
[ ] Plan for new organizations (if needed)
```

---

## 🚨 Potential Issues & Solutions

### Issue 1: "Foreign Key Errors During Migration"
**Cause:** Related data doesn't exist in new DB  
**Solution:**
```sql
-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS=0;

-- Run migrations
INSERT INTO renewhealth_org1.messages SELECT * FROM renewhealth_db.messages;

-- Re-enable and validate
SET FOREIGN_KEY_CHECKS=1;

-- Identify orphaned records
SELECT * FROM renewhealth_org1.messages 
WHERE customer_id NOT IN (SELECT id FROM renewhealth_org1.customers);
```

### Issue 2: "Data Type Mismatches"
**Cause:** Column definitions don't match  
**Solution:**
```sql
-- Check column definitions
DESCRIBE renewhealth_db.messages;
DESCRIBE renewhealth_org1.messages;

-- Update mismatched columns
ALTER TABLE renewhealth_org1.messages 
MODIFY COLUMN from_number VARCHAR(20);

-- Retry migration
```

### Issue 3: "Duplicate Key Errors"
**Cause:** Records already exist in destination  
**Solution:**
```sql
-- Check for existing data
SELECT COUNT(*) FROM renewhealth_org1.messages;

-- If not empty, truncate first
TRUNCATE TABLE renewhealth_org1.messages;

-- Or use REPLACE to overwrite
REPLACE INTO renewhealth_org1.messages
SELECT * FROM renewhealth_db.messages;
```

### Issue 4: "Slow Migration (Timeout)"
**Cause:** Too much data, network too slow  
**Solution:**
```sql
-- Migrate in batches
INSERT INTO renewhealth_org1.messages
SELECT * FROM renewhealth_db.messages
WHERE id BETWEEN 1 AND 10000;

-- Wait for batch to complete
-- Then next batch
INSERT INTO renewhealth_org1.messages
SELECT * FROM renewhealth_db.messages
WHERE id BETWEEN 10001 AND 20000;

-- Continue until all data migrated
```

---

## 📝 Migration Checklist

### Pre-Migration (1 week before)
- [ ] Read and understand this entire document
- [ ] Notify stakeholders of maintenance window
- [ ] Back up all data (multiple locations)
- [ ] Test backup restoration
- [ ] Create new databases (staging)
- [ ] Test migration in staging
- [ ] Prepare rollback plan
- [ ] Brief team on migration process

### Day-Of (During Migration)
- [ ] Verify backups current
- [ ] Stop all services
- [ ] Run migration scripts
- [ ] Validate data integrity
- [ ] Run functional tests
- [ ] Enable new system
- [ ] Monitor for errors
- [ ] Log all activities

### Post-Migration (1 week after)
- [ ] Verify all systems stable
- [ ] Monitor performance
- [ ] Check for data anomalies
- [ ] Archive old database (keep 30 days)
- [ ] Document migration results
- [ ] Update runbooks
- [ ] Plan next improvements

---

## 🎯 Success Criteria

Migration is successful when:
✅ Zero data loss (row counts match)  
✅ All users can log in  
✅ All organizations accessible  
✅ Messages display correctly  
✅ Webhooks routing correctly  
✅ Performance same or better  
✅ No new error logs  
✅ Backup created and verified  

---

**Migration Status:** Ready to execute  
**Risk Level:** Medium (mitigation: comprehensive backups + rollback plan)  
**Timeline:** 4 days total (3 days testing + 1 day production)  

