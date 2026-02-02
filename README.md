# POS System

Modern Point of Sale system built with Next.js, TypeScript, Prisma, and MySQL.

## Features

- Authentication & role-based access (Admin, Manager, Cashier)
- Product & inventory management with barcode support
- POS billing interface with multiple payment methods
- Sales tracking & PDF receipt generation
- Customer & user management
- Dashboard with sales analytics

## Tech Stack

Next.js 15, React 19, TypeScript, Prisma ORM, MySQL, NextAuth.js, Tailwind CSS, shadcn/ui


## Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## Quick Setup

### Automated (Recommended)

```bash
# Clone repository
git clone https://github.com/Ravi-Wijerathne/pos.git
cd pos

# Run automated script
python start-app.py
```

The script will:
- Install dependencies
- Create `.env` file
- Setup database
- Seed sample data
- Start the server

### Manual Setup

1. Clone and install dependencies:
```bash
git clone https://github.com/Ravi-Wijerathne/pos.git
cd pos
npm install
```

2. Create `.env` file:
```env
DATABASE_URL="mysql://root:password@localhost:3306/pos_system"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars
```

3. Setup database:
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE pos_system;"

# Push schema
npm run db:push

# Seed data (optional)
npm run db:seed
```

4. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Login

**Admin:** admin@pos.com / admin123  
**Cashier:** cashier@pos.com / cashier123

## Scripts

```bash
npm run dev       # Development server
npm run build     # Build for production
npm run start     # Production server
npm run db:push   # Push schema to database
npm run db:seed   # Seed sample data
```

## License

MIT License - see [LICENSE](LICENSE) file
