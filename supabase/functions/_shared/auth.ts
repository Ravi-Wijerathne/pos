import { createClient } from "npm:@supabase/supabase-js@2";
import { withCors } from "./cors.ts";
import { getNeonSql } from "./neon.ts";

type AppUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER" | "MANAGER";
};

function createAnonClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon configuration");
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAppUser(request: Request): Promise<{ appUser: AppUser } | Response> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return withCors({ error: "Unauthorized" }, 401);
  }

  const anon = createAnonClient();
  const { data: authData, error: authError } = await anon.auth.getUser(token);

  if (authError || !authData.user?.email) {
    return withCors({ error: "Unauthorized" }, 401);
  }

  const sql = getNeonSql();
  const rows = await sql<AppUser[]>`
    select id, name, email, role
    from users
    where email = ${authData.user.email}
    limit 1
  `;

  if (!rows.length) {
    return withCors({ error: "Forbidden" }, 403);
  }

  return { appUser: rows[0] };
}