# Database Structure Clarification: Master DB vs Organization DBs

## 🗄️ Database Architecture (Option 2)

```
┌─────────────────────────────────────────┐
│         MASTER DATABASE                  │
│    (Central/Shared/Corporate)            │
│  - Users & Agents                        │
│  - User-Organization Mapping             │
│  - Organization Metadata                 │
│  - Roles & Permissions                   │
│  - System Configuration                  │
│  - Audit Logs                            │
│  - Phone Number Routing                  │
└─────────────────────────────────────────┘
              ↓
   ┌──────────────────────────┐
   │  One copy of each user   │
   │  Central control         │
   │  Cross-org visibility    │
   └──────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   ORGANIZATION-SPECIFIC DATABASES       │
│         (Separate Instance)             │
├─────────────────────────────────────────┤
│ Organization 1 Database                 │
│ ├─ Messages                             │
│ ├─ Customers/Contacts                   │
│ ├─ Tickets                              │
│ ├─ Conversations                        │
│ └─ Org-specific data                    │
├─────────────────────────────────────────┤
│ Organization 2 Database                 │
│ ├─ Messages                             │
│ ├─ Customers/Contacts                   │
│ ├─ Tickets                              │
│ ├─ Conversations                        │
│ └─ Org-specific data                    │
├─────────────────────────────────────────┤
│ Organization N Database                 │
│ ├─ Messages                             │
│ ├─ Customers/Contacts                   │
│ ├─ Tickets                              │
│ └─ Org-specific data                    │
└─────────────────────────────────────────┘
```

---

## 📊 Master Database Tables

### Users & Authentication
```sql
-- Master DB
users (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  avatar_url,
  is_active,
  created_at
)
```
**Purpose:** Single user record for entire system  
**Why:** One login, then switch between organizations  
**Example:** Agent "john@company.com" logs in once, then can access all assigned orgs

### User-Organization Mapping
```sql
-- Master DB
user_organizations (
  id,
  user_id,
  organization_id,
  role,  -- 'admin', 'manager', 'agent', 'viewer'
  is_active,
  assigned_at
)
```
**Purpose:** Defines which users can access which organizations  
**Why:** Control access - John is admin for Org 1, but only agent for Org 2  
**Example:**
```
user_id: 5 (John) → org_id: 1 (Renew Health) with role: 'admin'
user_id: 5 (John) → org_id: 2 (Dev Startup) with role: 'agent'
```

### Organization Metadata
```sql
-- Master DB
organizations (
  id,
  name,
  twilio_number,
  database_host,
  database_port,
  database_name,
  database_user,
  database_password, -- encrypted
  branding_color,
  logo_url,
  status,
  created_at
)
```
**Purpose:** Organization configuration and routing  
**Why:** Backend looks up which database to connect to  
**Example:**
```
org_id: 1 → Renew Health → database: renewhealth_db → twilio: +1-212-555-1234
org_id: 2 → Dev Startup → database: dev_startup_db → twilio: +1-917-555-5678
```

### Roles & Permissions
```sql
-- Master DB
roles (
  id,
  name,
  description,
  permissions
)

-- Example roles:
admin:   Can manage users, change settings, view all data
manager: Can assign agents, view reports, manage workflows
agent:   Can send/receive messages, create tickets
viewer:  Read-only access
```

### Phone Number Routing
```sql
-- Master DB
phone_number_routing (
  id,
  phone_number,      -- +1-212-555-1234
  organization_id,   -- FK to organizations
  is_active,
  priority
)
```
**Purpose:** Incoming SMS routing  
**Why:** When SMS arrives to +1-212-555-1234, route to Org 1  
**Example:**
```
+1-212-555-1234 → organization_id: 1 → renewhealth_db
+1-917-555-5678 → organization_id: 2 → dev_startup_db
```

### System Configuration
```sql
-- Master DB
system_config (
  id,
  key,
  value,
  description
)

-- Examples:
max_concurrent_sessions: 10
default_message_retention: 30  -- days
webhook_timeout: 5000  -- ms
rate_limit_per_org: 100  -- messages/minute
```

### Audit Logs
```sql
-- Master DB
audit_logs (
  id,
  user_id,
  organization_id,
  action,  -- 'login', 'send_message', 'delete_ticket'
  resource_type,
  resource_id,
  timestamp
)
```
**Purpose:** Track who did what across all organizations  
**Why:** Security & compliance  
**Example:**
```
User 5 logged in to Organization 1 at 2026-11-24 10:30
User 5 sent message via Organization 1 at 2026-11-24 10:35
User 5 switched to Organization 2 at 2026-11-24 10:40
```

---

## 📊 Organization-Specific Database Tables

### In Each Organization's Database

```sql
-- Organization 1 Database (renewhealth_db)
messages (
  id,
  from_number,
  to_number,
  body,
  status,
  sent_at,
  received_at
)

customers (
  id,
  phone_number,
  name,
  email,
  metadata
)

tickets (
  id,
  customer_id,
  subject,
  status,
  created_at
)

conversations (
  id,
  ticket_id,
  message_id,
  sender_type, -- 'customer' or 'agent'
  sender_id
)
```

**Important:** NO user/agent/role tables here!  
**Why:** Organization doesn't care about users - they care about their own data

---

## 🔄 Data Flow Example: User Login

### Step 1: Login (Uses Master DB)
```
User enters: email: john@company.com, password: xxx

Backend:
1. Query MASTER DB: users WHERE email = 'john@company.com'
2. Verify password
3. Find all organizations for this user:
   SELECT organizations FROM user_organizations 
   WHERE user_id = 5
4. Find user's role in each org:
   SELECT role FROM user_organizations 
   WHERE user_id = 5 AND organization_id = 1
   → Returns: 'admin'

Result: User logged in, can see:
  ✓ Organization 1 (as admin)
  ✓ Organization 2 (as agent)
```

### Step 2: User Switches to Organization 1
```
Frontend:
1. Redux sets: currentOrganization = Org 1
2. Redux sets: userRole = 'admin'
3. API interceptor adds header: X-Organization-ID: 1

Backend (fetching org-specific data):
1. See X-Organization-ID: 1
2. Look up in Master DB: organizations WHERE id = 1
3. Get connection: renewhealth_db
4. Connect to renewhealth_db
5. Query: SELECT * FROM messages
6. Return messages from renewhealth_db ONLY
```

### Step 3: User Switches to Organization 2
```
Frontend:
1. Redux sets: currentOrganization = Org 2
2. Redux sets: userRole = 'agent'
3. API interceptor adds header: X-Organization-ID: 2

Backend:
1. See X-Organization-ID: 2
2. Look up in Master DB: organizations WHERE id = 2
3. Get connection: dev_startup_db
4. Connect to dev_startup_db
5. Query: SELECT * FROM messages
6. Return messages from dev_startup_db ONLY
```

---

## 🎯 Key Design Principles

### Master DB Contains
✅ User information (email, password, name)  
✅ User-organization mappings (who can access what)  
✅ Organization metadata (names, configs, DB connections)  
✅ Roles & Permissions (admin, manager, agent, viewer)  
✅ System configuration (settings, limits)  
✅ Audit logs (tracking all activities)  
✅ Phone number routing (SMS routing rules)  

### Organization DBs Contain
✅ Messages (SMS conversations)  
✅ Customers/Contacts (phone numbers, emails)  
✅ Tickets (support tickets specific to org)  
✅ Conversations (linked to tickets)  
✅ Org-specific workflows & automation  

### NEVER Put in Org DBs
❌ Users (goes to master DB)  
❌ Roles (goes to master DB)  
❌ Permissions (goes to master DB)  
❌ Login credentials (goes to master DB)  
❌ Organization metadata (goes to master DB)  

### NEVER Put in Master DB
❌ Messages (goes to org DB)  
❌ Customers (goes to org DB)  
❌ Tickets (goes to org DB)  
❌ Org-specific data (goes to org DB)  

---

## 🔐 Why This Architecture?

### Scenario: Organization deleted
```
If users stored in each org DB:
  Delete Org 1 database → User "john" data lost
  Problem: User can't log in to other orgs ❌

With Master DB for users:
  Delete Org 1 database → Org 1 data lost
  User "john" still exists in Master DB ✓
  John can still log in and access Org 2 ✓
```

### Scenario: User assigned to new organization
```
If roles stored in each org DB:
  Add user to Org 3 → Must update Org 3 database
  Problem: Org 3 database might be offline ❌

With Master DB for roles:
  Add user to Org 3 → Update Master DB (always online) ✓
  Connect to Org 3 DB → Can use credentials from Master ✓
  Problem solved ✓
```

### Scenario: Audit trail needed
```
If audit logs in each org DB:
  "Who logged in today?" → Must query ALL databases ❌
  Performance nightmare ❌

With Master DB audit logs:
  "Who logged in today?" → Single query ✓
  Fast ✓
  Complete across all orgs ✓
```

---

## 📋 Summary Table

| Data Type | Storage | Why |
|-----------|---------|-----|
| **Users** | Master DB | Single record per person, cross-org visibility |
| **Passwords** | Master DB | Security, centralized auth |
| **User-Org Mapping** | Master DB | Control who accesses which org |
| **Roles & Permissions** | Master DB | Define capabilities once, apply everywhere |
| **Organization Config** | Master DB | Routing info, database connections |
| **Phone Numbers** | Master DB | SMS routing decisions |
| **Audit Logs** | Master DB | Track activities across all orgs |
| **Messages** | Org DB | SMS data isolated per org |
| **Customers** | Org DB | Contact data isolated per org |
| **Tickets** | Org DB | Support data isolated per org |
| **Conversations** | Org DB | Linked to org's tickets |

---

## 💾 Database Connection Example

```typescript
// Backend logic (simplified)

// 1. User logs in - Query MASTER DB
const user = await masterDb.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// 2. User switches to Organization 1
const org = await masterDb.query(
  'SELECT * FROM organizations WHERE id = ?',
  [organizationId]
);

// 3. Connect to that org's database
const orgConnection = new Database({
  host: org.database_host,
  database: org.database_name,
  user: org.database_user,
  password: org.database_password  // encrypted
});

// 4. Query org-specific data
const messages = await orgConnection.query(
  'SELECT * FROM messages'
);

// 5. Return org's messages
return messages;
```

---

## ✅ This Architecture Enables

✅ **Multiple Organizations** - Each with separate data  
✅ **Shared Users** - One user can access multiple orgs  
✅ **Role Management** - Different roles per org per user  
✅ **Data Isolation** - Org 1 never sees Org 2 data  
✅ **Easy Scaling** - Add new org = add new database + 1 master DB row  
✅ **Fast Auth** - Login from master DB, then route to org  
✅ **Audit Trail** - Complete history in one place  
✅ **User Permissions** - Granular control per org  

---

**Master DB = Cross-organization shared data**  
**Org DBs = Organization-specific data**  
**Result = Perfect multi-tenancy architecture** ✓

