import { corsHeaders, withCors } from "../_shared/cors.ts";
import { requireAppUser } from "../_shared/auth.ts";
import { getNeonSql } from "../_shared/neon.ts";

type SaleItemInput = {
  productId: number;
  quantity: number;
  price: number;
};

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
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    try {
      const data = startDate && endDate
        ? await sql`
            select
              s.id,
              s."invoiceNumber",
              s."customerId",
              s."totalAmount",
              s.discount,
              s."paidAmount",
              s."paymentMethod",
              s."userId",
              s."createdAt",
              s."updatedAt",
              case when c.id is null then null else json_build_object('name', c.name) end as customer,
              json_build_object('name', u.name) as "user",
              coalesce(
                json_agg(
                  json_build_object(
                    'quantity', si.quantity,
                    'price', si.price,
                    'product', json_build_object('name', p.name)
                  )
                ) filter (where si.id is not null),
                '[]'::json
              ) as "saleItems"
            from sales s
            left join customers c on c.id = s."customerId"
            join users u on u.id = s."userId"
            left join sale_items si on si."saleId" = s.id
            left join products p on p.id = si."productId"
            where s."createdAt" >= ${startDate}
              and s."createdAt" <= ${endDate}
            group by s.id, c.id, u.id
            order by s."createdAt" desc
            limit 100
          `
        : await sql`
            select
              s.id,
              s."invoiceNumber",
              s."customerId",
              s."totalAmount",
              s.discount,
              s."paidAmount",
              s."paymentMethod",
              s."userId",
              s."createdAt",
              s."updatedAt",
              case when c.id is null then null else json_build_object('name', c.name) end as customer,
              json_build_object('name', u.name) as "user",
              coalesce(
                json_agg(
                  json_build_object(
                    'quantity', si.quantity,
                    'price', si.price,
                    'product', json_build_object('name', p.name)
                  )
                ) filter (where si.id is not null),
                '[]'::json
              ) as "saleItems"
            from sales s
            left join customers c on c.id = s."customerId"
            join users u on u.id = s."userId"
            left join sale_items si on si."saleId" = s.id
            left join products p on p.id = si."productId"
            group by s.id, c.id, u.id
            order by s."createdAt" desc
            limit 100
          `;

      return withCors(data);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to fetch sales" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const items = (Array.isArray(body.items) ? body.items : []) as SaleItemInput[];
    const discount = Number(body.discount ?? 0);
    const totalAmount = Number(body.totalAmount ?? 0);
    const customerId = body.customerId == null ? null : Number(body.customerId);
    const paymentMethod = body.paymentMethod;

    if (!items.length || !["CASH", "CARD", "MOBILE"].includes(paymentMethod)) {
      return withCors({ error: "Invalid sale payload" }, 400);
    }

    try {
      const data = await sql.begin(async (tx) => {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const datePrefix = `${y}${m}${d}`;

        const countRows = await tx<{ count: number }[]>`
          select count(*)::int as count
          from sales
          where "invoiceNumber" like ${`INV-${datePrefix}-%`}
        `;
        const sequence = (countRows[0]?.count ?? 0) + 1;
        const invoiceNumber = `INV-${datePrefix}-${String(sequence).padStart(3, "0")}`;

        const saleRows = await tx<{ id: number; invoiceNumber: string }[]>`
          insert into sales (
            "invoiceNumber",
            "customerId",
            "totalAmount",
            discount,
            "paidAmount",
            "paymentMethod",
            "userId"
          )
          values (
            ${invoiceNumber},
            ${customerId},
            ${totalAmount},
            ${discount},
            ${totalAmount},
            ${paymentMethod}::"PaymentMethod",
            ${authResult.appUser.id}
          )
          returning id, "invoiceNumber"
        `;

        const sale = saleRows[0];

        for (const rawItem of items) {
          const item = {
            productId: Number(rawItem.productId),
            quantity: Number(rawItem.quantity),
            price: Number(rawItem.price),
          };

          if (!Number.isFinite(item.productId) || !Number.isFinite(item.quantity) || !Number.isFinite(item.price)) {
            throw new Error("Invalid item in sale payload");
          }

          const productRows = await tx<{ id: number; stock: number }[]>`
            select id, stock
            from products
            where id = ${item.productId}
            for update
          `;

          if (!productRows.length) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (Number(productRows[0].stock) < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }

          await tx`
            insert into sale_items ("saleId", "productId", quantity, price, subtotal)
            values (${sale.id}, ${item.productId}, ${item.quantity}, ${item.price}, ${item.quantity * item.price})
          `;

          await tx`
            update products
            set stock = stock - ${item.quantity}
            where id = ${item.productId}
          `;

          await tx`
            insert into stock_logs ("productId", change, reason)
            values (${item.productId}, ${-item.quantity}, ${`Sale ${sale.invoiceNumber}`})
          `;
        }

        return { id: sale.id, invoiceNumber: sale.invoiceNumber };
      });

      return withCors(data, 201);
    } catch (error) {
      return withCors({ error: error instanceof Error ? error.message : "Failed to create sale" }, 500);
    }
  }

  return withCors({ error: "Method not allowed" }, 405);
});