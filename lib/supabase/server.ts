import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration is considered optional in non-production.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseEnabled = Boolean(supabaseUrl && supabaseServiceKey);

// Lazy initialization: client is created only when first accessed.
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns true when Supabase is configured at runtime.
 */
export function isSupabaseEnabled() {
  return supabaseEnabled;
}

/**
 * Get or create the Supabase admin client.
 * Validates environment variables only at runtime (when first called).
 * This allows the module to be imported during build time.
 */
function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseEnabled) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL - required at runtime');
    }
    return null;
  }

  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  supabaseAdminInstance = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
}

// Export function for explicit usage
export { getSupabaseAdmin };

// Export as object with getter for backward compatibility
// This allows existing code to use `supabaseAdmin` without changes
// The getter is only executed when the property is accessed, not at import time
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error(
        'Supabase is not configured for this environment. Set NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY or skip this code path.',
      );
    }
    const value = (client as any)[prop];
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

