#!/bin/bash

# Shahifa E-commerce Platform Startup Script
# Automatically handles port management and server startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MAIN_PORT=3000
WHATSAPP_PORT=3001
PROJECT_NAME="shahifa-ecommerce"
WHATSAPP_PROJECT_NAME="whatsapp-bridge"

echo -e "${BLUE}Starting Shahifa E-commerce Platform with WhatsApp Integration...${NC}"
echo "=================================================================="

# Function to check if required commands exist
check_requirements() {
    local missing=0
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ npm found: $(npm -v)${NC}"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "${RED}Please install missing requirements and try again${NC}"
        exit 1
    fi
}

# Function to check if port is in use (multiple methods for compatibility)
check_port() {
    local port=$1
    
    # Try lsof first (most reliable)
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        fi
    # Fallback to netstat
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    # Fallback to ss (Linux)
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi
    
    return 1
}

# Function to get PIDs using a port
get_port_pids() {
    local port=$1
    
    if command -v lsof &> /dev/null; then
        lsof -ti:$port 2>/dev/null || echo ""
    elif command -v fuser &> /dev/null; then
        fuser $port/tcp 2>/dev/null | tr -s ' ' '\n' || echo ""
    else
        echo ""
    fi
}

# Function to kill process on port
kill_port_process() {
    local port=$1
    echo -e "${YELLOW}Port $port is in use. Killing existing process...${NC}"
    
    local pids=$(get_port_pids $port)
    
    if [ -z "$pids" ]; then
        echo -e "${YELLOW}No PID found for port $port, but port appears in use${NC}"
        echo -e "${YELLOW}Attempting alternative kill methods...${NC}"
        
        # Try fuser as last resort
        if command -v fuser &> /dev/null; then
            fuser -k $port/tcp 2>/dev/null || true
            sleep 2
        fi
    else
        echo -e "${YELLOW}Found PIDs using port $port: $pids${NC}"
        for pid in $pids; do
            if [ ! -z "$pid" ]; then
                echo -e "${YELLOW}Killing process $pid...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
        done
        sleep 2
    fi
    
    # Verify port is now free
    if check_port $port; then
        echo -e "${RED}Warning: Port $port still appears to be in use${NC}"
        sleep 3
        # Try one more time
        local pids_again=$(get_port_pids $port)
        if [ ! -z "$pids_again" ]; then
            for pid in $pids_again; do
                kill -9 $pid 2>/dev/null || true
            done
            sleep 2
        fi
    else
        echo -e "${GREEN}✓ Port $port is now free${NC}"
    fi
}

# Check system requirements
echo ""
check_requirements
echo ""

# Check and free main port
echo -e "${YELLOW}Checking port $MAIN_PORT...${NC}"
if check_port $MAIN_PORT; then
    kill_port_process $MAIN_PORT
else
    echo -e "${GREEN}✓ Port $MAIN_PORT is available${NC}"
fi

# Final verification for main port
if check_port $MAIN_PORT; then
    echo -e "${RED}❌ Failed to free port $MAIN_PORT${NC}"
    echo -e "${YELLOW}Trying one more time...${NC}"
    sleep 2
    kill_port_process $MAIN_PORT
    
    if check_port $MAIN_PORT; then
        echo -e "${RED}CRITICAL: Cannot free port $MAIN_PORT. Please check manually.${NC}"
        echo -e "${YELLOW}Run: lsof -ti:$MAIN_PORT | xargs kill -9${NC}"
        exit 1
    fi
fi

# Check and free WhatsApp port
echo -e "${YELLOW}Checking port $WHATSAPP_PORT...${NC}"
if check_port $WHATSAPP_PORT; then
    kill_port_process $WHATSAPP_PORT
else
    echo -e "${GREEN}✓ Port $WHATSAPP_PORT is available${NC}"
fi

# Final verification for WhatsApp port
if check_port $WHATSAPP_PORT; then
    echo -e "${RED}❌ Failed to free port $WHATSAPP_PORT${NC}"
    echo -e "${YELLOW}Trying one more time...${NC}"
    sleep 2
    kill_port_process $WHATSAPP_PORT
    
    if check_port $WHATSAPP_PORT; then
        echo -e "${RED}CRITICAL: Cannot free port $WHATSAPP_PORT. Please check manually.${NC}"
        echo -e "${YELLOW}Run: lsof -ti:$WHATSAPP_PORT | xargs kill -9${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ All ports ($MAIN_PORT, $WHATSAPP_PORT) are available${NC}"
echo ""

# Install main project dependencies
echo -e "${YELLOW}Checking main project dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing main project dependencies...${NC}"
    npm install || {
        echo -e "${RED}Failed to install main project dependencies${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Main dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Main dependencies already installed${NC}"
fi

# Install WhatsApp bridge dependencies
echo -e "${YELLOW}Checking WhatsApp bridge dependencies...${NC}"
if [ ! -d "whatsapp-bridge/node_modules" ]; then
    echo -e "${YELLOW}Installing WhatsApp bridge dependencies...${NC}"
    cd whatsapp-bridge
    npm install || {
        echo -e "${RED}Failed to install WhatsApp bridge dependencies${NC}"
        exit 1
    }
    cd ..
    echo -e "${GREEN}✓ WhatsApp bridge dependencies installed${NC}"
else
    echo -e "${GREEN}✓ WhatsApp bridge dependencies already installed${NC}"
fi

# Create WhatsApp bridge .env file if it doesn't exist
if [ ! -f "whatsapp-bridge/.env" ]; then
    echo -e "${YELLOW}Creating WhatsApp bridge .env file...${NC}"
    echo "PORT=$WHATSAPP_PORT" > whatsapp-bridge/.env
    echo -e "${GREEN}✓ Created .env file for WhatsApp bridge${NC}"
fi

# Build the main project
echo ""
echo -e "${YELLOW}Building the main project...${NC}"
npm run build || {
    echo -e "${RED}Failed to build main project${NC}"
    exit 1
}
echo -e "${GREEN}✓ Main project built successfully${NC}"
echo ""

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Using PM2 for process management...${NC}"
    
    # Stop existing PM2 processes if running
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    pm2 stop $WHATSAPP_PROJECT_NAME 2>/dev/null || true
    pm2 delete $WHATSAPP_PROJECT_NAME 2>/dev/null || true
    
    # Create PM2 ecosystem file for both applications
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '$PROJECT_NAME',
      script: 'npm',
      args: 'run preview -- --port $MAIN_PORT --host 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: $MAIN_PORT
      }
    },
    {
      name: '$WHATSAPP_PROJECT_NAME',
      script: 'npm',
      args: 'start',
      cwd: './whatsapp-bridge',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: $WHATSAPP_PORT
      }
    }
  ]
}
EOF
    
    # Start both applications with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
echo -e "${GREEN}Both applications started with PM2!${NC}"
    echo -e "${BLUE}Main Application: http://161.97.169.64:$MAIN_PORT${NC}"
    echo -e "${BLUE}Admin Panel: http://161.97.169.64:$MAIN_PORT/admin/whatsapp${NC}"
    echo -e "${BLUE}WhatsApp Bridge: http://161.97.169.64:$WHATSAPP_PORT${NC}"
    echo ""
    echo -e "${GREEN}🎉 WhatsApp Integration Ready!${NC}"
    echo -e "${YELLOW}To connect WhatsApp:${NC}"
    echo -e "1. Visit the Admin Panel link above"
    echo -e "2. Click 'Initialize WhatsApp'"
    echo -e "3. Scan the QR code with your mobile device"
    echo ""
    echo -e "${YELLOW}PM2 Commands:${NC}"
    echo -e "View all logs: pm2 logs"
    echo -e "View main app logs: pm2 logs $PROJECT_NAME"
    echo -e "View WhatsApp logs: pm2 logs $WHATSAPP_PROJECT_NAME"
    echo -e "Monitor: pm2 monit"
    echo -e "Stop all: pm2 stop all"
    echo -e "Restart all: pm2 restart all"
    
else
    echo -e "${YELLOW}PM2 not found. Starting with npm...${NC}"
    echo -e "${BLUE}Main Application: http://161.97.169.64:$MAIN_PORT${NC}"
    echo -e "${BLUE}Admin Panel: http://161.97.169.64:$MAIN_PORT/admin/whatsapp${NC}"
    echo -e "${BLUE}WhatsApp Bridge: http://161.97.169.64:$WHATSAPP_PORT${NC}"
    echo ""
    echo -e "${YELLOW}Starting WhatsApp bridge server in background...${NC}"
    
    # Start WhatsApp bridge server in background
    cd whatsapp-bridge
    npm start &
    WHATSAPP_PID=$!
    cd ..
    
    echo -e "${GREEN}WhatsApp bridge started with PID: $WHATSAPP_PID${NC}"
    echo -e "${YELLOW}Starting main application...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    
    # Function to cleanup on exit
    cleanup() {
        echo -e "\n${YELLOW}Stopping servers...${NC}"
        kill $WHATSAPP_PID 2>/dev/null || true
        exit 0
    }
    
    # Set trap to cleanup on exit
    trap cleanup SIGINT SIGTERM
    
    # Start the main application
    npm run preview -- --port $MAIN_PORT --host 0.0.0.0
fi