// Sanitize database errors to prevent information leakage
export function sanitizeError(error: any): string {
  const errorMessage = error?.message || '';
  
  // Map specific error patterns to user-friendly messages
  if (errorMessage.includes('duplicate key')) {
    return 'This record already exists. Please try again with different information.';
  }
  
  if (errorMessage.includes('violates foreign key constraint')) {
    return 'Unable to complete the operation due to related data. Please try again.';
  }
  
  if (errorMessage.includes('violates not-null constraint')) {
    return 'Please fill in all required fields.';
  }
  
  if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (errorMessage.includes('JWT') || errorMessage.includes('auth')) {
    return 'Authentication failed. Please log in again.';
  }
  
  // Generic fallback for any other database errors
  return 'An error occurred. Please try again later.';
}
