# Ticket API with File Upload

## Endpoint
`POST /tickets/with-files`

## Description
Creates a new ticket with optional file attachments that are uploaded to S3 bucket.

## Request Format
- **Content-Type**: `multipart/form-data`
- **Authentication**: JWT Bearer token required

## Parameters

### Body Parameters (form-data)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Ticket title |
| priority | string | Yes | Ticket priority (e.g., "high", "medium", "low") |
| hash | string | Yes | Unique ticket hash |
| application_id | number | Yes | Application ID |
| body | string | No | Ticket description |
| status | string | No | Ticket status |
| customer_id | number | No | Customer ID |
| agent_id | number | No | Agent ID |
| device_id | number | No | Device ID |
| ticket_template_id | number | No | Template ID |
| serialNo | string | No | Serial number |
| files | file[] | No | Array of files to upload (max 10 files, 10MB each) |

### File Upload Constraints
- **Maximum files**: 10 per request
- **Maximum file size**: 10MB per file
- **Allowed file types**:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, TXT, DOC, DOCX, XLS, XLSX

## Example Usage

### Using Postman
1. Set method to `POST`
2. URL: `http://localhost:3000/api/v1/tickets/with-files`
3. Authorization: Bearer token
4. Body: form-data
   - Add text fields for ticket data
   - Add file field named `files` for attachments

### Using cURL
```bash
curl -X POST "http://localhost:3000/api/v1/tickets/with-files" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Sample Ticket" \
  -F "priority=high" \
  -F "hash=unique-hash-123" \
  -F "application_id=1" \
  -F "body=This is a test ticket with file attachments" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.pdf"
```

### Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('title', 'Sample Ticket');
formData.append('priority', 'high');
formData.append('hash', 'unique-hash-123');
formData.append('application_id', '1');
formData.append('body', 'This is a test ticket');

// Add files
const fileInput = document.getElementById('fileInput');
for (let file of fileInput.files) {
  formData.append('files', file);
}

fetch('/api/v1/tickets/with-files', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Response Format
```json
{
  "id": 123,
  "title": "Sample Ticket",
  "priority": "high",
  "hash": "unique-hash-123",
  "application_id": 1,
  "body": "This is a test ticket with file attachments",
  "attachments": [
    "https://tbt-east.s3.us-east-1.amazonaws.com/tickets/2025-10-13T10-30-00-000Z-uuid-file1.jpg",
    "https://tbt-east.s3.us-east-1.amazonaws.com/tickets/2025-10-13T10-30-00-000Z-uuid-file2.pdf"
  ],
  "createdAt": "2025-10-13T10:30:00.000Z",
  "updatedAt": "2025-10-13T10:30:00.000Z"
}
```

## Error Responses

### File Type Not Allowed
```json
{
  "statusCode": 400,
  "message": "File type application/exe not allowed",
  "error": "Bad Request"
}
```

### File Too Large
```json
{
  "statusCode": 413,
  "message": "File too large",
  "error": "Payload Too Large"
}
```

### S3 Upload Failed
```json
{
  "statusCode": 500,
  "message": "Failed to upload to S3",
  "error": "Internal Server Error"
}
```

## Notes
- Files are automatically uploaded to S3 bucket in the `tickets/` folder
- File names are automatically generated with timestamp and UUID to avoid conflicts
- File URLs are stored in the ticket's `attachments` array
- All uploaded files are set to public-read access