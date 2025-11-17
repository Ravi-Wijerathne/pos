import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pos.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@pos.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create cashier user
  const cashierPassword = await hash("cashier123", 10);
  const cashier = await prisma.user.upsert({
    where: { email: "cashier@pos.com" },
    update: {},
    create: {
      name: "Cashier User",
      email: "cashier@pos.com",
      password: cashierPassword,
      role: "CASHIER",
    },
  });
  console.log("✅ Created cashier user:", cashier.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 1 },
      update: {},
      create: { name: "Electronics" },
    }),
    prisma.category.upsert({
      where: { id: 2 },
      update: {},
      create: { name: "Clothing" },
    }),
    prisma.category.upsert({
      where: { id: 3 },
      update: {},
      create: { name: "Food & Beverage" },
    }),
    prisma.category.upsert({
      where: { id: 4 },
      update: {},
      create: { name: "Health & Beauty" },
    }),
  ]);
  console.log("✅ Created categories:", categories.length);

  // Create sample products
  const products = [
    {
      name: "Wireless Mouse",
      categoryId: 1,
      price: 2500,
      costPrice: 1800,
      stock: 50,
      barcode: "8901234567890",
    },
    {
      name: "USB Cable",
      categoryId: 1,
      price: 500,
      costPrice: 300,
      stock: 100,
      barcode: "8901234567891",
    },
    {
      name: "T-Shirt",
      categoryId: 2,
      price: 1500,
      costPrice: 800,
      stock: 30,
      barcode: "8901234567892",
    },
    {
      name: "Jeans",
      categoryId: 2,
      price: 3500,
      costPrice: 2000,
      stock: 25,
      barcode: "8901234567893",
    },
    {
      name: "Coffee Pack",
      categoryId: 3,
      price: 800,
      costPrice: 500,
      stock: 60,
      barcode: "8901234567894",
    },
    {
      name: "Shampoo",
      categoryId: 4,
      price: 1200,
      costPrice: 700,
      stock: 40,
      barcode: "8901234567895",
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { barcode: product.barcode },
      update: {},
      create: product,
    });

    // Create initial stock log
    await prisma.stockLog.create({
      data: {
        productId: created.id,
        change: product.stock,
        reason: "Initial stock",
      },
    });
  }
  console.log("✅ Created products:", products.length);

  // Create sample customers
  const customers = [
    {
      name: "John Doe",
      phone: "0771234567",
      loyaltyPoints: 100,
    },
    {
      name: "Jane Smith",
      phone: "0772345678",
      loyaltyPoints: 50,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: customer,
    });
  }
  console.log("✅ Created customers:", customers.length);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
