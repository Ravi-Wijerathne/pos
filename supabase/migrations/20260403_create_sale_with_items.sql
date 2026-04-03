create or replace function public.create_sale_with_items(
  p_user_id integer,
  p_customer_id integer,
  p_total_amount numeric,
  p_discount numeric,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invoice_number text := 'INV-' || extract(epoch from now())::bigint::text;
  v_sale_id integer;
  v_item jsonb;
  v_product_id integer;
  v_quantity integer;
  v_price numeric;
  v_product_record record;
begin
  insert into sales (
    "invoiceNumber",
    "customerId",
    "totalAmount",
    "discount",
    "paidAmount",
    "paymentMethod",
    "userId",
    "createdAt",
    "updatedAt"
  ) values (
    v_invoice_number,
    p_customer_id,
    p_total_amount,
    coalesce(p_discount, 0),
    p_total_amount,
    p_payment_method::"PaymentMethod",
    p_user_id,
    now(),
    now()
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::integer;
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'price')::numeric;

    select * into v_product_record
    from products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'Product % not found', v_product_id;
    end if;

    if v_product_record.stock < v_quantity then
      raise exception 'Insufficient stock for %', v_product_record.name;
    end if;

    insert into sale_items (
      "saleId",
      "productId",
      quantity,
      price,
      subtotal
    ) values (
      v_sale_id,
      v_product_id,
      v_quantity,
      v_price,
      v_quantity * v_price
    );

    update products
    set stock = stock - v_quantity
    where id = v_product_id;

    insert into stock_logs (
      "productId",
      change,
      reason,
      "createdAt"
    ) values (
      v_product_id,
      -v_quantity,
      'Sale: ' || v_invoice_number,
      now()
    );
  end loop;

  return jsonb_build_object(
    'id', v_sale_id,
    'invoiceNumber', v_invoice_number
  );
end;
$$;