import { createClient } from "./supabase/client";

// Re-export a singleton browser client for use in storage.ts and other client components.
// This maintains backward compatibility with existing imports.
export const supabase = createClient();
