#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       POS Application Auto Starter            ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait with spinner
wait_with_spinner() {
    local pid=$1
    local message=$2
    local spin='-\|/'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r${BLUE}[WAIT]${NC} $message ${spin:$i:1}"
        sleep 0.1
    done
    printf "\r"
}

# Step 1: Check Node.js installation
print_status "Checking Node.js installation..."
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js (v18 or higher) first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Step 2: Check npm installation
print_status "Checking npm installation..."
if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm $(npm -v) detected"

# Step 3: Check MySQL installation and status
print_status "Checking MySQL installation..."
if ! command_exists mysql; then
    print_error "MySQL client not found in PATH."
    echo "Please install MySQL client:"
    echo "  Ubuntu/Debian: sudo apt install mysql-client"
    echo "  Fedora/RHEL: sudo dnf install mysql"
    echo "  Arch: sudo pacman -S mysql-clients"
    exit 1
fi

print_success "MySQL client detected"

# Try to check if MySQL service is running
if systemctl is-active --quiet mysql 2>/dev/null || systemctl is-active --quiet mysqld 2>/dev/null; then
    print_success "MySQL service is running"
else
    print_warning "Cannot verify MySQL service status. Please ensure MySQL is running."
    echo "  You may need to start it manually:"
    echo "    sudo systemctl start mysql"
    echo "    or"
    echo "    sudo systemctl start mysqld"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

# Step 4: Check if node_modules exists
print_status "Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    print_warning "Dependencies not found or incomplete. Installing dependencies..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed successfully"
else
    print_success "Dependencies already installed"
    
    # Check if package.json has been modified since last install
    if [ "package.json" -nt "node_modules/.package-lock.json" ]; then
        print_warning "package.json has been modified. Updating dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to update dependencies"
            exit 1
        fi
        print_success "Dependencies updated successfully"
    fi
fi

# Step 5: Check and create .env file
print_status "Checking .env file..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating .env file..."
    
    # Generate a random secret for NextAuth
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    cat > .env << EOF
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/pos_system"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# Environment
NODE_ENV="development"
EOF
    
    print_success ".env file created with default values"
    echo ""
    print_warning "⚠️  IMPORTANT: Please update the .env file with your actual database credentials!"
    echo -e "${YELLOW}   Database URL format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE${NC}"
    echo ""
    read -p "Press Enter to continue after updating .env, or Ctrl+C to exit and update later..."
elif [ ! -s ".env" ]; then
    print_error ".env file exists but is empty"
    exit 1
else
    print_success ".env file found"
fi

# Step 6: Validate .env file
print_status "Validating .env configuration..."
if ! grep -q "DATABASE_URL" .env || ! grep -q "NEXTAUTH_SECRET" .env || ! grep -q "NEXTAUTH_URL" .env; then
    print_error ".env file is missing required variables"
    echo "Required variables: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL"
    exit 1
fi

# Check if DATABASE_URL has default placeholder values
if grep -q "mysql://root:password@localhost:3306" .env; then
    print_warning "DATABASE_URL appears to use default credentials. Please verify your database settings."
fi

print_success "Environment variables validated"

# Step 7: Check Prisma Client
print_status "Checking Prisma Client..."
if [ ! -d "node_modules/.prisma/client" ]; then
    print_warning "Prisma Client not generated. Generating..."
    npx prisma generate
    if [ $? -ne 0 ]; then
        print_error "Failed to generate Prisma Client"
        exit 1
    fi
    print_success "Prisma Client generated"
else
    print_success "Prisma Client found"
fi

# Step 8: Database connection test and setup
print_status "Checking database connection and setup..."

# Extract database connection details from .env
DB_URL=$(grep "DATABASE_URL" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

# Parse DATABASE_URL to extract components
# Format: mysql://username:password@host:port/database
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

if [ -z "$DB_USER" ] || [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
    print_error "Failed to parse DATABASE_URL from .env file"
    echo "Current DATABASE_URL: $DB_URL"
    exit 1
fi

print_status "Database details: User=$DB_USER, Host=$DB_HOST:$DB_PORT, Database=$DB_NAME"

# Test MySQL connection
print_status "Testing MySQL connection..."
MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
if [ -n "$DB_PASS" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
fi

# Test connection without specifying database
if echo "SELECT 1;" | $MYSQL_CMD 2>/dev/null | grep -q "1"; then
    print_success "MySQL connection successful"
else
    print_error "Failed to connect to MySQL server"
    echo "Please verify:"
    echo "  - MySQL is running"
    echo "  - Credentials are correct: User=$DB_USER, Host=$DB_HOST:$DB_PORT"
    echo "  - Password is correct (check .env file)"
    exit 1
fi

# Check if database exists, create if not
print_status "Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(echo "SHOW DATABASES LIKE '$DB_NAME';" | $MYSQL_CMD 2>/dev/null | grep -c "$DB_NAME")

if [ "$DB_EXISTS" -eq 0 ]; then
    print_warning "Database '$DB_NAME' does not exist. Creating database..."
    
    if echo "CREATE DATABASE \`$DB_NAME\`;" | $MYSQL_CMD 2>/dev/null; then
        print_success "Database '$DB_NAME' created successfully"
    else
        print_error "Failed to create database '$DB_NAME'"
        echo "You may need to create it manually:"
        echo "  mysql -u $DB_USER -p -e \"CREATE DATABASE $DB_NAME;\""
        exit 1
    fi
else
    print_success "Database '$DB_NAME' exists"
fi

# Check if tables exist
print_status "Checking database schema..."
TABLES_CHECK=$(echo "USE $DB_NAME; SHOW TABLES;" | $MYSQL_CMD 2>/dev/null)

if echo "$TABLES_CHECK" | grep -q "users\|products\|categories"; then
    print_success "Database tables found"
else
    print_warning "Database tables not found. Setting up database schema..."
    npx prisma db push --accept-data-loss
    if [ $? -ne 0 ]; then
        print_error "Failed to push database schema"
        exit 1
    fi
    print_success "Database schema created"
    
    # Ask if user wants to seed the database
    echo ""
    read -p "Do you want to seed the database with initial data? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Seeding database..."
        npm run db:seed
        if [ $? -ne 0 ]; then
            print_warning "Database seeding failed, but continuing..."
        else
            print_success "Database seeded successfully"
            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════${NC}"
            echo -e "${GREEN}  Default Admin Credentials${NC}"
            echo -e "${GREEN}  Email: admin@pos.com${NC}"
            echo -e "${GREEN}  Password: admin123${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════${NC}"
            echo ""
        fi
    fi
fi

# Step 9: Check if port 3000 is available
print_status "Checking if port 3000 is available..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 is already in use"
    read -p "Do you want to kill the process using port 3000? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -Pi :3000 -sTCP:LISTEN -t)
        kill -9 $PID 2>/dev/null
        print_success "Process killed"
    else
        print_error "Cannot start application on port 3000"
        exit 1
    fi
fi

# Step 10: Build check (optional, for production)
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    print_status "Production mode detected. Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi
    print_success "Build completed successfully"
fi

# Step 11: Final checks
print_status "Running final checks..."

# Check if all required files exist
REQUIRED_FILES=("package.json" "next.config.ts" "tsconfig.json" "prisma/schema.prisma")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done
print_success "All required files present"

# Step 12: Start the application
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     All checks passed! Starting application    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Function to open browser after a delay
open_browser() {
    sleep 5  # Wait for server to be fully ready
    
    local url="http://localhost:3000"
    
    if command_exists xdg-open; then
        xdg-open "$url" >/dev/null 2>&1 &
    elif command_exists gnome-open; then
        gnome-open "$url" >/dev/null 2>&1 &
    elif command_exists firefox; then
        firefox "$url" >/dev/null 2>&1 &
    elif command_exists google-chrome; then
        google-chrome "$url" >/dev/null 2>&1 &
    elif command_exists chromium-browser; then
        chromium-browser "$url" >/dev/null 2>&1 &
    else
        print_warning "Could not automatically open browser. Please visit: $url"
    fi
}

if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
    print_status "Starting application in PRODUCTION mode..."
    echo -e "${BLUE}Application will be available at: ${GREEN}http://localhost:3000${NC}"
    echo ""
    
    # Start browser opener in background
    open_browser &
    
    npm run start
else
    print_status "Starting application in DEVELOPMENT mode..."
    echo -e "${BLUE}Application will be available at: ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Start browser opener in background
    open_browser &
    
    npm run dev
fi

# If we reach here, the app has been stopped
echo ""
print_status "Application stopped"
