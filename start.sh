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

PORT=3000
PROJECT_NAME="shahifa-ecommerce"

echo -e "${BLUE}Starting Shahifa E-commerce Platform...${NC}"
echo "======================================"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port_process() {
    echo -e "${YELLOW}Port $PORT is in use. Killing existing process...${NC}"
    local pid=$(lsof -ti:$PORT)
    if [ ! -z "$pid" ]; then
        kill -9 $pid
        echo -e "${GREEN}Process $pid killed successfully${NC}"
        sleep 2
    fi
}

# Check if port 3000 is in use and kill if necessary
if check_port; then
    kill_port_process
fi

# Verify port is now free
if check_port; then
    echo -e "${RED}Failed to free port $PORT. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}Port $PORT is available${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Using PM2 for process management...${NC}"
    
    # Stop existing PM2 process if running
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'run preview -- --port $PORT --host 0.0.0.0',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    }
  }]
}
EOF
    
    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    echo -e "${GREEN}Application started with PM2!${NC}"
    echo -e "${BLUE}Access your application at: http://161.97.169.64:$PORT${NC}"
    echo -e "${BLUE}Admin Panel: http://161.97.169.64:$PORT/admin${NC}"
    echo ""
    echo -e "${YELLOW}PM2 Commands:${NC}"
    echo -e "View logs: pm2 logs $PROJECT_NAME"
    echo -e "Monitor: pm2 monit"
    echo -e "Stop: pm2 stop $PROJECT_NAME"
    echo -e "Restart: pm2 restart $PROJECT_NAME"
    
else
    echo -e "${YELLOW}PM2 not found. Starting with npm...${NC}"
    echo -e "${BLUE}Application will start on: http://161.97.169.64:$PORT${NC}"
    echo -e "${BLUE}Admin Panel: http://161.97.169.64:$PORT/admin${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    
    # Start the development server
    npm run preview -- --port $PORT --host 0.0.0.0
fi