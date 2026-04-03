import { corsHeaders, withCors } from "../_shared/cors.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { getNeonSql } from "../_shared/neon.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authResult = await requireAppUser(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const sql = getNeonSql();

  if (request.method === "GET") {
    try {
      const data = await sql`
        select id, name, "createdAt", "updatedAt"
        from categories
        order by name asc
      `;
      return withCors(data);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to fetch categories" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return withCors({ error: "Category name is required" }, 400);
    }

    try {
      const rows = await sql`
        insert into categories (name, "createdAt", "updatedAt")
        values (${name}, now(), now())
        returning id, name, "createdAt", "updatedAt"
      `;
      return withCors(rows[0], 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category";
      return withCors({ error: message }, 500);
    }
  }

  return withCors({ error: "Method not allowed" }, 405);
});