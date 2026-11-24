# Notifications Strategy: Multi-Organization Setup

**Status:** Critical component for multi-org system  
**Complexity:** Medium  
**Implementation Time:** 1-2 weeks  

---

## 🔔 What Are Notifications Needed For?

In a multi-organization system, you need notifications for:

```
System Events That Trigger Notifications:
├─ Incoming SMS from customers
├─ Ticket created/updated
├─ Message sent confirmation
├─ User assigned to ticket
├─ Ticket status changed
├─ Organization switched (UI notification)
├─ Error/failure notifications
└─ System alerts
```

---

## 🏗️ Notification Architecture (Option 2)

### Current State (Single Org)
```
Incoming SMS → Twilio Webhook → Backend → Database
                                         → Send notification to agent
```

### New State (Multi-Org)
```
Incoming SMS → Twilio Webhook → Backend Routing → Identify Organization
                                                 ↓
                                    Connect to Org's Database
                                                 ↓
                                    Save to organization_db
                                                 ↓
                                    Get users assigned to org
                                                 ↓
                                    Send notification to those users ONLY
```

**Key Requirement:** Notifications must be scoped to organization

---

## 📊 Database Schema for Notifications

### Master Database: Notification Preferences
```sql
-- Stored in: renewhealth_master
CREATE TABLE notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  organization_id INT NOT NULL,
  notification_type VARCHAR(50),  -- 'sms_received', 'ticket_created', 'ticket_updated'
  channel VARCHAR(20),             -- 'email', 'in_app', 'sms', 'push'
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  UNIQUE KEY unique_pref (user_id, organization_id, notification_type, channel)
);

-- Example data:
-- user_id: 1 (John)
-- org_id: 1 (Renew Health) → Email on SMS received ✓
-- org_id: 2 (Dev Startup) → Email on SMS received ✓ (different settings)
```

### Organization Database: Notification History
```sql
-- Stored in: renewhealth_org1 (each org has its own)
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  organization_id INT DEFAULT 1,
  type VARCHAR(50),              -- 'sms_received', 'ticket_created'
  title VARCHAR(255),
  message TEXT,
  related_entity_type VARCHAR(50), -- 'message', 'ticket', 'customer'
  related_entity_id INT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES renewhealth_master.users(id)
);

-- Example:
-- id: 1001
-- user_id: 1 (John)
-- type: 'sms_received'
-- title: 'New message from +1-917-555-9999'
-- related_entity_type: 'message'
-- related_entity_id: 5050
-- created_at: 2026-11-24 10:30:00
```

---

## 🔄 Notification Flow: Complete Example

### Scenario: Customer sends SMS → Renew Health (Org 1)

```
1. Customer SMS arrives
   From: +1-917-555-9999
   To: +1-212-555-1234 (Renew Health's Twilio number)
   Body: "Need help with appointment"
   
2. Twilio sends webhook POST
   POST /api/webhooks/twilio/sms
   
3. Backend webhook handler
   ├─ Extract "To": +1-212-555-1234
   ├─ Query Master DB: Find org by phone number
   │  → Found: Organization 1 (Renew Health)
   ├─ Get Org 1's database connection
   │  → renewhealth_org1
   └─ Save message to renewhealth_org1.messages
      └─ message_id: 5050
      └─ from_number: +1-917-555-9999
      └─ body: "Need help with appointment"
      
4. Trigger notification service
   ├─ Query Org 1 database:
   │  "Who are the agents for this customer?"
   ├─ Found agents: John (user_id: 1), Sarah (user_id: 2)
   │  (These users are assigned to Org 1)
   │
   └─ For each agent:
      ├─ Check Master DB: Notification preferences for user_id=1, org_id=1
      │  └─ Email enabled? YES
      │  └─ In-app enabled? YES
      │  └─ SMS enabled? NO
      │
      └─ Send notifications:
         ├─ Email: "New message from customer"
         ├─ In-App: "SMS received: Need help with appointment"
         └─ (Skip SMS - not enabled)

5. Store notification record
   ├─ In Org 1 database (renewhealth_org1.notifications):
   │  ├─ user_id: 1
   │  ├─ org_id: 1
   │  ├─ type: 'sms_received'
   │  ├─ title: 'New message from +1-917-555-9999'
   │  ├─ related_entity_type: 'message'
   │  ├─ related_entity_id: 5050
   │  └─ is_read: false
   │
   └─ Agent sees notification in UI

6. Result:
   ✓ John sees notification (he's assigned to Org 1)
   ✓ Sarah sees notification (she's assigned to Org 1)
   ✓ Users in Org 2 see NOTHING (data isolated)
```

---

## 🎯 Types of Notifications Needed

### 1. **Incoming SMS Notification**
```
When: New SMS received from customer
To: Assigned agents in that organization
Show: "New message: [customer name/number] - [preview of message]"
Action: Click → View conversation
Channels: Email, In-App, SMS, Push
```

### 2. **Ticket Created Notification**
```
When: New ticket created in organization
To: Assigned manager or agent
Show: "New ticket: [customer name] - [subject]"
Action: Click → View ticket details
Channels: Email, In-App, Push
```

### 3. **Ticket Status Changed Notification**
```
When: Ticket status updated (e.g., 'open' → 'waiting customer response')
To: Ticket assigned agent
Show: "Ticket status changed: [ticket id] → [new status]"
Action: Click → View ticket
Channels: Email, In-App, Push
```

### 4. **User Assigned to Ticket Notification**
```
When: Agent assigned to ticket
To: That agent
Show: "You've been assigned to ticket: [ticket id] - [subject]"
Action: Click → View assigned ticket
Channels: Email, In-App, Push
```

### 5. **Organization Switched Notification (UI Only)**
```
When: User switches to different organization
To: User interface
Show: "Switched to: [Organization Name]" (banner/toast)
Duration: 3 seconds auto-dismiss
Channels: In-App only
```

### 6. **Error Notification**
```
When: Message sending fails, SMS error, etc.
To: Related user
Show: "Failed to send message: [error reason]"
Action: Click → Retry or View details
Channels: Email, In-App, Push
```

---

## 💬 Frontend: Notification Components

### 1. **Notification Bell (Navbar)**
```
UI Component:
┌─────────────────────────────────────┐
│ [Logo] [OrgSwitcher] [Messages] [🔔] │ ← Bell icon with badge
└─────────────────────────────────────┘
                                        ↓ Click bell
                                   
                            ┌──────────────────┐
                            │ Notifications    │
                            ├──────────────────┤
                            │ 3 New Messages   │ ← From only current org
                            │ 1 New Ticket     │
                            ├──────────────────┤
                            │ [View All] [Mark│
                            │  Read]           │
                            └──────────────────┘

Behavior:
- Shows count of unread notifications
- Shows notifications for CURRENT ORGANIZATION ONLY
- When user switches org, notifications update automatically
- Click notification → Navigate to related item
```

### 2. **Toast Notifications (Real-time)**
```
UI:
┌────────────────────────────────────┐
│ ✓ SMS received from John           │ ← Auto-disappears after 5s
└────────────────────────────────────┘

Types:
- Success (green): "Message sent successfully"
- Error (red): "Failed to send message"
- Info (blue): "Organization switched to Renew Health"
- Warning (yellow): "Webhook delivery failed"
```

### 3. **Notification Preferences Modal**
```
When: User clicks Settings → Notifications

┌─────────────────────────────────┐
│ Notification Settings            │
│ For: Renew Health Org            │ ← Changes per org!
├─────────────────────────────────┤
│ Incoming SMS:                    │
│   [ ] Email [ ] In-App [x] Push  │
│                                 │
│ New Ticket:                      │
│   [x] Email [ ] In-App [ ] Push  │
│                                 │
│ Ticket Updated:                  │
│   [ ] Email [x] In-App [ ] Push  │
│                                 │
│ [Save Changes]                   │
└─────────────────────────────────┘

Important: When user switches org, settings refresh for that org
```

---

## 🔧 Backend: Notification Service

### Notification Service Structure
```typescript
// Pseudo-code
class NotificationService {
  
  // 1. Send notification when SMS received
  async notifyNewMessage(organizationId, messageId) {
    // Get org's database connection
    const orgDb = getConnection(organizationId);
    
    // Get message details
    const message = await orgDb.getMessage(messageId);
    
    // Find related agents
    const agents = await orgDb.getAssignedAgents(message.customerId);
    
    // For each agent
    for (const agent of agents) {
      // Check notification preferences (from MASTER DB)
      const prefs = await masterDb.getNotificationSettings(
        agent.userId, 
        organizationId
      );
      
      // Send via enabled channels
      if (prefs.email_enabled) {
        await emailService.send({
          to: agent.email,
          subject: `New message from ${message.from_number}`,
          body: message.body
        });
      }
      
      if (prefs.inapp_enabled) {
        await this.createInAppNotification({
          userId: agent.userId,
          organizationId: organizationId,
          type: 'sms_received',
          relatedEntityId: messageId
        });
      }
      
      if (prefs.push_enabled) {
        await pushService.send({
          userId: agent.userId,
          title: `New message`,
          body: message.body
        });
      }
    }
  }
  
  // 2. Create in-app notification (stored in org DB)
  async createInAppNotification(data) {
    const orgDb = getConnection(data.organizationId);
    
    return orgDb.notifications.create({
      user_id: data.userId,
      organization_id: data.organizationId,
      type: data.type,
      related_entity_id: data.relatedEntityId,
      is_read: false,
      created_at: new Date()
    });
  }
  
  // 3. Mark notification as read
  async markAsRead(organizationId, notificationId) {
    const orgDb = getConnection(organizationId);
    
    return orgDb.notifications.update(notificationId, {
      is_read: true,
      read_at: new Date()
    });
  }
  
  // 4. Get unread notifications for user in current org
  async getUnreadNotifications(userId, organizationId) {
    const orgDb = getConnection(organizationId);
    
    return orgDb.notifications.find({
      user_id: userId,
      organization_id: organizationId,
      is_read: false
    });
  }
}
```

---

## 🔐 Notification Isolation (Critical!)

### How to Prevent Data Leakage

**Rule 1: User only sees notifications for current organization**
```typescript
// WRONG - User sees ALL notifications
getNotifications(userId) {
  return allDatabase.notifications.find({ user_id: userId });
  // ❌ Shows notifications from ALL orgs!
}

// RIGHT - Only current org notifications
getNotifications(userId, organizationId) {
  const orgDb = getConnection(organizationId);
  return orgDb.notifications.find({
    user_id: userId,
    organization_id: organizationId
  });
  // ✓ Only shows current org notifications
}
```

**Rule 2: Notification preferences queried from master DB with org context**
```typescript
// WRONG - Gets all preferences for user
getNotificationSettings(userId) {
  return masterDb.query(`
    SELECT * FROM notification_settings WHERE user_id = ?
  `);
  // ❌ Shows settings from ALL orgs!
}

// RIGHT - Only settings for current org
getNotificationSettings(userId, organizationId) {
  return masterDb.query(`
    SELECT * FROM notification_settings 
    WHERE user_id = ? AND organization_id = ?
  `);
  // ✓ Only shows settings for this org
}
```

**Rule 3: Permission check - user must be assigned to organization**
```typescript
// WRONG - Assumes user has access
createNotification(userId, organizationId, data) {
  return getConnection(organizationId).notifications.create(data);
  // ❌ What if user not assigned to this org?
}

// RIGHT - Verify access first
async createNotification(userId, organizationId, data) {
  // Check user has access to this org
  const hasAccess = await masterDb.query(`
    SELECT 1 FROM user_organizations 
    WHERE user_id = ? AND organization_id = ?
  `);
  
  if (!hasAccess) {
    throw new Error('User does not have access to this organization');
  }
  
  // Only then create notification
  return getConnection(organizationId).notifications.create(data);
  // ✓ Protected!
}
```

---

## 📱 Real-Time Notifications (WebSocket/SSE)

### Option A: WebSocket (Real-time push)
```
Best for: Instant notifications (new messages, alerts)
Cost: Medium
Complexity: Medium

Flow:
1. Frontend opens WebSocket connection per organization
2. Backend subscribes frontend to org's events
3. When SMS arrives → Backend broadcasts to all subscribed users in that org
4. Frontend receives instantly → Shows notification

Pseudo-code:
// Frontend
socket.emit('subscribe_org', { organizationId: 1 });
socket.on('new_message', (data) => {
  showNotification(data.message);
});

// Backend
when SMS received for Org 1:
  broadcast to all users subscribed to Org 1 (not Org 2!)
  socket.to(`org_1_subscribers`).emit('new_message', data);
```

### Option B: Polling (Check periodically)
```
Best for: Non-urgent notifications
Cost: Low
Complexity: Low

Flow:
1. Frontend periodically calls GET /api/notifications
2. Backend fetches unread notifications for current org
3. Frontend shows new ones
4. Repeat every 5-10 seconds

Downside:
- 5-10 second delay
- Higher API load
- More battery drain (mobile)

Upside:
- Simpler to implement
- No WebSocket infrastructure needed
- Works with firewalls that block WebSockets
```

### Option C: Hybrid (Best)
```
Best for: Balance of real-time and scalability
Cost: Low-Medium
Complexity: Medium

Flow:
1. WebSocket for instant notifications (high priority)
   - New SMS received
   - Ticket assigned to you
   
2. Polling for regular updates (low priority)
   - Ticket status changed (every 5 mins)
   - Organization announcements (every 10 mins)

Result: Fast for important, efficient for others
```

---

## 🎯 Notification Checklist for Implementation

### Database Setup
- [ ] Create `notification_settings` table in Master DB
- [ ] Create `notifications` table in each Org DB
- [ ] Add indexes on user_id, organization_id
- [ ] Add unique constraint: (user_id, organization_id, notification_type, channel)

### Backend Service
- [ ] Create NotificationService class
- [ ] Add methods: send, create, markAsRead, getUnread
- [ ] Add organization isolation checks
- [ ] Add permission verification
- [ ] Configure email service (SMTP)
- [ ] Configure push notifications (Firebase, OneSignal, etc.)
- [ ] Configure SMS service (Twilio)

### API Endpoints
- [ ] GET `/api/notifications` - Get unread notifications (org-scoped)
- [ ] PUT `/api/notifications/:id/read` - Mark as read
- [ ] GET `/api/notifications/settings` - Get preferences (org-scoped)
- [ ] PUT `/api/notifications/settings` - Update preferences (org-scoped)
- [ ] DELETE `/api/notifications/:id` - Delete notification

### Frontend Components
- [ ] Notification bell (navbar)
- [ ] Notification dropdown/panel
- [ ] Toast notification system
- [ ] Notification preferences modal
- [ ] WebSocket/polling integration
- [ ] Real-time update mechanism

### Integration Points
- [ ] Hook SMS webhook to notification service
- [ ] Hook ticket creation to notification service
- [ ] Hook ticket update to notification service
- [ ] Hook user assignment to notification service
- [ ] Refresh notifications when org switched

### Testing
- [ ] User receives notification in correct org only
- [ ] User in Org 2 never sees Org 1 notifications
- [ ] Notification preferences respected
- [ ] Disabled channels don't send
- [ ] WebSocket/polling works in real-time
- [ ] Notifications persist in database
- [ ] Mark as read works correctly

---

## ⚡ Implementation Priority

### Phase 1: Basic (Week 1)
- Database tables
- In-app notifications (store & display)
- Notification bell in navbar
- API endpoints for fetching/marking read

### Phase 2: Enhanced (Week 2)
- Email notifications
- Notification preferences UI
- Toast notifications
- Real-time updates (polling)

### Phase 3: Advanced (Week 3)
- Push notifications
- WebSocket real-time
- Advanced preference options
- Notification history/archive

---

## 📋 Summary

| Aspect | Requirement |
|--------|------------|
| **Storage** | Preferences in Master DB, History in Org DBs |
| **Isolation** | Each org sees only their notifications |
| **Channels** | Email, In-App, SMS, Push |
| **Real-time** | WebSocket (best) or Polling (simpler) |
| **Preferences** | Configurable per user per organization |
| **Triggering** | SMS received, Ticket events, User assignments |
| **Frontend** | Bell icon, dropdown, toast, preferences modal |

**Status:** Ready to implement alongside Option 2 ✓

