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
  const url = new URL(request.url);

  if (request.method === "GET") {
    const search = url.searchParams.get("search") ?? "";

    try {
      const searchTerm = `%${search}%`;
      const data = search
        ? await sql`
            select
              p.id,
              p.name,
              p."categoryId",
              p.price,
              p."costPrice",
              p.stock,
              p.barcode,
              p."createdAt",
              p."updatedAt",
              json_build_object(
                'id', c.id,
                'name', c.name,
                'createdAt', c."createdAt",
                'updatedAt', c."updatedAt"
              ) as category
            from products p
            join categories c on c.id = p."categoryId"
            where p.name ilike ${searchTerm}
              or coalesce(p.barcode, '') ilike ${searchTerm}
            order by p."createdAt" desc
          `
        : await sql`
            select
              p.id,
              p.name,
              p."categoryId",
              p.price,
              p."costPrice",
              p.stock,
              p.barcode,
              p."createdAt",
              p."updatedAt",
              json_build_object(
                'id', c.id,
                'name', c.name,
                'createdAt', c."createdAt",
                'updatedAt', c."updatedAt"
              ) as category
            from products p
            join categories c on c.id = p."categoryId"
            order by p."createdAt" desc
          `;

      return withCors(data);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to fetch products" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const categoryId = Number(body.categoryId);
    const price = Number(body.price);
    const costPrice = Number(body.costPrice);
    const stock = Number(body.stock);
    const barcode = typeof body.barcode === "string" ? body.barcode.trim() : null;

    if (!name) {
      return withCors({ error: "Product name is required" }, 400);
    }

    if (!Number.isFinite(categoryId)) {
      return withCors({ error: "Valid category is required" }, 400);
    }

    if (!Number.isFinite(price) || price < 0) {
      return withCors({ error: "Valid selling price is required" }, 400);
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      return withCors({ error: "Valid cost price is required" }, 400);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return withCors({ error: "Valid stock quantity is required" }, 400);
    }

    const payload = {
      name,
      categoryId,
      price,
      costPrice,
      stock,
      barcode: barcode || null,
    };

    try {
      const rows = await sql`
        insert into products (name, "categoryId", price, "costPrice", stock, barcode, "createdAt", "updatedAt")
        values (
          ${payload.name},
          ${Number(payload.categoryId)},
          ${Number(payload.price)},
          ${Number(payload.costPrice)},
          ${Number(payload.stock)},
          ${payload.barcode},
          now(),
          now()
        )
        returning id
      `;

      const productId = rows[0]?.id;

      if (!productId) {
        return withCors({ error: "Failed to create product" }, 500);
      }

      await sql`
        insert into stock_logs ("productId", change, reason, "createdAt")
        values (${productId}, ${Number(payload.stock ?? 0)}, 'Initial stock', now())
      `;

      const data = await sql`
        select
          p.id,
          p.name,
          p."categoryId",
          p.price,
          p."costPrice",
          p.stock,
          p.barcode,
          p."createdAt",
          p."updatedAt",
          json_build_object(
            'id', c.id,
            'name', c.name,
            'createdAt', c."createdAt",
            'updatedAt', c."updatedAt"
          ) as category
        from products p
        join categories c on c.id = p."categoryId"
        where p.id = ${productId}
        limit 1
      `;

      return withCors(data[0], 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create product";

      if (message.toLowerCase().includes("duplicate key") && message.toLowerCase().includes("barcode")) {
        return withCors({ error: "Barcode already exists" }, 409);
      }

      return withCors({ error: message }, 500);
    }
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);

    if (!Number.isFinite(id)) {
      return withCors({ error: "Product id is required" }, 400);
    }

    const currentRows = await sql`
      select id, stock
      from products
      where id = ${id}
      limit 1
    `;

    if (!currentRows.length) {
      return withCors({ error: "Product not found" }, 404);
    }

    try {
      await sql`
        update products
        set
          name = ${body.name},
          "categoryId" = ${Number(body.categoryId)},
          price = ${Number(body.price)},
          "costPrice" = ${Number(body.costPrice)},
          stock = ${Number(body.stock)},
          barcode = ${body.barcode ?? null}
        where id = ${id}
      `;

      const previousStock = Number(currentRows[0].stock);
      const nextStock = Number(body.stock);

      if (previousStock !== nextStock) {
        await sql`
          insert into stock_logs ("productId", change, reason, "createdAt")
          values (${id}, ${nextStock - previousStock}, 'Manual adjustment', now())
        `;
      }

      const data = await sql`
        select
          p.id,
          p.name,
          p."categoryId",
          p.price,
          p."costPrice",
          p.stock,
          p.barcode,
          p."createdAt",
          p."updatedAt",
          json_build_object(
            'id', c.id,
            'name', c.name,
            'createdAt', c."createdAt",
            'updatedAt', c."updatedAt"
          ) as category
        from products p
        join categories c on c.id = p."categoryId"
        where p.id = ${id}
        limit 1
      `;

      return withCors(data[0]);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to update product" }, 500);
    }
  }

  if (request.method === "DELETE") {
    if (authResult.appUser.role !== "ADMIN") {
      return withCors({ error: "Unauthorized" }, 401);
    }

    const idParam = url.searchParams.get("id");
    const id = Number(idParam);

    if (!Number.isFinite(id)) {
      return withCors({ error: "Product ID required" }, 400);
    }

    try {
      await sql`
        delete from products
        where id = ${id}
      `;
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to delete product" }, 500);
    }

    return withCors({ success: true });
  }

  return withCors({ error: "Method not allowed" }, 405);
});