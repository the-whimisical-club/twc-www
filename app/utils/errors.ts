/**
 * Centralized Error Code Registry
 * 
 * Error codes follow the pattern: DOMAIN-SUBSYSTEM-NNN
 * - DOMAIN: High-level area (AUTH, UPLOAD, IMAGE, DB, STORAGE, CLIENT, NETWORK)
 * - SUBSYSTEM: Specific component (TOKEN, FILE, PROCESS, VALIDATION, etc.)
 * - NNN: Sequential number (001, 002, etc.)
 * 
 * Error codes are stable and never reused for different meanings.
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorDefinition {
  code: string
  name: string
  message: string
  httpStatus: number
  severity: ErrorSeverity
  category: string
  description: string
  typicalCauses: string[]
  troubleshooting: string[]
}

export interface AppError {
  code: string
  message: string
  details?: string
  cause?: unknown
  httpStatus?: number
}

/**
 * Central Error Registry
 * Single source of truth for all error codes
 */
export const ERROR_REGISTRY: Record<string, ErrorDefinition> = {
  // Authentication Errors
  'AUTH-SESSION-001': {
    code: 'AUTH-SESSION-001',
    name: 'Unauthorized',
    message: 'Authentication required. Please log in.',
    httpStatus: 401,
    severity: 'medium',
    category: 'authentication',
    description: 'User is not authenticated or session has expired.',
    typicalCauses: ['Session expired', 'Missing authentication token', 'Invalid credentials'],
    troubleshooting: ['Log out and log back in', 'Clear browser cookies', 'Check if session is valid'],
  },
  'AUTH-TOKEN-001': {
    code: 'AUTH-TOKEN-001',
    name: 'Invalid Token',
    message: 'Invalid or expired authentication token.',
    httpStatus: 401,
    severity: 'medium',
    category: 'authentication',
    description: 'The provided authentication token is invalid or has expired.',
    typicalCauses: ['Expired token', 'Malformed token', 'Token not found'],
    troubleshooting: ['Log out and log back in', 'Request a new token'],
  },
  'AUTH-USER-001': {
    code: 'AUTH-USER-001',
    name: 'User Not Approved',
    message: 'Your account is pending approval.',
    httpStatus: 403,
    severity: 'low',
    category: 'authorization',
    description: 'User account exists but has not been approved by an administrator.',
    typicalCauses: ['Account pending admin approval', 'Account suspended'],
    troubleshooting: ['Wait for admin approval', 'Check /waitlist page', 'Contact support'],
  },

  // Upload Errors
  'UPLOAD-FILE-001': {
    code: 'UPLOAD-FILE-001',
    name: 'File Required',
    message: 'No file provided. Please select an image to upload.',
    httpStatus: 400,
    severity: 'low',
    category: 'validation',
    description: 'The upload request did not include a file.',
    typicalCauses: ['No file selected', 'File input empty', 'FormData missing file field'],
    troubleshooting: ['Select a file before uploading', 'Check file input is working'],
  },
  'UPLOAD-FILE-002': {
    code: 'UPLOAD-FILE-002',
    name: 'File Too Large',
    message: 'File exceeds 100MB limit. Please use a smaller image.',
    httpStatus: 413,
    severity: 'low',
    category: 'validation',
    description: 'The uploaded file exceeds the maximum allowed size of 100MB.',
    typicalCauses: ['File larger than 100MB', 'Uncompressed image'],
    troubleshooting: ['Compress the image', 'Use a smaller resolution', 'Convert to JPEG format'],
  },
  'UPLOAD-FILE-003': {
    code: 'UPLOAD-FILE-003',
    name: 'Invalid File Type',
    message: 'File type not supported. Please use JPEG, PNG, GIF, or WebP.',
    httpStatus: 400,
    severity: 'low',
    category: 'validation',
    description: 'The uploaded file is not a supported image format.',
    typicalCauses: ['Wrong file extension', 'Corrupted file', 'Non-image file'],
    troubleshooting: ['Convert to JPEG or PNG', 'Check file extension', 'Verify file is a valid image'],
  },
  'UPLOAD-REQUEST-001': {
    code: 'UPLOAD-REQUEST-001',
    name: 'Request Processing Failed',
    message: 'Failed to process upload request. Please try again.',
    httpStatus: 400,
    severity: 'medium',
    category: 'request',
    description: 'The server failed to parse or process the upload request.',
    typicalCauses: ['Malformed FormData', 'Body size limit exceeded', 'Request timeout'],
    troubleshooting: ['Try a smaller file', 'Refresh the page', 'Check network connection'],
  },
  'UPLOAD-PROCESS-001': {
    code: 'UPLOAD-PROCESS-001',
    name: 'Image Processing Failed',
    message: 'Failed to process image. The file may be corrupted or unsupported.',
    httpStatus: 400,
    severity: 'medium',
    category: 'processing',
    description: 'The server failed to process the uploaded image.',
    typicalCauses: ['Corrupted image file', 'Unsupported format', 'Invalid image data'],
    troubleshooting: ['Try a different image', 'Verify image is not corrupted', 'Use a standard format (JPEG/PNG)'],
  },
  'UPLOAD-STORAGE-001': {
    code: 'UPLOAD-STORAGE-001',
    name: 'Storage Upload Failed',
    message: 'Failed to upload to storage. Please try again.',
    httpStatus: 500,
    severity: 'high',
    category: 'storage',
    description: 'The image was processed but failed to upload to storage.',
    typicalCauses: ['Storage service unavailable', 'Network error to storage', 'Storage quota exceeded'],
    troubleshooting: ['Try again in a few moments', 'Check file size', 'Contact support if persists'],
  },
  'UPLOAD-DB-001': {
    code: 'UPLOAD-DB-001',
    name: 'Database Insert Failed',
    message: 'Image uploaded but failed to save record. Please try uploading again.',
    httpStatus: 500,
    severity: 'high',
    category: 'database',
    description: 'The image was uploaded to storage but failed to save the database record.',
    typicalCauses: ['Database connection error', 'Constraint violation', 'Database timeout'],
    troubleshooting: ['Try uploading again', 'Check if image appears in storage', 'Contact support'],
  },
  'UPLOAD-DB-002': {
    code: 'UPLOAD-DB-002',
    name: 'User Record Creation Failed',
    message: 'Failed to create user record. Please try again or contact support.',
    httpStatus: 500,
    severity: 'high',
    category: 'database',
    description: 'Failed to create or retrieve user record in the database.',
    typicalCauses: ['Database connection error', 'User creation constraint violation'],
    troubleshooting: ['Try again', 'Contact support with error code'],
  },
  'UPLOAD-SERVER-001': {
    code: 'UPLOAD-SERVER-001',
    name: 'Unexpected Server Error',
    message: 'An unexpected error occurred. Please try again.',
    httpStatus: 500,
    severity: 'critical',
    category: 'server',
    description: 'An unexpected server error occurred during upload.',
    typicalCauses: ['Server configuration error', 'Unhandled exception', 'Resource exhaustion'],
    troubleshooting: ['Try again', 'Contact support with error code', 'Check server status'],
  },

  // Image Processing Errors
  'IMAGE-RESOLUTION-001': {
    code: 'IMAGE-RESOLUTION-001',
    name: 'Resolution Too Low',
    message: 'Image resolution must be at least 1080p (1920x1080).',
    httpStatus: 400,
    severity: 'low',
    category: 'validation',
    description: 'The uploaded image resolution is below the minimum required 1080p.',
    typicalCauses: ['Image smaller than 1920x1080', 'Low resolution source'],
    troubleshooting: ['Use an image with at least 1920x1080 resolution', 'Check image dimensions'],
  },
  'IMAGE-PROCESS-001': {
    code: 'IMAGE-PROCESS-001',
    name: 'Image Conversion Failed',
    message: 'Failed to convert image. Try a different image format.',
    httpStatus: 400,
    severity: 'medium',
    category: 'processing',
    description: 'The server failed to convert the image to the required format.',
    typicalCauses: ['Unsupported format', 'Corrupted image', 'Invalid image data'],
    troubleshooting: ['Use JPEG or PNG format', 'Verify image is not corrupted', 'Try a different image'],
  },
  'IMAGE-LOAD-001': {
    code: 'IMAGE-LOAD-001',
    name: 'Image Load Failed',
    message: 'Failed to load image. The file may be corrupted.',
    httpStatus: 400,
    severity: 'medium',
    category: 'processing',
    description: 'The browser or server failed to load the image file.',
    typicalCauses: ['Corrupted file', 'Invalid image data', 'Unsupported format'],
    troubleshooting: ['Try a different image file', 'Verify file is not corrupted', 'Use a standard format'],
  },

  // Client-Side Errors
  'CLIENT-NETWORK-001': {
    code: 'CLIENT-NETWORK-001',
    name: 'Network Error',
    message: 'Network error occurred. Check your connection and try again.',
    httpStatus: 0,
    severity: 'medium',
    category: 'network',
    description: 'A network error occurred during the upload request.',
    typicalCauses: ['No internet connection', 'Network timeout', 'Connection interrupted'],
    troubleshooting: ['Check internet connection', 'Try again', 'Check network settings'],
  },
  'CLIENT-REQUEST-001': {
    code: 'CLIENT-REQUEST-001',
    name: 'Upload Request Failed',
    message: 'Upload request failed. Check your connection and try again.',
    httpStatus: 0,
    severity: 'medium',
    category: 'request',
    description: 'The upload request failed with a non-200 status code.',
    typicalCauses: ['Server error', 'Authentication failure', 'Request timeout'],
    troubleshooting: ['Check internet connection', 'Try again', 'Check error details in console'],
  },
  'CLIENT-PARSE-001': {
    code: 'CLIENT-PARSE-001',
    name: 'Response Parse Failed',
    message: 'Failed to parse server response. Check connection and try again.',
    httpStatus: 0,
    severity: 'medium',
    category: 'request',
    description: 'The server response could not be parsed as JSON.',
    typicalCauses: ['Invalid JSON response', 'Network interruption', 'Server error'],
    troubleshooting: ['Check connection', 'Try again', 'Check browser console for details'],
  },
  'CLIENT-TIMEOUT-001': {
    code: 'CLIENT-TIMEOUT-001',
    name: 'Upload Timeout',
    message: 'Upload timed out. File may be too large or connection too slow.',
    httpStatus: 0,
    severity: 'medium',
    category: 'timeout',
    description: 'The upload request exceeded the 60-second timeout limit.',
    typicalCauses: ['File too large', 'Slow connection', 'Network issues'],
    troubleshooting: ['Use a smaller file', 'Check connection speed', 'Try again on better network'],
  },
  'CLIENT-FILE-001': {
    code: 'CLIENT-FILE-001',
    name: 'File Read Failed',
    message: 'Failed to read file. Try selecting the file again.',
    httpStatus: 0,
    severity: 'low',
    category: 'file',
    description: 'The browser failed to read the selected file.',
    typicalCauses: ['File access denied', 'File locked', 'File system error'],
    troubleshooting: ['Select the file again', 'Check file permissions', 'Try a different file'],
  },

  // Storage/Worker Errors
  'STORAGE-UPLOAD-001': {
    code: 'STORAGE-UPLOAD-001',
    name: 'Storage Upload Failed',
    message: 'Failed to upload to storage. Please try again.',
    httpStatus: 500,
    severity: 'high',
    category: 'storage',
    description: 'The Cloudflare Worker failed to upload the image to R2 storage.',
    typicalCauses: ['Storage service unavailable', 'Storage quota exceeded', 'Network error'],
    troubleshooting: ['Try again', 'Check file size', 'Contact support'],
  },
  'STORAGE-CONTENT-001': {
    code: 'STORAGE-CONTENT-001',
    name: 'Invalid Content Type',
    message: 'File type not supported. Use JPEG, PNG, GIF, or WebP.',
    httpStatus: 400,
    severity: 'low',
    category: 'validation',
    description: 'The storage service rejected the file due to invalid content type.',
    typicalCauses: ['Wrong content type header', 'Unsupported format'],
    troubleshooting: ['Use JPEG or PNG format', 'Check file extension'],
  },
  'STORAGE-SIZE-001': {
    code: 'STORAGE-SIZE-001',
    name: 'File Too Large for Storage',
    message: 'File exceeds storage limit. Use a smaller image.',
    httpStatus: 413,
    severity: 'low',
    category: 'validation',
    description: 'The file exceeds the storage service size limit.',
    typicalCauses: ['File larger than 100MB'],
    troubleshooting: ['Compress the image', 'Use a smaller resolution'],
  },
}

/**
 * Get error definition by code
 */
export function getErrorDefinition(code: string): ErrorDefinition | undefined {
  return ERROR_REGISTRY[code]
}

/**
 * Create a structured error object
 */
export function createError(
  code: string,
  options?: {
    message?: string
    details?: string
    cause?: unknown
    httpStatus?: number
  }
): AppError {
  const definition = getErrorDefinition(code)
  
  return {
    code,
    message: options?.message || definition?.message || 'An error occurred',
    details: options?.details,
    cause: options?.cause,
    httpStatus: options?.httpStatus || definition?.httpStatus,
  }
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(
  code: string,
  options?: {
    message?: string
    details?: string
    cause?: unknown
    httpStatus?: number
  }
) {
  const error = createError(code, options)
  const definition = getErrorDefinition(code)
  const httpStatus = error.httpStatus || definition?.httpStatus || 500

  return {
    error: error.message,
    code: error.code,
    message: error.details || definition?.description || error.message,
    httpStatus,
    ...(error.details && { details: error.details }),
  }
}

/**
 * Check if error code exists in registry
 */
export function isValidErrorCode(code: string): boolean {
  return code in ERROR_REGISTRY
}

/**
 * Get all error codes by category
 */
export function getErrorsByCategory(category: string): ErrorDefinition[] {
  return Object.values(ERROR_REGISTRY).filter(err => err.category === category)
}

/**
 * Get all error codes by severity
 */
export function getErrorsBySeverity(severity: ErrorSeverity): ErrorDefinition[] {
  return Object.values(ERROR_REGISTRY).filter(err => err.severity === severity)
}

