// File upload constraints based on backend specifications
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_FILES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'
  ]
} as const;

export interface FileValidationError {
  file?: File;
  type: 'count' | 'size' | 'type';
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationError[];
  validFiles: File[];
}

export function validateFiles(files: File[]): FileValidationResult {
  const errors: FileValidationError[] = [];
  const validFiles: File[] = [];

  // Check file count
  if (files.length > FILE_UPLOAD_CONSTRAINTS.MAX_FILES) {
    errors.push({
      type: 'count',
      message: `Maximum ${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files allowed. You selected ${files.length} files.`
    });
    return { isValid: false, errors, validFiles: [] };
  }

  // Check each file
  files.forEach((file) => {
    // Check file size
    if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE) {
      errors.push({
        file,
        type: 'size',
        message: `File "${file.name}" is too large. Maximum size is 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
      });
      return;
    }

    // Check file type
    const isValidType = (FILE_UPLOAD_CONSTRAINTS.ALLOWED_TYPES as readonly string[]).includes(file.type) ||
                       FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.some(ext => 
                         file.name.toLowerCase().endsWith(ext.toLowerCase())
                       );

    if (!isValidType) {
      errors.push({
        file,
        type: 'type',
        message: `File "${file.name}" has an unsupported format. Allowed types: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX, XLS, XLSX.`
      });
      return;
    }

    // File is valid
    validFiles.push(file);
  });

  return {
    isValid: errors.length === 0,
    errors,
    validFiles
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image';
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'docs';
    case 'xls':
    case 'xlsx':
      return 'xsl';
    case 'txt':
      return 'text';
    default:
      return 'other';
  }
}