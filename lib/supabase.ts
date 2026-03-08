// Server-only exports (used in API routes and Server Components)
export { createAdminSupabase, createServerSupabase, getAuthUser, getProfile } from './supabase-server';

// Client export (used in Client Components)
export { createBrowserSupabase } from './supabase-client';
