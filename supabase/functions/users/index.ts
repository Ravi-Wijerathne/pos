import { corsHeaders, withCors } from "../_shared/cors.ts";
import { createServiceClient, requireAppUser } from "../_shared/auth.ts";
import { getNeonSql } from "../_shared/neon.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authResult = await requireAppUser(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  if (authResult.appUser.role !== "ADMIN") {
    return withCors({ error: "Unauthorized" }, 401);
  }

  const service = createServiceClient();
  const sql = getNeonSql();

  if (request.method === "GET") {
    try {
      const data = await sql`
        select id, name, email, role, "createdAt"
        from users
        order by "createdAt" desc
      `;
      return withCors(data);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to fetch users" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!name || !email || !password || !["ADMIN", "CASHIER", "MANAGER"].includes(role)) {
      return withCors({ error: "Invalid payload" }, 400);
    }

    const { data: authUser, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (authError) {
      return withCors({ error: authError.message }, 500);
    }

    try {
      const rows = await sql`
        insert into users (name, email, role, password, "createdAt", "updatedAt")
        values (${name}, ${email}, ${role}::"UserRole", 'SUPABASE_MANAGED', now(), now())
        on conflict (email)
        do update set
          name = excluded.name,
          role = excluded.role,
          "updatedAt" = now()
        returning id, name, email, role, "createdAt"
      `;

      return withCors(rows[0], 201);
    } catch (error) {
      await service.auth.admin.deleteUser(authUser.user.id);
      const message = error instanceof Error ? error.message : "Failed to create user";
      return withCors({ error: message }, 500);
    }
  }

  return withCors({ error: "Method not allowed" }, 405);
});