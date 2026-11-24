# Ticket Attachments API - Quick Reference

## Base URL
`/api/v1` (with global prefix)

## Authentication
All endpoints require: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Ticket with Attachments
```http
GET /tickets/enriched/:id
```
**Response:**
```json
{
  "id": 8,
  "title": "...",
  "resources": [
    {
      "id": 1,
      "file_mime_type": "image/png",
      "file_url": "https://...presigned-url...",
      "thumb_url": "https://...presigned-url...",
      "file_path": "v2/tickets/8/...",
      "ticket_id": 8
    }
  ]
}
```

---

### 2. Create Ticket with Files
```http
POST /tickets/with-files
Content-Type: multipart/form-data
```
**Form Data:**
- `title` (string, required)
- `body` (string)
- `priority` (string, required)
- `application_id` (number, required)
- `hash` (string, required)
- `customer_id` (number, optional)
- `files` (File[], optional) - Multiple files

**Response:** Same as GET /tickets/enriched/:id

---

### 3. List Ticket Attachments
```http
GET /tickets/:ticketRef/resources
```
**ticketRef:** Ticket ID (number) or hash (string)

**Response:**
```json
[
  {
    "id": 1,
    "file_mime_type": "image/png",
    "file_url": "https://...presigned-url...",
    "thumb_url": "https://...presigned-url...",
    "file_path": "v2/tickets/8/...",
    "ticket_id": 8
  }
]
```

---

### 4. Upload Attachment to Existing Ticket
```http
POST /tickets/:ticketRef/resources/upload
Content-Type: multipart/form-data
```
**Form Data:**
- `file` (File, required) - Single file
- `remarks` (string, optional)

**Response:** Single resource object with file_url and thumb_url

---

### 5. Download Attachment
```http
GET /tickets/:ticketRef/resources/:id/download
```
**Response:** HTTP 302 redirect to presigned URL

**Alternative:** Use `file_url` directly from resources array

---

### 6. Delete Attachment
```http
DELETE /tickets/:ticketRef/resources/:id?key=<s3_key>
```
**Query Params:**
- `key` (optional) - S3 object key for cleanup

**Response:**
```json
{
  "deleted": true
}
```

---

## React Quick Examples

### Fetch Ticket with Attachments
```javascript
const ticket = await fetch(`/api/v1/tickets/enriched/${id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

### Upload File
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('remarks', 'Optional remarks');

await fetch(`/api/v1/tickets/${ticketId}/resources/upload`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Display Image
```jsx
<img src={resource.file_url} alt="Attachment" />
```

### Download Link
```jsx
<a href={resource.file_url} target="_blank" download>
  Download
</a>
```

### Delete Attachment
```javascript
await fetch(
  `/api/v1/tickets/${ticketId}/resources/${resourceId}?key=${encodeURIComponent(resource.file_path)}`,
  {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

## File Fields Explained

- `file_url`: Presigned URL for downloading/viewing the file (expires in 1 hour)
- `thumb_url`: Presigned URL for thumbnail (same as file_url for now)
- `file_path`: S3 object key (internal use)
- `file_mime_type`: MIME type (e.g., "image/png", "application/pdf")
- `id`: Resource ID for delete/download operations

---

## Error Handling

- `400`: Bad Request (missing required fields, invalid file type)
- `404`: Not Found (ticket/resource doesn't exist)
- `401`: Unauthorized (invalid/missing token)
- `413`: Payload Too Large (file size exceeded)
- `500`: Server Error (S3 upload failed, etc.)

---

## Supported File Types

- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.*`
- Text: `text/plain`

Check backend for complete list and size limits.



