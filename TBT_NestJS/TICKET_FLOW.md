# Ticket Flow Summary

## 1. Ticket Creation

### Routes
| Route | Type | Notes |
|---|---|---|
| `POST /tickets` | Internal | Basic create |
| `POST /tickets/with-files` | Internal | Up to 10 files, 10 MB each, uploads to S3 |
| `POST /tickets/public` | Public | Customer-facing, auto-assigns agent |

### Sequence
1. Resolve action types from ticket data
2. Find or create customer from mobile number (if no `customer_id`)
3. Find or create device from device name (if no `device_id`)
4. Persist ticket to DB
5. Resolve assigned agent's user ID

### Side-effects (all fire-and-forget)
| # | What | Condition |
|---|---|---|
| Pusher `public-tickets : ticket.created` | Always | |
| Email `sendTicketCreated()` → Mailgun → `MAIL_TO` | Always | |
| Pusher `private-user-{assignedUserId} : ticket.created` | Only if agent assigned | |
| Notification DB row | Only if agent assigned | |
| SMS (Twilio) → customer mobile | Only if mobile number provided | |

### Public ticket extra steps
- Finds team by `application_id`, falls back to first available agent
- Sets status to `Assigned` (if agent found) or `Open`
- Returns `{ referenceNumber: 'TBT-{id}', hash, title, status, priority }`

---

## 2. Ticket Update

### Routes
| Route | Notes |
|---|---|
| `PUT /tickets/:id` | Status, priority, assignee, title etc. |
| `PUT /tickets/:id/assignees` | Bulk assignee update |

### Sequence (`PUT /tickets/:id`)
1. Load current ticket state (`before`) for diffing
2. Process action types
3. Persist update to DB
4. Resolve assigned user ID

### Side-effects
| # | What | Condition |
|---|---|---|
| Pusher `public-tickets : ticket.updated` | Always | Includes `actorId` for own-action suppression on frontend |
| Pusher `private-ticket-{id} : ticket.updated` | Always | |
| Email `sendTicketClosed()` → Mailgun → `MAIL_TO` | Only if `status = closed` | |
| SMS | **Never** | Not implemented |
| Notification DB | **Never** | Not implemented |

### Assignees update (`PUT /tickets/:id/assignees`)
- First agent ID becomes primary `agent_id`; all IDs stored as `multiple_assignees`
- Fires Pusher `public-tickets` and `private-ticket-{id}` only
- No email, no SMS, no notification DB

---

## 3. Comment Flow

### Route
`POST /tickets/:ticketId/comments` — JWT guarded

### Comment Types
| `type` value | Visibility |
|---|---|
| `internal` | Agent-to-agent only (routed to specific recipient via `to` field) |
| anything else | Public — visible to all, including customer |

### Sequence
1. Upload files to S3 at `tickets/{ticketId}/comments/` (if any)
2. Persist comment to DB
3. Resolve target user for notification

### Side-effects — Public comment
| What | Notes |
|---|---|
| Notification DB | Always |
| Pusher `private-ticket-{id} : ticket.comment.public` | |
| Pusher `public-tickets : ticket.comment.public` | |
| Pusher `private-ticket-{id} : ticket.updated` | Forces viewers to refresh |
| SMS | **Never** (SMS replies go via `/messages` endpoints only) |

### Side-effects — Internal comment
| What | Notes |
|---|---|
| Notification DB | Always |
| Pusher `private-user-{targetUserId} : ticket.comment.internal` | Only if `to` (recipient agent) is set |
| Pusher `private-ticket-{id} : ticket.comment.internal` | |
| Pusher `private-ticket-{id} : ticket.updated` | Forces viewers to refresh |

---

## 4. Full Trigger Map

| Trigger | Pusher | Email | SMS | Notification DB |
|---|---|---|---|---|
| Ticket created | `public-tickets`, `private-user-{assignedId}` | Yes (to MAIL_TO) | Yes (if mobile) | Yes (if assigned) |
| Ticket updated | `public-tickets`, `private-ticket-{id}` | Only if closed | No | No |
| Assignees updated | `public-tickets`, `private-ticket-{id}` | No | No | No |
| Ticket deleted | `public-tickets` | No | No | No |
| Public comment | `public-tickets`, `private-ticket-{id}` | No | No | Yes |
| Internal comment | `private-user-{target}`, `private-ticket-{id}` | No | No | Yes |

---

## 5. Pusher Channels

| Channel | Purpose |
|---|---|
| `public-tickets` | Broadcast — all connected clients |
| `private-ticket-{id}` | Per-ticket viewers |
| `private-user-{userId}` | Per-agent personal notifications |
| `private-tickets` | Org-wide (defined but rarely used) |
| `presence-agents` | Agent presence tracking |

Auth endpoint: `POST /realtime/auth` (JWT guarded)  
Config endpoint: `GET /realtime/config` (public)

---

## 6. External Services

### Email — Mailgun (`mailgun-js`)
| Env var | Purpose |
|---|---|
| `MAILGUN_API_KEY` | API key |
| `MAIL_SMTP_DOMAIN` | Sending domain |
| `MAIL_TO` | Fixed recipient (not customer — internal team) |
| `FROM_EMAIL` / `FROM_NAME` | Sender identity |

Sends to a **fixed internal address** (`MAIL_TO`), not to the customer.

### SMS — Twilio
| Env var | Purpose |
|---|---|
| `SMS_GATEWAY_ACCESS_SID` | Account SID |
| `SMS_GATEWAY_ACCESS_TOKEN` | Auth token |
| `SMS_FROM_NUMBER` | Sender number |
| `TICKET_ID_IDENTIFICATION_CHAR` | Prefix for reply matching (default `@`) |

Sends to the **customer's mobile number**. Only fires on ticket creation.

---

## 7. Gaps / Not Yet Implemented

| Scenario | Status |
|---|---|
| SMS on status change (e.g. in-progress → pending/closed) | Not implemented |
| SMS on new public comment | Not implemented |
| Email to customer (not just MAIL_TO) | Not implemented |
| Notification DB on ticket update | Not implemented |
