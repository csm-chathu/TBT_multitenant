# Integrations & Ticket API

External channel integrations and ticket management endpoints.

## Base URL
`/api/v1` (global prefix applies)

## Authentication
These endpoints are **public** (no JWT). Each uses its own secret token mechanism described below.

---

## 1. WhatsApp (Meta Cloud API)

### Webhook Verification
```http
GET /api/v1/whatsapp/receive
```
Meta calls this once when you register the webhook URL in the Meta App Dashboard to confirm ownership.

**Query params (sent by Meta):**

| Param | Description |
|-------|-------------|
| `hub.mode` | Always `subscribe` |
| `hub.verify_token` | Must match `WHATSAPP_VERIFY_TOKEN` in your `.env` |
| `hub.challenge` | Random string — returned as-is on success |

**Response:** Returns the raw `hub.challenge` string (HTTP 200).

---

### Receive Inbound Message → Create Ticket
```http
POST /api/v1/whatsapp/receive
Content-Type: application/json
```
Meta sends this for every incoming WhatsApp message.

**Request body (sent by Meta):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550560629",
          "phone_number_id": "1082584271613980"
        },
        "contacts": [{
          "profile": { "name": "John Doe" },
          "wa_id": "94703871464"
        }],
        "messages": [{
          "from": "94703871464",
          "id": "wamid.xxx",
          "timestamp": "1714647840",
          "type": "text",
          "text": { "body": "Hello, I need help" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Supported message types:** `text`, `image`, `document`, `audio`, `video`

**Response:**
```json
{ "received": true, "ticketId": 42 }
```

**How it works:**
1. Extracts `from` (customer WhatsApp number) and `to` (your business number)
2. Matches `to` against `service_phone_number` in the `applications` table
3. Finds or creates a `Customer` by phone number
4. If message contains `@<ticketId>` → adds comment to existing ticket
5. Otherwise → creates a new ticket assigned to the team leader
6. Sends a WhatsApp reply back to the customer

**Required env vars:**
```env
WHATSAPP_VERIFY_TOKEN=your_secret_token
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx
WHATSAPP_API_VERSION=v25.0
```

**Meta App Dashboard setup:**
1. Go to **WhatsApp → Configuration** in your Meta App
2. Callback URL: `https://your-domain.com/api/v1/whatsapp/receive`
3. Verify token: same value as `WHATSAPP_VERIFY_TOKEN`
4. Subscribe to: `messages` field

---

## 2. Twilio SMS / MMS

### Receive Inbound SMS → Create Ticket
```http
POST /api/v1/sms/receive
Content-Type: application/x-www-form-urlencoded
```
Twilio sends this for every inbound SMS/MMS.

**Request body (sent by Twilio):**

| Field | Description |
|-------|-------------|
| `From` | Sender phone number (e.g. `+94703871464`) |
| `To` | Your Twilio number (e.g. `+15551234567`) |
| `Body` | SMS text content |
| `NumMedia` | Number of media attachments |
| `MediaUrl0` | URL of first media file (if any) |
| `MessageSid` | Twilio message ID |

**Response:**
```json
{ "received": true, "ticketId": 42 }
```

**How it works:** Same flow as WhatsApp — matches `To` number to an application, finds/creates customer, creates ticket or adds comment.

**Required env vars:**
```env
SMS_GATEWAY_ACCESS_SID=ACxxxxxxx
SMS_GATEWAY_ACCESS_TOKEN=xxxxxxx
SMS_FROM_NUMBER=+15551234567
TWILIO_FROM_NUMBER=+15551234567
```

---

## 3. ESET Security Alerts

### Receive ESET Alert → Create Ticket
```http
POST /api/v1/eset/alert
Content-Type: application/json
X-ESET-Token: your_secret_token
```
ESET PROTECT / ESET Inspect calls this when a threat is detected.

**Request body (sent by ESET PROTECT):**
```json
{
  "event_type": "Threat_Event",
  "severity": "Critical",
  "threat_name": "Win32/Malware.A",
  "threat_type": "Virus",
  "hostname": "WORKSTATION01",
  "ipv4": "192.168.1.100",
  "os_name": "Microsoft Windows 10",
  "username": "DOMAIN\\john",
  "object_url": "C:\\Users\\john\\Downloads\\malware.exe",
  "action_taken": "Quarantined",
  "scanner_id": "Real-time file system protection",
  "occured": "2026-06-16T10:30:00Z",
  "group_name": "Workstations"
}
```

**Response:**
```json
{ "received": true, "ticketCreated": true, "ticketId": 43 }
```

**Severity → Priority mapping:**

| ESET Severity | Ticket Priority |
|--------------|----------------|
| Critical / Fatal | Critical |
| Error | High |
| Warning | Medium |
| Information | Low (skipped by default) |

**Required env vars:**
```env
ESET_WEBHOOK_SECRET=your_secret_token
ESET_DEFAULT_APPLICATION_ID=1
ESET_DEFAULT_AGENT_ID=5
ESET_SKIP_LOW_SEVERITY=true
```

**ESET PROTECT Console setup:**
1. Go to **Notifications → New Notification**
2. Delivery: `HTTP request`
3. URL: `https://your-domain.com/api/v1/eset/alert`
4. Header: `X-ESET-Token: your_secret_token`
5. Content-Type: `application/json`
6. Trigger: Threat detected / Severity = Critical or Error

---

## 4. Ticket Assignees

### Update Multiple Assigned Agents
```http
PUT /api/v1/tickets/:id/assignees
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "agent_ids": [1, 2, 3]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent_ids` | `number[]` | Yes | Array of agent IDs to assign. Must be non-empty. All IDs must exist. |

**Response:**
```json
{
  "id": 42,
  "title": "Printer not working",
  "priority": "High",
  "status": "Assigned",
  "agent_id": 1,
  "multiple_assignees": [1, 2, 3],
  ...
}
```

**Rules:**
- `agent_id` (primary) is set to the **first** agent in the list
- `multiple_assignees` stores the full list
- All agent IDs are validated — a 404 is returned if any ID does not exist
- Triggers a `ticket.updated` Pusher event on both the public channel and per-ticket channel

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | `agent_ids` is missing, empty, or contains invalid values |
| `404` | Ticket ID not found |
| `404` | One or more agent IDs not found |

---

## Ticket ID Reference (all channels)

When a customer replies to an existing ticket, include `@<ticketId>` in the message body:

```
@42 The issue is still happening
```

This adds a comment to ticket #42 instead of creating a new ticket. The `@` character can be changed via the `TICKET_ID_IDENTIFICATION_CHAR` env var.
