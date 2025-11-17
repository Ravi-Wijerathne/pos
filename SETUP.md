# 🚀 POS System Setup Guide

Follow this step-by-step guide to get your POS system up and running.

## ⚙️ Step 1: Update Environment Variables

1. Open the `.env` file in the root directory
2. Update the following values:

### Database Configuration
```env
DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@localhost:3306/pos_system"
```

Replace:
- `YOUR_USER` - Your MySQL username (default: `root`)
- `YOUR_PASSWORD` - Your MySQL password

### NextAuth Configuration
```env
NEXTAUTH_SECRET=your-secret-key-change-this-in-production-min-32-chars
```

Generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## 🗄️ Step 2: Setup MySQL Database

### Option A: Using MySQL Command Line

```bash
mysql -u root -p
```

Then run:
```sql
CREATE DATABASE pos_system;
EXIT;
```

### Option B: Using MySQL Workbench or phpMyAdmin

1. Open your MySQL GUI tool
2. Create a new database named `pos_system`
3. Make sure it uses `utf8mb4` encoding

## 📦 Step 3: Initialize Database Tables

Run this command to create all tables:

```bash
npm run db:push
```

This will:
- Connect to your MySQL database
- Create all necessary tables based on the Prisma schema
- Set up relationships and indexes

## 🌱 Step 4: Seed Database (Optional but Recommended)

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:
- ✅ **Admin user**: `admin@pos.com` / `admin123`
- ✅ **Cashier user**: `cashier@pos.com` / `cashier123`
- ✅ 4 Product categories (Electronics, Clothing, Food & Beverage, Health & Beauty)
- ✅ 6 Sample products with stock
- ✅ 2 Sample customers

## 🏃 Step 5: Start the Application

```bash
npm run dev
```

The application will start on: **http://localhost:3000**

## ✅ Step 6: Test the Application

1. **Open your browser** and go to http://localhost:3000
2. You should be redirected to the login page
3. **Login with admin credentials:**
   - Email: `admin@pos.com`
   - Password: `admin123`

4. **Explore the features:**
   - Dashboard - View sales statistics
   - POS - Try making a sale
   - Products - View and manage inventory
   - Customers - View customer list
   - Sales - View transaction history
   - Users - Create new staff accounts (Admin only)

## 🔧 Troubleshooting

### Database Connection Issues

**Error: "Can't connect to MySQL server"**
- Make sure MySQL is running
- Check if the port is correct (default: 3306)
- Verify username and password in `.env`

**Solution:**
```bash
# Check MySQL status (Windows)
Get-Service MySQL*

# Start MySQL if not running
Start-Service MySQL80  # Adjust service name as needed
```

### Prisma Client Issues

**Error: "Prisma Client not generated"**

Run:
```bash
npx prisma generate
```

### Port Already in Use

**Error: "Port 3000 is already in use"**

Change the port:
```bash
npm run dev -- -p 3001
```

### Module Not Found Errors

Clear the build cache and reinstall:
```bash
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev
```

## 📝 Next Steps

### 1. Change Default Passwords
**Important:** For security, change the default passwords:

1. Login as admin
2. Go to Users page
3. Delete or update the default accounts
4. Create new secure accounts

### 2. Add Your Products
1. Go to **Products** page
2. Add categories for your business
3. Add your actual products with:
   - Product names
   - Prices
   - Stock quantities
   - Barcodes (if available)

### 3. Add Your Team
1. Go to **Users** page
2. Create accounts for your staff:
   - Cashiers
   - Managers
   - Other admins

### 4. Configure Settings
1. Update the `.env` file with production values
2. Change `NEXTAUTH_URL` to your domain
3. Use a strong `NEXTAUTH_SECRET`

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Environment Variables in Production
Make sure to set these in your hosting platform:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 📞 Need Help?

- Check the main **README.md** for detailed documentation
- Review the **Troubleshooting** section above
- Check Prisma logs: `npx prisma studio` for database inspection

## ✨ Tips for Best Experience

1. **Use Chrome or Edge** for the best experience
2. **Keep backups** of your database regularly
3. **Update dependencies** periodically: `npm update`
4. **Monitor disk space** as your sales data grows
5. **Test in a staging environment** before making changes

---

🎉 **Congratulations!** Your POS system is ready to use!
