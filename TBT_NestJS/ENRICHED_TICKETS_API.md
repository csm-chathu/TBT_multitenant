# Enriched Tickets API Documentation

## Overview

This document describes the new enriched tickets API endpoints that provide comprehensive ticket data formatted specifically for frontend consumption. The enriched endpoints include all related data (agent, customer, application, template, device, location) in a single response.

## New Endpoints

### 1. Get All Enriched Tickets

**Endpoint:** `GET /api/v1/tickets/enriched`

**Description:** Retrieves all tickets with enriched data including agent, customer, application, template, device, and location information.

**Response Format:**
```json
[
  {
    "id": 80,
    "title": "suspicious link in email",
    "body": "<p><br></p>",
    "priority": "high",
    "status": "assigned",
    "additinal_data": "{\"reporter\":\"1\",\"incident\":[\"1\"],\"indicators\":[\"phishing detector\"]}",
    "hash": "tkt_sOcSWisBQmKognHlSXUgw",
    "serialNo": "YL015KFT",
    "createdAt": "2025-01-21T10:31:41.206Z",
    "ticket_template_id": 1,
    "agentFirst": "chathuranga",
    "agentLast": "sri mahindapala",
    "aplName": "Test TBT",
    "cusName": "Natalie",
    "cusLast": "Yardley",
    "mobile_number": "+94767684280",
    "temName": "Cyber",
    "locationName": "carol_ris",
    "reporterFname": "Natalie",
    "reporterLname": "Yardley"
  }
]
```

### 2. Get Single Enriched Ticket

**Endpoint:** `GET /api/v1/tickets/enriched/:id`

**Description:** Retrieves a single ticket with enriched data by ID.

**Parameters:**
- `id` (number): The ticket ID

**Response Format:** Same as above, but returns a single ticket object instead of an array.

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique ticket identifier |
| `title` | string | Ticket title |
| `body` | string | Ticket body/description |
| `priority` | string | Ticket priority (high, medium, low) |
| `status` | string | Ticket status (assigned, open, closed, etc.) |
| `additinal_data` | string | Additional ticket data in JSON format |
| `hash` | string | Unique ticket hash |
| `serialNo` | string | Device serial number |
| `createdAt` | string | Ticket creation timestamp |
| `ticket_template_id` | number | Template ID used for this ticket |
| `agentFirst` | string | Assigned agent's first name |
| `agentLast` | string | Assigned agent's last name |
| `aplName` | string | Application name |
| `cusName` | string | Customer's first name |
| `cusLast` | string | Customer's last name |
| `mobile_number` | string | Customer's mobile number |
| `temName` | string | Ticket template name |
| `locationName` | string | Device location name |
| `reporterFname` | string | Reporter's first name |
| `reporterLname` | string | Reporter's last name |

## Usage Examples

### Frontend Integration

```javascript
// Fetch all enriched tickets
const response = await fetch('/api/v1/tickets/enriched', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});
const tickets = await response.json();

// Fetch single enriched ticket
const ticketResponse = await fetch('/api/v1/tickets/enriched/80', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});
const ticket = await ticketResponse.json();
```

### cURL Examples

```bash
# Get all enriched tickets
curl -X GET "http://localhost:3000/api/v1/tickets/enriched" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"

# Get single enriched ticket
curl -X GET "http://localhost:3000/api/v1/tickets/enriched/80" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

## Testing

You can test the enriched tickets functionality using the provided test script:

```bash
npm run build
node dist/src/scripts/test-enriched-tickets.js
```

## Authentication

All endpoints require JWT authentication. Make sure to include the `Authorization` header with a valid JWT token.

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Success
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: Ticket not found (for single ticket endpoint)
- `500 Internal Server Error`: Server error

## Database Relationships

The enriched endpoints automatically include data from the following related tables:

- `agents` - Agent information
- `applications` - Application details
- `ticket_template` - Template information
- `inventory_item` - Device information
- `inventory_item_location` - Location details
- `customers` - Customer information

## Performance Considerations

- The enriched endpoints perform multiple JOIN operations
- Consider implementing pagination for large datasets
- Use the regular ticket endpoints if you don't need all the enriched data
- Consider caching for frequently accessed ticket data

## Migration from Regular Endpoints

If you're currently using the regular ticket endpoints (`/tickets`, `/api/v1/tickets/:id`), you can easily migrate to the enriched endpoints by:

1. Updating your API calls to use the new endpoints
2. Updating your frontend code to use the new response format
3. Removing any additional API calls you were making to fetch related data

The enriched endpoints provide all the data you need in a single request, reducing the number of API calls and improving performance.


