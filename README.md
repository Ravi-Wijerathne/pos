# 🏪 POS System - Point of Sale Application

A modern, full-stack Point of Sale (POS) system built with Next.js 15, TypeScript, Prisma, and MySQL. Designed for physical shops, salons, and small businesses to manage sales, inventory, customers, and billing.

## ✨ Features

### Core Functionality
- **Authentication & Authorization**
  - Secure login with NextAuth.js
  - Role-based access control (Admin, Manager, Cashier)
  - Session management

- **Product & Inventory Management**
  - Add, edit, and delete products
  - Category management
  - Stock tracking with automatic deduction
  - Low stock alerts
  - Barcode support
  - Stock movement logs

- **POS Billing Interface**
  - Fast, responsive interface
  - Product search and barcode scanning
  - Shopping cart management
  - Real-time stock validation
  - Discount application
  - Multiple payment methods (Cash, Card, Mobile)

- **Sales Management**
  - Complete sales history
  - Invoice generation and tracking
  - PDF receipt generation with download
  - Receipt preview and printing
  - Detailed transaction records
  - Sales by cashier tracking

- **Customer Management**
  - Customer registration
  - Purchase history
  - Loyalty points system (ready for implementation)

- **User Management** (Admin only)
  - Create and manage staff accounts
  - Role assignment
  - Activity tracking

- **Reports & Analytics**
  - Daily sales dashboard
  - Sales statistics
  - Low stock alerts
  - Revenue tracking

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **Next.js API Routes** - Backend API
- **Server Actions** - Server-side mutations
- **Prisma ORM** - Database ORM
- **NextAuth.js** - Authentication

### Database
- **MySQL 8+** - Relational database

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MySQL** 8.0 or higher

## 🚀 Getting Started

### Quick Start (Recommended) 🎯

The easiest way to start the application is using our **automated startup script**:

```bash
# Clone the repository
git clone https://github.com/Ravi-Wijerathne/pos.git
cd pos

# Make the script executable (first time only)
chmod +x start-app.sh

# Run the automated startup script
./start-app.sh
```

**That's it!** The script will automatically:
- ✅ Check all system requirements (Node.js, npm, MySQL)
- ✅ Install/update dependencies if needed
- ✅ Create `.env` file with secure defaults
- ✅ Connect to MySQL and create database automatically
- ✅ Set up database schema (Prisma migration)
- ✅ Offer to seed with sample data
- ✅ Start the development server
- ✅ Open the app in your browser automatically

For production mode:
```bash
./start-app.sh --production
```
---

### Manual Setup (Alternative)

If you prefer to set up manually:

#### 1. Clone the Repository

```bash
git clone https://github.com/Ravi-Wijerathne/pos.git
cd pos
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
# Database - Update with your MySQL credentials
DATABASE_URL="mysql://root:password@localhost:3306/pos_system"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production-min-32-chars
```

Generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

#### 4. Setup MySQL Database

Create the database:

```sql
CREATE DATABASE pos_system;
```

#### 5. Push Database Schema

```bash
npm run db:push
```

#### 6. Seed the Database (Optional)

```bash
npm run db:seed
```

This creates:
- **Admin user:** `admin@pos.com` / `admin123`
- **Cashier user:** `cashier@pos.com` / `cashier123`
- Sample categories, products, and customers

#### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 Default Login Credentials

After seeding, you can login with:

**Admin Account:**
- Email: `admin@pos.com`
- Password: `admin123`

**Cashier Account:**
- Email: `cashier@pos.com`
- Password: `cashier123`

## 📊 Database Schema

### Tables

1. **users** - Staff accounts (Admin, Cashier, Manager)
2. **categories** - Product categories
3. **products** - Product inventory
4. **customers** - Customer information
5. **sales** - Main invoice records
6. **sale_items** - Items in each invoice
7. **stock_logs** - Inventory movement tracking

## 🎯 Usage Guide

### For Cashiers

1. **Login** - Use your credentials to access the system
2. **POS Screen** - Navigate to POS to start selling
3. **Add Products** - Search or scan barcodes to add items to cart
4. **Checkout** - Select payment method and complete sale
5. **Receipt** - Preview, print, or download PDF receipt after checkout
6. **View Sales** - Check your transaction history and reprint receipts

### For Managers

All cashier features plus:
- View all sales across all cashiers
- Access reports and analytics
- Manage inventory and products

### For Admins

All features plus:
- Create and manage user accounts
- Full system configuration
- Advanced reporting

## 🏗 Project Structure

```
pos/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product CRUD
│   │   ├── categories/   # Category management
│   │   ├── customers/    # Customer management
│   │   ├── sales/        # Sales processing
│   │   └── users/        # User management
│   ├── dashboard/        # Dashboard page
│   ├── pos/              # POS billing screen
│   ├── products/         # Product management
│   ├── customers/        # Customer management
│   ├── sales/            # Sales history
│   ├── users/            # User management
│   └── login/            # Login page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── providers.tsx     # SessionProvider wrapper
│   └── product-form.tsx  # Product form component
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
└── types/
    └── next-auth.d.ts    # NextAuth type definitions
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Local Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

### Cloud Deployment

Deploy on platforms like:
- **Vercel** (Recommended for Next.js)
- **Railway** (Database + App)
- **PlanetScale** (MySQL Database)

## 🔐 Security Notes

1. **Change default passwords** immediately after setup
2. **Use strong NEXTAUTH_SECRET** in production
3. **Enable HTTPS** in production
4. **Regularly backup** your database
5. **Keep dependencies updated**

## 📱 Future Enhancements

- [x] PDF Receipt Generation ✅
- [ ] Thermal Printer Support (ESC/POS)
- [ ] Customer Loyalty Points Implementation
- [ ] Multi-branch Support
- [ ] Advanced Reports & Analytics
- [ ] Inventory Alerts via Email/SMS
- [ ] Payment Gateway Integration
- [ ] Mobile App (React Native)
- [ ] Offline Mode Support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

Made with ❤️ for small businesses
