# 🚀 QUICK START - Run These Commands

Follow these steps in order to get your POS system running:

## Step 1: Update Database Connection

1. Open the `.env` file
2. Replace the database URL with your MySQL credentials:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/pos_system"
```

Replace `YOUR_PASSWORD` with your actual MySQL password.

## Step 2: Create the Database

Open MySQL and run:
```sql
CREATE DATABASE pos_system;
```

Or use MySQL Workbench/phpMyAdmin to create a database named `pos_system`.

## Step 3: Push Database Schema

Run this command to create all tables:

```bash
npm run db:push
```

## Step 4: Seed Sample Data

Add sample users, products, and customers:

```bash
npm run db:seed
```

## Step 5: Start the Application

```bash
npm run dev
```

## Step 6: Login

Open http://localhost:3000 in your browser and login with:

**Admin:**
- Email: `admin@pos.com`
- Password: `admin123`

**Cashier:**
- Email: `cashier@pos.com`
- Password: `cashier123`

---

## 🎉 That's it! Your POS system is now running!

### What to Try:

1. **Dashboard** - View sales statistics
2. **POS** - Make a test sale
3. **Products** - Add your own products
4. **Customers** - Add your customers
5. **Users** - Create accounts for your staff

### Need Help?

- Check **SETUP.md** for detailed troubleshooting
- Check **README.md** for full documentation
- Check **PROJECT_SUMMARY.md** for system overview
