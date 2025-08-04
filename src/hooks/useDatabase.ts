import { useCallback } from 'react';
import { supabase, validateSession, dbOperation } from '../lib/supabase';

// Global database hook for all database operations
export const useDatabase = () => {
  // Generic database query with session validation
  const query = useCallback(async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    operationName: string = 'Database query'
  ): Promise<{ data: T; error: any }> => {
    return await dbOperation(
      async () => {
        const result = await queryFn();
        return { data: result.data || fallbackValue, error: result.error };
      },
      { data: fallbackValue, error: { message: 'Session validation failed' } },
      operationName
    );
  }, []);

  // Generic database mutation with session validation
  const mutate = useCallback(async <T>(
    mutationFn: () => Promise<{ data: T | null; error: any }>,
    fallbackValue: T,
    operationName: string = 'Database mutation'
  ): Promise<{ data: T; error: any }> => {
    return await dbOperation(
      async () => {
        const result = await mutationFn();
        return { data: result.data || fallbackValue, error: result.error };
      },
      { data: fallbackValue, error: { message: 'Session validation failed' } },
      operationName
    );
  }, []);

  // Check if session is valid
  const checkSession = useCallback(async (): Promise<boolean> => {
    return await validateSession();
  }, []);

  return {
    query,
    mutate,
    checkSession,
    supabase
  };
}; 