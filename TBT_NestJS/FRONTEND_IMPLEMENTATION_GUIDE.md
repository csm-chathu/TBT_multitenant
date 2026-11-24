# Ticket Attachments - Frontend Implementation Guide

This guide covers all API endpoints and implementation details for handling ticket attachments in the React frontend.

## Table of Contents
1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Uploading Files](#uploading-files)
4. [Displaying Attachments](#displaying-attachments)
5. [Downloading Files](#downloading-files)
6. [Deleting Files](#deleting-files)
7. [Complete React Examples](#complete-react-examples)

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${yourJwtToken}`
}
```

---

## API Endpoints

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://your-api-domain.com/api/v1`

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tickets/enriched/:id` | Get ticket with attachments (file_url, thumb_url) |
| `POST` | `/tickets/with-files` | Create ticket with file attachments |
| `GET` | `/tickets/:ticketRef/resources` | List all attachments for a ticket |
| `POST` | `/tickets/:ticketRef/resources/upload` | Upload new attachment to existing ticket |
| `GET` | `/tickets/:ticketRef/resources/:id/download` | Download a specific attachment |
| `DELETE` | `/tickets/:ticketRef/resources/:id` | Delete an attachment |

**Note:** `ticketRef` can be either:
- Numeric ticket ID (e.g., `8`)
- Ticket hash string (e.g., `tkt_abc123`)

---

## Uploading Files

### 1. Create Ticket with Files

**Endpoint:** `POST /api/v1/tickets/with-files`

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `title` (string, required)
  - `body` (string, optional)
  - `priority` (string, required)
  - `application_id` (number, required)
  - `customer_id` (number, optional)
  - `hash` (string, required)
  - `files` (File[], optional) - Multiple files allowed

**Response:**
```json
{
  "id": 123,
  "title": "Sample Ticket",
  "priority": "high",
  "status": "inactive",
  "hash": "tkt_abc123",
  "resources": [
    {
      "id": 1,
      "file_mime_type": "image/png",
      "file_path": "v2/tickets/8/2025-11-03T19-43-50-613Z-b01c9076-08b0-4fe5-8562-08a256d756f9-me.png",
      "thumb_path": "v2/tickets/8/2025-11-03T19-43-50-613Z-b01c9076-08b0-4fe5-8562-08a256d756f9-me.png",
      "file_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
      "thumb_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
      "hash": "tkr_xyz789",
      "ticket_id": 123
    }
  ],
  "createdAt": "2025-11-03T19:43:50.613Z",
  "updatedAt": "2025-11-03T19:43:50.613Z"
}
```

**React Example:**
```javascript
const createTicketWithFiles = async (ticketData, files) => {
  const formData = new FormData();
  
  // Add ticket fields
  formData.append('title', ticketData.title);
  formData.append('body', ticketData.body || '');
  formData.append('priority', ticketData.priority);
  formData.append('application_id', ticketData.application_id);
  formData.append('hash', ticketData.hash);
  
  if (ticketData.customer_id) {
    formData.append('customer_id', ticketData.customer_id);
  }
  
  // Add files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch('/api/v1/tickets/with-files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to create ticket');
  }
  
  return await response.json();
};
```

### 2. Upload Files to Existing Ticket

**Endpoint:** `POST /api/v1/tickets/:ticketRef/resources/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (File, required) - Single file
  - `remarks` (string, optional)

**Response:**
```json
{
  "id": 2,
  "file_mime_type": "application/pdf",
  "file_path": "v2/tickets/8/2025-11-03T20-00-00-000Z-uuid-document.pdf",
  "thumb_path": "v2/tickets/8/2025-11-03T20-00-00-000Z-uuid-document.pdf",
  "file_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
  "thumb_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
  "remarks": "Additional documentation",
  "hash": "tkr_abc456",
  "ticket_id": 8
}
```

**React Example:**
```javascript
const uploadAttachment = async (ticketId, file, remarks = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (remarks) {
    formData.append('remarks', remarks);
  }
  
  const response = await fetch(`/api/v1/tickets/${ticketId}/resources/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  return await response.json();
};
```

---

## Displaying Attachments

### Get Ticket with Attachments

**Endpoint:** `GET /api/v1/tickets/enriched/:id`

**Response:**
```json
{
  "id": 8,
  "title": "Ticket Title",
  "body": "Ticket description",
  "priority": "high",
  "status": "active",
  "hash": "tkt_abc123",
  "resources": [
    {
      "id": 1,
      "file_mime_type": "image/png",
      "file_path": "v2/tickets/8/2025-11-03T19-43-50-613Z-b01c9076-08b0-4fe5-8562-08a256d756f9-me.png",
      "thumb_path": "v2/tickets/8/2025-11-03T19-43-50-613Z-b01c9076-08b0-4fe5-8562-08a256d756f9-me.png",
      "file_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
      "thumb_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
      "hash": "tkr_xyz789",
      "ticket_id": 8
    }
  ],
  "createdAt": "2025-11-03T19:43:50.613Z"
}
```

**React Example:**
```javascript
const fetchTicketWithAttachments = async (ticketId) => {
  const response = await fetch(`/api/v1/tickets/enriched/${ticketId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch ticket');
  }
  
  return await response.json();
};
```

### List All Attachments for Ticket

**Endpoint:** `GET /api/v1/tickets/:ticketRef/resources`

**Response:**
```json
[
  {
    "id": 1,
    "file_mime_type": "image/png",
    "file_path": "v2/tickets/8/...",
    "thumb_path": "v2/tickets/8/...",
    "file_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
    "thumb_url": "https://tbt-east.s3.us-east-1.amazonaws.com/v2/tickets/8/...?X-Amz-...",
    "hash": "tkr_xyz789",
    "ticket_id": 8
  }
]
```

**React Example:**
```javascript
const fetchTicketAttachments = async (ticketRef) => {
  const response = await fetch(`/api/v1/tickets/${ticketRef}/resources`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }
  
  return await response.json();
};
```

---

## Downloading Files

### Option 1: Use file_url (Recommended)

The `file_url` field already contains a presigned URL that can be used directly:

```javascript
const AttachmentDisplay = ({ resource }) => {
  return (
    <a 
      href={resource.file_url} 
      target="_blank" 
      rel="noopener noreferrer"
      download
    >
      <i className="ri-download-line"></i> Download
    </a>
  );
};
```

### Option 2: Use Download Endpoint

**Endpoint:** `GET /api/v1/tickets/:ticketRef/resources/:id/download`

This endpoint redirects to a presigned URL. Use it if you need to generate a fresh URL on demand.

**React Example:**
```javascript
const downloadAttachment = (ticketRef, resourceId) => {
  window.open(
    `/api/v1/tickets/${ticketRef}/resources/${resourceId}/download`,
    '_blank'
  );
};

// Usage in component
<button onClick={() => downloadAttachment(ticketId, resource.id)}>
  Download
</button>
```

---

## Deleting Files

**Endpoint:** `DELETE /api/v1/tickets/:ticketRef/resources/:id`

**Query Parameters:**
- `key` (optional) - S3 object key for cleanup

**Response:**
```json
{
  "deleted": true
}
```

**React Example:**
```javascript
const deleteAttachment = async (ticketRef, resourceId, s3Key = null) => {
  const url = new URL(`/api/v1/tickets/${ticketRef}/resources/${resourceId}`, window.location.origin);
  if (s3Key) {
    url.searchParams.append('key', s3Key);
  }
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete attachment');
  }
  
  return await response.json();
};
```

---

## Complete React Examples

### Attachment Display Component

```jsx
import React, { useState, useEffect } from 'react';

const TicketAttachments = ({ ticketId }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttachments();
  }, [ticketId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/tickets/${ticketId}/resources`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch attachments');
      
      const data = await response.json();
      setAttachments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const getFileTypeIcon = (mimeType) => {
    const typeMap = {
      'application/pdf': '/images/filetype/application-pdf.png',
      'application/msword': '/images/filetype/application-msword.png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '/images/filetype/application-vnd.openxmlformats-officedocument.wordprocessingml.document.png',
      // Add more mappings as needed
    };
    return typeMap[mimeType] || '/images/filetype/default.png';
  };

  const handleDelete = async (resourceId, filePath) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      const url = `/api/v1/tickets/${ticketId}/resources/${resourceId}?key=${encodeURIComponent(filePath)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Refresh attachments list
      await fetchAttachments();
    } catch (err) {
      alert('Failed to delete attachment: ' + err.message);
    }
  };

  if (loading) return <div>Loading attachments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="row">
      {attachments.map((resource) => (
        <div key={resource.id} className="col-md-3 col-lg-3 col-sm-6 mr-1 mt-2">
          <div className="card">
            <div className="card-body p-0">
              {isImage(resource.file_mime_type) ? (
                <img 
                  src={resource.file_url} 
                  alt={resource.file_path}
                  style={{ width: '100%', height: '184px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = getFileTypeIcon(resource.file_mime_type);
                  }}
                />
              ) : (
                <img 
                  src={getFileTypeIcon(resource.file_mime_type)}
                  alt="File type"
                  style={{ width: '100%', height: '184px', objectFit: 'contain' }}
                />
              )}
              
              <div className="p-2 d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  {resource.file_mime_type?.split('/')[1] || 'file'}
                </span>
                <div>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none mx-2"
                    title="Download"
                  >
                    <i className="ri-download-line cursor-pointer"></i>
                  </a>
                  <button
                    onClick={() => handleDelete(resource.id, resource.file_path)}
                    className="btn btn-sm btn-link text-danger p-0"
                    title="Delete"
                  >
                    <i className="ri-delete-bin-6-line cursor-pointer"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketAttachments;
```

### File Upload Component

```jsx
import React, { useState } from 'react';

const FileUploader = ({ ticketId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload files one by one (or modify backend to accept multiple)
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        
        return fetch(`/api/v1/tickets/${ticketId}/resources/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: formData
        });
      });

      const responses = await Promise.all(uploadPromises);
      
      for (const response of responses) {
        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }

      setFiles([]);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError('Failed to upload files: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">Upload Files</label>
        <input
          type="file"
          className="form-control"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        {files.length > 0 && (
          <div className="mt-2">
            <small>Selected files: {files.map(f => f.name).join(', ')}</small>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="btn btn-primary"
      >
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
    </div>
  );
};

export default FileUploader;
```

### Complete Ticket View/Edit Page Example

```jsx
import React, { useState, useEffect } from 'react';
import TicketAttachments from './TicketAttachments';
import FileUploader from './FileUploader';

const TicketDetails = ({ ticketId }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/v1/tickets/enriched/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch ticket');

      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh ticket data after upload
    fetchTicket();
  };

  if (loading) return <div>Loading...</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div>
      <h1>{ticket.title}</h1>
      <p>{ticket.body}</p>
      
      <div className="mt-4">
        <h3>Attachments</h3>
        <TicketAttachments ticketId={ticketId} />
        
        <div className="mt-3">
          <FileUploader 
            ticketId={ticketId} 
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
```

---

## Important Notes

1. **Presigned URLs**: All `file_url` and `thumb_url` are presigned URLs that expire after 1 hour. If a URL expires, refetch the ticket or resource to get a new one.

2. **File Types**: Supported file types include:
   - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - Documents: `application/pdf`, `application/msword`, etc.
   - Spreadsheets: `application/vnd.ms-excel`, etc.

3. **File Size Limits**: Check backend configuration (default is usually 10MB per file).

4. **Error Handling**: Always handle network errors and check response status codes.

5. **Authentication**: Ensure the JWT token is included in all requests and refreshed when expired.

6. **CORS**: The backend is configured to accept requests from `http://localhost:5173`. For production, update CORS settings.

---

## Helper Functions

```javascript
// Get auth token from localStorage or context
const getAuthToken = () => {
  return localStorage.getItem('authToken') || '';
};

// Extract file extension from mime type
const getFileExtension = (mimeType) => {
  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    // Add more as needed
  };
  return extensionMap[mimeType] || 'file';
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

---

## Testing Checklist

- [ ] Upload single file when creating ticket
- [ ] Upload multiple files when creating ticket
- [ ] Upload file to existing ticket
- [ ] Display image attachments with thumbnails
- [ ] Display non-image attachments with icons
- [ ] Download attachment (using file_url)
- [ ] Download attachment (using download endpoint)
- [ ] Delete attachment
- [ ] Handle expired presigned URLs
- [ ] Handle upload errors (file too large, wrong type)
- [ ] Handle network errors gracefully
- [ ] Refresh attachments list after upload/delete



