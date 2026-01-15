#!/usr/bin/env python3
"""
POS Application Auto Starter
Python equivalent of start-app.sh for cross-platform compatibility
"""

import os
import sys
import subprocess
import shutil
import re
import time
import secrets
import base64
import socket
import webbrowser
import threading
from pathlib import Path

# Colors for output (Windows compatible with colorama fallback)
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

    @staticmethod
    def init():
        """Initialize colors for Windows"""
        if sys.platform == 'win32':
            try:
                import colorama
                colorama.init()
            except ImportError:
                # Enable ANSI escape sequences on Windows 10+
                os.system('')

Colors.init()

# Project root directory
PROJECT_DIR = Path(__file__).parent.resolve()
os.chdir(PROJECT_DIR)


def print_status(message: str):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {message}")


def print_success(message: str):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {message}")


def print_warning(message: str):
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {message}")


def print_error(message: str):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {message}")


def command_exists(command: str) -> bool:
    """Check if a command exists in PATH"""
    return shutil.which(command) is not None


def run_command(command: str | list, capture_output: bool = False, shell: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result"""
    try:
        if isinstance(command, list):
            result = subprocess.run(command, capture_output=capture_output, text=True, shell=shell)
        else:
            result = subprocess.run(command, capture_output=capture_output, text=True, shell=shell)
        return result
    except Exception as e:
        print_error(f"Command failed: {e}")
        return subprocess.CompletedProcess(command, 1, '', str(e))


def get_command_output(command: str) -> str:
    """Run a command and return its output"""
    try:
        result = subprocess.run(command, capture_output=True, text=True, shell=True)
        return result.stdout.strip()
    except Exception:
        return ""


def is_port_in_use(port: int) -> bool:
    """Check if a port is in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def kill_process_on_port(port: int) -> bool:
    """Kill process using a specific port"""
    try:
        if sys.platform == 'win32':
            # Windows
            result = get_command_output(f'netstat -ano | findstr :{port}')
            if result:
                lines = result.split('\n')
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 5 and 'LISTENING' in line:
                        pid = parts[-1]
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
                return True
        else:
            # Linux/macOS
            result = get_command_output(f'lsof -ti:{port}')
            if result:
                for pid in result.split('\n'):
                    if pid:
                        os.kill(int(pid), 9)
                return True
        return False
    except Exception as e:
        print_error(f"Failed to kill process on port {port}: {e}")
        return False


def parse_database_url(db_url: str) -> dict:
    """Parse DATABASE_URL to extract connection details"""
    # Format: mysql://username:password@host:port/database
    # or: mysql://username@host:port/database (no password)
    
    # Try with password first
    pattern_with_pass = r'mysql://([^:]+):([^@]*)@([^:]+):(\d+)/([^?]+)'
    match = re.match(pattern_with_pass, db_url)
    
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': match.group(4),
            'database': match.group(5)
        }
    
    # Try without password
    pattern_no_pass = r'mysql://([^@]+)@([^:]+):(\d+)/([^?]+)'
    match = re.match(pattern_no_pass, db_url)
    
    if match:
        return {
            'user': match.group(1),
            'password': '',
            'host': match.group(2),
            'port': match.group(3),
            'database': match.group(4)
        }
    
    return {}


def read_env_file() -> dict:
    """Read and parse .env file"""
    env_vars = {}
    env_path = PROJECT_DIR / '.env'
    
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes from value
                    value = value.strip().strip('"').strip("'")
                    env_vars[key] = value
    
    return env_vars


def open_browser_delayed(url: str, delay: int = 5):
    """Open browser after a delay"""
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception:
        print_warning(f"Could not automatically open browser. Please visit: {url}")


def main():
    production_mode = '--production' in sys.argv or '-p' in sys.argv
    
    print(f"{Colors.BLUE}╔════════════════════════════════════════════════╗{Colors.NC}")
    print(f"{Colors.BLUE}║       POS Application Auto Starter            ║{Colors.NC}")
    print(f"{Colors.BLUE}╚════════════════════════════════════════════════╝{Colors.NC}")
    print()

    # Step 1: Check Node.js installation
    print_status("Checking Node.js installation...")
    if not command_exists('node'):
        print_error("Node.js is not installed. Please install Node.js (v18 or higher) first.")
        print("Visit: https://nodejs.org/")
        sys.exit(1)

    node_version_output = get_command_output('node -v')
    try:
        node_version = int(node_version_output.replace('v', '').split('.')[0])
        if node_version < 18:
            print_error(f"Node.js version must be 18 or higher. Current version: {node_version_output}")
            sys.exit(1)
    except (ValueError, IndexError):
        print_warning(f"Could not parse Node.js version: {node_version_output}")

    print_success(f"Node.js {node_version_output} detected")

    # Step 2: Check npm installation
    print_status("Checking npm installation...")
    if not command_exists('npm'):
        print_error("npm is not installed. Please install npm first.")
        sys.exit(1)

    npm_version = get_command_output('npm -v')
    print_success(f"npm {npm_version} detected")

    # Step 3: Check MySQL installation
    print_status("Checking MySQL installation...")
    if not command_exists('mysql'):
        print_error("MySQL client not found in PATH.")
        if sys.platform == 'win32':
            print("Please install MySQL and add it to your PATH.")
            print("Download from: https://dev.mysql.com/downloads/mysql/")
        else:
            print("Please install MySQL client:")
            print("  Ubuntu/Debian: sudo apt install mysql-client")
            print("  Fedora/RHEL: sudo dnf install mysql")
            print("  Arch: sudo pacman -S mysql-clients")
            print("  macOS: brew install mysql-client")
        sys.exit(1)

    print_success("MySQL client detected")

    # Check MySQL service (platform specific)
    if sys.platform != 'win32':
        mysql_running = False
        for service_name in ['mysql', 'mysqld', 'mariadb']:
            result = run_command(f'systemctl is-active --quiet {service_name}', capture_output=True)
            if result.returncode == 0:
                mysql_running = True
                break
        
        if mysql_running:
            print_success("MySQL service is running")
        else:
            print_warning("Cannot verify MySQL service status. Please ensure MySQL is running.")
            input("Press Enter to continue anyway, or Ctrl+C to exit...")
    else:
        print_warning("On Windows, please ensure MySQL service is running.")

    # Step 4: Check if node_modules exists
    print_status("Checking dependencies...")
    node_modules_path = PROJECT_DIR / 'node_modules'
    package_lock_path = node_modules_path / '.package-lock.json'
    package_json_path = PROJECT_DIR / 'package.json'

    needs_install = False
    if not node_modules_path.exists() or not package_lock_path.exists():
        needs_install = True
        print_warning("Dependencies not found or incomplete. Installing dependencies...")
    elif package_json_path.stat().st_mtime > package_lock_path.stat().st_mtime:
        needs_install = True
        print_warning("package.json has been modified. Updating dependencies...")

    if needs_install:
        print()
        result = run_command('npm install')
        if result.returncode != 0:
            print_error("Failed to install dependencies")
            sys.exit(1)
        print_success("Dependencies installed successfully")
    else:
        print_success("Dependencies already installed")

    # Step 5: Check and create .env file
    print_status("Checking .env file...")
    env_path = PROJECT_DIR / '.env'

    if not env_path.exists():
        print_warning(".env file not found. Creating .env file...")
        
        # Generate a random secret for NextAuth
        nextauth_secret = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
        
        env_content = f'''# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/pos_system"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="{nextauth_secret}"

# Environment
NODE_ENV="development"
'''
        
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print_success(".env file created with default values")
        print()
        print_warning("⚠️  IMPORTANT: Please update the .env file with your actual database credentials!")
        print(f"{Colors.YELLOW}   Database URL format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE{Colors.NC}")
        print()
        input("Press Enter to continue after updating .env, or Ctrl+C to exit and update later...")
    elif env_path.stat().st_size == 0:
        print_error(".env file exists but is empty")
        sys.exit(1)
    else:
        print_success(".env file found")

    # Step 6: Validate .env file
    print_status("Validating .env configuration...")
    env_vars = read_env_file()
    
    required_vars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
    missing_vars = [var for var in required_vars if var not in env_vars]
    
    if missing_vars:
        print_error(f".env file is missing required variables: {', '.join(missing_vars)}")
        sys.exit(1)

    if 'mysql://root:password@localhost:3306' in env_vars.get('DATABASE_URL', ''):
        print_warning("DATABASE_URL appears to use default credentials. Please verify your database settings.")

    print_success("Environment variables validated")

    # Step 7: Check Prisma Client
    print_status("Checking Prisma Client...")
    prisma_client_path = PROJECT_DIR / 'node_modules' / '.prisma' / 'client'

    if not prisma_client_path.exists():
        print_warning("Prisma Client not generated. Generating...")
        result = run_command('npx prisma generate')
        if result.returncode != 0:
            print_error("Failed to generate Prisma Client")
            sys.exit(1)
        print_success("Prisma Client generated")
    else:
        print_success("Prisma Client found")

    # Step 8: Database connection test and setup
    print_status("Checking database connection and setup...")
    
    db_url = env_vars.get('DATABASE_URL', '')
    db_config = parse_database_url(db_url)
    
    if not db_config:
        print_error("Failed to parse DATABASE_URL from .env file")
        print(f"Current DATABASE_URL: {db_url}")
        sys.exit(1)

    print_status(f"Database details: User={db_config['user']}, Host={db_config['host']}:{db_config['port']}, Database={db_config['database']}")

    # Build MySQL command
    mysql_cmd = f"mysql -h {db_config['host']} -P {db_config['port']} -u {db_config['user']}"
    if db_config['password']:
        mysql_cmd += f" -p{db_config['password']}"

    # Test MySQL connection
    print_status("Testing MySQL connection...")
    test_result = get_command_output(f'{mysql_cmd} -e "SELECT 1;" 2>nul' if sys.platform == 'win32' else f'{mysql_cmd} -e "SELECT 1;" 2>/dev/null')
    
    if '1' in test_result:
        print_success("MySQL connection successful")
    else:
        print_error("Failed to connect to MySQL server")
        print("Please verify:")
        print(f"  - MySQL is running")
        print(f"  - Credentials are correct: User={db_config['user']}, Host={db_config['host']}:{db_config['port']}")
        print("  - Password is correct (check .env file)")
        sys.exit(1)

    # Check if database exists
    print_status(f"Checking if database '{db_config['database']}' exists...")
    db_list = get_command_output(f'{mysql_cmd} -e "SHOW DATABASES LIKE \'{db_config["database"]}\';" 2>nul' if sys.platform == 'win32' else f'{mysql_cmd} -e "SHOW DATABASES LIKE \'{db_config["database"]}\';" 2>/dev/null')
    
    if db_config['database'] not in db_list:
        print_warning(f"Database '{db_config['database']}' does not exist. Creating database...")
        create_result = run_command(f'{mysql_cmd} -e "CREATE DATABASE `{db_config["database"]}`;"', capture_output=True)
        
        if create_result.returncode == 0:
            print_success(f"Database '{db_config['database']}' created successfully")
        else:
            print_error(f"Failed to create database '{db_config['database']}'")
            print(f"You may need to create it manually:")
            print(f'  mysql -u {db_config["user"]} -p -e "CREATE DATABASE {db_config["database"]};"')
            sys.exit(1)
    else:
        print_success(f"Database '{db_config['database']}' exists")

    # Check if tables exist
    print_status("Checking database schema...")
    tables_check = get_command_output(f'{mysql_cmd} -D {db_config["database"]} -e "SHOW TABLES;" 2>nul' if sys.platform == 'win32' else f'{mysql_cmd} -D {db_config["database"]} -e "SHOW TABLES;" 2>/dev/null')
    
    if any(table in tables_check.lower() for table in ['users', 'products', 'categories']):
        print_success("Database tables found")
    else:
        print_warning("Database tables not found. Setting up database schema...")
        result = run_command('npx prisma db push --accept-data-loss')
        if result.returncode != 0:
            print_error("Failed to push database schema")
            sys.exit(1)
        print_success("Database schema created")
        
        # Ask if user wants to seed the database
        print()
        response = input("Do you want to seed the database with initial data? (y/n): ").strip().lower()
        if response == 'y':
            print_status("Seeding database...")
            result = run_command('npm run db:seed')
            if result.returncode != 0:
                print_warning("Database seeding failed, but continuing...")
            else:
                print_success("Database seeded successfully")
                print()
                print(f"{Colors.GREEN}═══════════════════════════════════════════{Colors.NC}")
                print(f"{Colors.GREEN}  Default Admin Credentials{Colors.NC}")
                print(f"{Colors.GREEN}  Email: admin@pos.com{Colors.NC}")
                print(f"{Colors.GREEN}  Password: admin123{Colors.NC}")
                print(f"{Colors.GREEN}═══════════════════════════════════════════{Colors.NC}")
                print()

    # Step 9: Check if port 3000 is available
    print_status("Checking if port 3000 is available...")
    if is_port_in_use(3000):
        print_warning("Port 3000 is already in use")
        response = input("Do you want to kill the process using port 3000? (y/n): ").strip().lower()
        if response == 'y':
            if kill_process_on_port(3000):
                print_success("Process killed")
                time.sleep(1)  # Wait a moment for port to be released
            else:
                print_error("Failed to kill process on port 3000")
                sys.exit(1)
        else:
            print_error("Cannot start application on port 3000")
            sys.exit(1)

    # Step 10: Build check (optional, for production)
    if production_mode:
        print_status("Production mode detected. Building application...")
        result = run_command('npm run build')
        if result.returncode != 0:
            print_error("Build failed")
            sys.exit(1)
        print_success("Build completed successfully")

    # Step 11: Final checks
    print_status("Running final checks...")
    
    required_files = ['package.json', 'next.config.ts', 'tsconfig.json', 'prisma/schema.prisma']
    for file in required_files:
        if not (PROJECT_DIR / file).exists():
            print_error(f"Required file missing: {file}")
            sys.exit(1)
    print_success("All required files present")

    # Step 12: Start the application
    print()
    print(f"{Colors.GREEN}╔════════════════════════════════════════════════╗{Colors.NC}")
    print(f"{Colors.GREEN}║     All checks passed! Starting application    ║{Colors.NC}")
    print(f"{Colors.GREEN}╚════════════════════════════════════════════════╝{Colors.NC}")
    print()

    url = "http://localhost:3000"
    
    # Start browser opener in background thread
    browser_thread = threading.Thread(target=open_browser_delayed, args=(url,), daemon=True)
    browser_thread.start()

    if production_mode:
        print_status("Starting application in PRODUCTION mode...")
        print(f"{Colors.BLUE}Application will be available at: {Colors.GREEN}{url}{Colors.NC}")
        print()
        run_command('npm run start')
    else:
        print_status("Starting application in DEVELOPMENT mode...")
        print(f"{Colors.BLUE}Application will be available at: {Colors.GREEN}{url}{Colors.NC}")
        print()
        print(f"{Colors.YELLOW}Press Ctrl+C to stop the server{Colors.NC}")
        print()
        
        try:
            run_command('npm run dev')
        except KeyboardInterrupt:
            pass

    print()
    print_status("Application stopped")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        print_status("Application stopped by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"An unexpected error occurred: {e}")
        sys.exit(1)
