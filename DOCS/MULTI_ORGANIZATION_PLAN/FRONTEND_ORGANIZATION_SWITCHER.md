# 🏢 Frontend Organization Switcher & Multi-Tenant Portal
## Supporting Multiple Organizations with Unified Dashboard

**Updated Plan:** Each Twilio number = Different Organization  
**Goal:** Manage all organizations from one portal with organization switcher

---

## 🎯 New Architecture (Multi-Tenant)

### Previous Assumption (Outdated):
```
One RenewHealth Organization
├─ Twilio Number 1 (Primary)
├─ Twilio Number 2 (Dev)
└─ Twilio Number 3 (Test)
```

### New Reality (What We're Building):
```
ONE PORTAL
├─ Organization A (Twilio: +1-XXX-XXXX1)
│  ├─ Database: org_a_db
│  ├─ Tickets
│  ├─ Customers
│  └─ SMS logs
│
├─ Organization B (Twilio: +1-YYY-YYYY2)
│  ├─ Database: org_b_db
│  ├─ Tickets
│  ├─ Customers
│  └─ SMS logs
│
└─ Organization C (Twilio: +1-ZZZ-ZZZZ3)
   ├─ Database: org_c_db
   ├─ Tickets
   ├─ Customers
   └─ SMS logs

[Organization Switcher] ← User can switch between all 3
```

---

## 🏗️ Updated Architecture (Backend)

### New Model: Organization

```typescript
// src/models/organization.ts (Enhanced)

export class Organization extends Model {
  declare id: number;
  declare name: string;              // "RenewHealth Org A"
  declare twilio_number: string;     // +1-XXX-XXXX1
  declare database_name: string;     // org_a_db
  declare database_host: string;     // localhost
  declare database_user: string;
  declare database_password: string;
  declare is_active: boolean;
  declare logo_url?: string;         // Org branding
  declare branding_color?: string;   // For UI
  declare description?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}
```

### Enhanced Backend Routing

```
API Request with JWT
  ↓
Extract user from JWT
  ↓
Get user's assigned organizations
  ↓
Check which org user is currently viewing
  ↓
Route to that organization's database
  ↓
Return filtered data for that org only
```

---

## 🎨 Frontend Architecture (React)

### Redux State Management

```typescript
// redux/organization/organizationSlice.tsx

interface OrganizationState {
  organizations: Organization[];              // All orgs user has access to
  currentOrganization: Organization | null;   // Currently viewing
  loading: boolean;
  error: string | null;
}

export const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    // Switch to different organization
    switchOrganization: (state, action) => {
      state.currentOrganization = action.payload;
      localStorage.setItem('currentOrgId', action.payload.id);
    },
    
    // Fetch all accessible organizations
    setOrganizations: (state, action) => {
      state.organizations = action.payload;
    },
    
    // Clear organization (logout)
    clearOrganization: (state) => {
      state.currentOrganization = null;
      localStorage.removeItem('currentOrgId');
    }
  }
});
```

---

## 🎛️ Frontend Organization Switcher Component

### Main Switcher Component

```typescript
// src/components/OrganizationSwitcher.tsx

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  switchOrganization,
  fetchOrganizations
} from '@/redux/organization/organizationSlice';

export const OrganizationSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const { organizations, currentOrganization } = useAppSelector(
    state => state.organization
  );

  useEffect(() => {
    // Fetch all organizations user has access to
    dispatch(fetchOrganizations());
  }, [dispatch]);

  const handleSwitchOrganization = (orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      dispatch(switchOrganization(org));
      
      // Reload data for new organization
      window.location.reload(); // Or use Redux thunk to refetch
    }
  };

  if (!currentOrganization) {
    return <div>Loading organization...</div>;
  }

  return (
    <div className="org-switcher">
      {/* Logo & Name */}
      <div className="org-header">
        {currentOrganization.logo_url && (
          <img 
            src={currentOrganization.logo_url} 
            alt={currentOrganization.name}
            className="org-logo"
          />
        )}
        <div className="org-info">
          <h3>{currentOrganization.name}</h3>
          <p className="org-phone">📱 {currentOrganization.twilio_number}</p>
        </div>
      </div>

      {/* Dropdown to Switch */}
      <div className="org-dropdown">
        <select
          value={currentOrganization.id}
          onChange={(e) => handleSwitchOrganization(Number(e.target.value))}
          className="org-select"
        >
          <option value="">Select Organization...</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.twilio_number})
            </option>
          ))}
        </select>
      </div>

      {/* Organization Grid (Alternative UI) */}
      <div className="org-grid">
        {organizations.map(org => (
          <OrgCard
            key={org.id}
            org={org}
            isActive={org.id === currentOrganization.id}
            onSwitch={handleSwitchOrganization}
          />
        ))}
      </div>
    </div>
  );
};
```

### Organization Card Component

```typescript
// src/components/OrgCard.tsx

interface OrgCardProps {
  org: Organization;
  isActive: boolean;
  onSwitch: (orgId: number) => void;
}

export const OrgCard: React.FC<OrgCardProps> = ({
  org,
  isActive,
  onSwitch
}) => {
  return (
    <div
      className={`org-card ${isActive ? 'active' : ''}`}
      style={isActive ? { borderColor: org.branding_color } : {}}
      onClick={() => onSwitch(org.id)}
    >
      {org.logo_url && (
        <img src={org.logo_url} alt={org.name} className="card-logo" />
      )}
      <h4>{org.name}</h4>
      <p className="card-phone">{org.twilio_number}</p>
      <p className="card-description">{org.description}</p>
      
      {isActive && (
        <div className="active-badge">✓ Active</div>
      )}
    </div>
  );
};
```

### Navbar Integration

```typescript
// src/components/Navbar.tsx (Updated section)

export const Navbar: React.FC = () => {
  const { currentOrganization } = useAppSelector(state => state.organization);

  return (
    <nav className="navbar">
      {/* Left: Organization Info */}
      <div className="navbar-left">
        <OrganizationSwitcher />
      </div>

      {/* Center: Navigation */}
      <div className="navbar-center">
        <Link to="/tickets">Tickets</Link>
        <Link to="/customers">Customers</Link>
        <Link to="/messages">Messages</Link>
      </div>

      {/* Right: User & Settings */}
      <div className="navbar-right">
        <span className="org-badge">
          {currentOrganization?.name}
        </span>
        <UserMenu />
      </div>
    </nav>
  );
};
```

---

## 🔄 Updated API Integration

### API Service with Organization Context

```typescript
// src/services/api.tsx (Updated)

import axios from 'axios';
import { store } from '@/redux/store';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

// Add organization context to every request
api.interceptors.request.use((config) => {
  const { currentOrganization } = store.getState().organization;
  
  if (currentOrganization) {
    // Send organization ID in header or query
    config.headers['X-Organization-ID'] = currentOrganization.id;
    
    // Or add to params for specific endpoints
    if (!config.params) config.params = {};
    config.params.orgId = currentOrganization.id;
  }

  // Add auth token
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Endpoints
export const getTickets = (filters?: any) =>
  api.get('/tickets', { params: filters });

export const getCustomers = (filters?: any) =>
  api.get('/customers', { params: filters });

export const getMessages = (filters?: any) =>
  api.get('/messages', { params: filters });

export const getOrganizations = () =>
  api.get('/organizations');

export const switchOrganization = (orgId: number) =>
  api.post(`/organizations/${orgId}/switch`);

export const sendSmsFromOrg = (orgId: number, data: any) =>
  api.post(`/organizations/${orgId}/send-sms`, data);
```

---

## 🔐 Updated Backend API Endpoints

### New Organization Endpoints

```typescript
// src/controllers/organization.controller.ts (New)

@Controller('organizations')
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private dbConnectionService: DatabaseConnectionService
  ) {}

  @Get()
  async getMyOrganizations(@Request() req: any) {
    // Get organizations where user is a member
    return await this.organizationService.getUserOrganizations(req.user.id);
  }

  @Post(':id/switch')
  async switchOrganization(
    @Param('id') orgId: number,
    @Request() req: any
  ) {
    // Verify user has access to this org
    const org = await this.organizationService.getOrganizationForUser(
      orgId,
      req.user.id
    );
    
    if (!org) {
      throw new ForbiddenException('Not authorized for this organization');
    }

    // Store in JWT or session
    return { success: true, organization: org };
  }

  @Get(':id/data')
  async getOrganizationData(
    @Param('id') orgId: number,
    @Request() req: any
  ) {
    // Verify access
    const org = await this.organizationService.getOrganizationForUser(
      orgId,
      req.user.id
    );

    // Get connection to org's database
    const connection = await this.dbConnectionService
      .getConnectionForOrganization(orgId);

    return {
      organization: org,
      ticketCount: await this.getTicketsCount(connection, orgId),
      customerCount: await this.getCustomersCount(connection, orgId),
      smsCount: await this.getSmsCount(connection, orgId),
    };
  }
}
```

### Updated Message Controller (Organization-Aware)

```typescript
// src/controllers/message.controller.ts (Updated)

@Controller('messages')
export class MessageController {
  
  @Get()
  async getMessages(
    @Query('orgId') orgId: number,
    @Request() req: any
  ) {
    // Verify user access
    await this.authService.verifyOrganizationAccess(req.user.id, orgId);

    // Get org's database connection
    const connection = await this.dbConnectionService
      .getConnectionForOrganization(orgId);

    // Fetch from org's database
    const messages = await connection
      .model('Message')
      .findAll({ where: { organization_id: orgId } });

    return messages;
  }

  @Post(':id/send')
  async sendMessage(
    @Param('id') orgId: number,
    @Body() dto: SendMessageDto,
    @Request() req: any
  ) {
    // Verify access
    await this.authService.verifyOrganizationAccess(req.user.id, orgId);

    // Get org info (includes phone number)
    const org = await this.organizationService.getOrganization(orgId);

    // Send SMS from org's phone number
    const result = await this.smsService.sendSms({
      to: dto.to,
      from: org.twilio_number,
      message: dto.message,
      phoneNumber: org.twilio_number,
    });

    // Log to org's database
    const connection = await this.dbConnectionService
      .getConnectionForOrganization(orgId);

    await connection.model('Message').create({
      organization_id: orgId,
      from: org.twilio_number,
      to: dto.to,
      message: dto.message,
      direction: 'outgoing',
      ...result,
    });

    return result;
  }
}
```

---

## 📊 Database Schema Updates

### Enhanced Organization Model

```sql
-- Migration: 001-create-organizations-table.sql
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  twilio_number VARCHAR(20) NOT NULL UNIQUE,
  database_name VARCHAR(100) NOT NULL,
  database_host VARCHAR(255) NOT NULL,
  database_user VARCHAR(100) NOT NULL,
  database_password VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  branding_color VARCHAR(7),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_twilio_number (twilio_number),
  INDEX idx_is_active (is_active)
);

-- Migration: 002-add-organization-to-users.sql
ALTER TABLE users 
ADD COLUMN organization_id INT AFTER id,
ADD CONSTRAINT fk_user_organization 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) ON DELETE RESTRICT;

-- Migration: 003-create-organization-members-table.sql
CREATE TABLE organization_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin', 'manager', 'agent', 'viewer') DEFAULT 'agent',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_org_user (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migration: 004-add-organization-to-tickets-customers-messages.sql
ALTER TABLE tickets 
ADD COLUMN organization_id INT NOT NULL AFTER id,
ADD INDEX idx_tickets_org (organization_id),
ADD CONSTRAINT fk_tickets_org 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE customers 
ADD COLUMN organization_id INT NOT NULL AFTER id,
ADD INDEX idx_customers_org (organization_id),
ADD CONSTRAINT fk_customers_org 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD COLUMN organization_id INT NOT NULL AFTER id,
ADD INDEX idx_messages_org (organization_id),
ADD CONSTRAINT fk_messages_org 
  FOREIGN KEY (organization_id) 
  REFERENCES organizations(id) ON DELETE CASCADE;
```

---

## 🎨 Styling: Organization Switcher UI

### CSS/Tailwind

```typescript
// src/styles/organization-switcher.module.css

.org-switcher {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.org-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.org-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.org-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.org-phone {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.9;
}

.org-dropdown {
  flex: 1;
}

.org-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }

  option {
    background: #333;
    color: white;
  }
}

.org-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.org-card {
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.active {
    border-width: 3px;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  }

  .card-logo {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    margin-bottom: 0.75rem;
  }

  h4 {
    margin: 0.75rem 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .card-phone {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
    font-family: monospace;
  }

  .card-description {
    margin: 0.5rem 0 0 0;
    font-size: 0.8rem;
    color: #999;
  }

  .active-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
}
```

---

## 🔄 Redux Integration (Complete Flow)

```typescript
// redux/organization/organizationSlice.tsx

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '@/services/api';

export interface Organization {
  id: number;
  name: string;
  twilio_number: string;
  logo_url?: string;
  branding_color?: string;
  description?: string;
}

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  loading: false,
  error: null,
};

// Thunks
export const fetchOrganizations = createAsyncThunk(
  'organization/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getOrganizations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const setCurrentOrganization = createAsyncThunk(
  'organization/setCurrent',
  async (orgId: number, { rejectWithValue }) => {
    try {
      const response = await api.switchOrganization(orgId);
      return response.data.organization;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice
export const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    clearOrganization: (state) => {
      state.currentOrganization = null;
      localStorage.removeItem('currentOrgId');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.organizations = action.payload;
        state.loading = false;
        
        // Auto-select last used org or first org
        const savedOrgId = localStorage.getItem('currentOrgId');
        if (savedOrgId) {
          state.currentOrganization =
            action.payload.find((o: Organization) => o.id === parseInt(savedOrgId)) ||
            action.payload[0];
        } else {
          state.currentOrganization = action.payload[0];
        }
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(setCurrentOrganization.fulfilled, (state, action) => {
        state.currentOrganization = action.payload;
        localStorage.setItem('currentOrgId', action.payload.id);
      });
  },
});

export const { clearOrganization } = organizationSlice.actions;
export default organizationSlice.reducer;
```

---

## 🚀 Implementation Steps (Updated)

### Phase 1: Backend Organization Model
- [ ] Create Organization model/table
- [ ] Create OrganizationMembers table
- [ ] Add organization_id to tickets/customers/messages
- [ ] Create OrganizationService

### Phase 2: Backend Organization API
- [ ] Create OrganizationController
- [ ] Add organization access verification
- [ ] Update all endpoints to filter by organization
- [ ] Add organization switching endpoint

### Phase 3: Frontend Redux Setup
- [ ] Create organizationSlice
- [ ] Add fetchOrganizations thunk
- [ ] Add setCurrentOrganization thunk
- [ ] Connect to store

### Phase 4: Frontend UI Components
- [ ] Create OrganizationSwitcher component
- [ ] Create OrgCard component
- [ ] Update Navbar to include switcher
- [ ] Add styling and animations

### Phase 5: API Integration
- [ ] Update api.tsx to include org context
- [ ] Add X-Organization-ID header to requests
- [ ] Update ticket/customer/message APIs

### Phase 6: Testing & Deployment
- [ ] Test switching between organizations
- [ ] Test data isolation
- [ ] Test permissions
- [ ] Deploy to production

---

## ✅ Benefits of This Approach

✅ **Data Isolation:** Each org's data in separate database  
✅ **User Access Control:** Only see orgs you're member of  
✅ **Branding:** Each org can have its own logo/colors  
✅ **Scalability:** Add unlimited organizations  
✅ **Security:** Organization-level permissions  
✅ **Audit Trail:** Track which org viewed what data  
✅ **Multi-Tenancy Ready:** True SaaS platform  

---

## 🔐 Security Checklist

- [ ] Verify user has access to organization before returning data
- [ ] Add organization_id to ALL queries
- [ ] Use organization-level permissions (admin, manager, agent, viewer)
- [ ] Audit log all organization switches
- [ ] Expire old organization sessions
- [ ] Encrypt organization credentials
- [ ] Add rate limiting per organization
- [ ] Monitor cross-organization data access attempts

---

**This is now a true multi-tenant platform supporting unlimited organizations! 🎉**

