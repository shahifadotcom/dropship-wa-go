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

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port_process() {
    local port=$1
    echo -e "${YELLOW}Port $port is in use. Killing existing process...${NC}"
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill -9 $pid
        echo -e "${GREEN}Process $pid killed successfully${NC}"
        sleep 2
    fi
}

# Check and free main port
echo -e "${YELLOW}Checking port $MAIN_PORT...${NC}"
if check_port $MAIN_PORT; then
    kill_port_process $MAIN_PORT
fi

if check_port $MAIN_PORT; then
    echo -e "${RED}Failed to free port $MAIN_PORT. Exiting.${NC}"
    exit 1
fi

# Check and free WhatsApp port
echo -e "${YELLOW}Checking port $WHATSAPP_PORT...${NC}"
if check_port $WHATSAPP_PORT; then
    kill_port_process $WHATSAPP_PORT
fi

if check_port $WHATSAPP_PORT; then
    echo -e "${RED}Failed to free port $WHATSAPP_PORT. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}Ports $MAIN_PORT and $WHATSAPP_PORT are available${NC}"

# Install main project dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing main project dependencies...${NC}"
    npm install
fi

# Install WhatsApp bridge dependencies
if [ ! -d "whatsapp-bridge/node_modules" ]; then
    echo -e "${YELLOW}Installing WhatsApp bridge dependencies...${NC}"
    cd whatsapp-bridge
    npm install
    cd ..
fi

# Create WhatsApp bridge .env file if it doesn't exist
if [ ! -f "whatsapp-bridge/.env" ]; then
    echo -e "${YELLOW}Creating WhatsApp bridge .env file...${NC}"
    echo "PORT=$WHATSAPP_PORT" > whatsapp-bridge/.env
fi

# Build the main project
echo -e "${YELLOW}Building the main project...${NC}"
npm run build

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