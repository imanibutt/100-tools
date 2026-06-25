import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    const causeObj =
      cause && typeof cause === "object"
        ? (cause as { code?: string; message?: string })
        : undefined;
    return {
      name: error.name,
      message: error.message,
      causeCode: causeObj?.code || null,
      causeMessage: causeObj?.message || null,
    };
  }
  return { name: "Error", message: String(error), causeCode: null, causeMessage: null };
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }

  if (!supabase) {
    supabase = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabase;
}

export async function reportSupabaseFailure(stage: string, error: unknown) {
  const summary = summarizeError(error);
  console.error(`[brutal-reminder] Supabase ${stage} failed`, summary);
  return summary;
}
