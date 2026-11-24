/**
 * Helper function to check if an error is a foreign key constraint error
 * 
 * @param error - The error object to check
 * @returns true if the error is a foreign key constraint error, false otherwise
 * 
 * MySQL foreign key constraint error codes:
 * - 1451: ER_ROW_IS_REFERENCED_2 - Cannot delete or update a parent row
 * - 1452: ER_NO_REFERENCED_ROW_2 - Cannot add or update a child row
 */
export function isForeignKeyConstraintError(error: any): boolean {
  const errno = error?.errno || error?.original?.errno;
  const code = error?.code || error?.original?.code;
  const message = error?.message || error?.original?.message || '';

  return (
    errno === 1451 ||
    errno === 1452 ||
    code === 'ER_ROW_IS_REFERENCED_2' ||
    code === 'ER_NO_REFERENCED_ROW_2' ||
    message.toLowerCase().includes('foreign key constraint') ||
    message.toLowerCase().includes('cannot delete or update')
  );
}

