import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://aqxawwgoyedebfrvflzu.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeGF3d2dveWVkZWJmcnZmbHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDMzMDEsImV4cCI6MjEwNDExOTMwMX0.yxFWtlherqmWiyhQvxMvTgR75zUblJsx0ufVaFvREEU";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side instance (used in React components & hooks for Auth and Realtime)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side elevated instance (only initialized on server if service role key is available)
export const supabaseAdmin =
  typeof window === "undefined" && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;
