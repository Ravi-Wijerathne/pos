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
        select id, name, phone, "loyaltyPoints", "createdAt", "updatedAt"
        from customers
        order by "createdAt" desc
      `;
      return withCors(data);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to fetch customers" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name || !phone) {
      return withCors({ error: "Name and phone are required" }, 400);
    }

    try {
      const rows = await sql`
        insert into customers (name, phone, "loyaltyPoints")
        values (${name}, ${phone}, 0)
        returning id, name, phone, "loyaltyPoints", "createdAt", "updatedAt"
      `;
      return withCors(rows[0], 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create customer";
      const isUnique = message.includes("duplicate key") || message.includes("customers_phone_key");
      return withCors({ error: isUnique ? "Phone number already exists" : message }, isUnique ? 400 : 500);
    }
  }

  return withCors({ error: "Method not allowed" }, 405);
});