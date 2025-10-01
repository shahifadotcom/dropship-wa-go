#!/bin/bash

# WhatsApp Bridge Server Startup Script
# Automatically handles port management and server startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

WHATSAPP_PORT=3001

echo -e "${BLUE}Starting WhatsApp Bridge Server...${NC}"
echo "=================================================================="

# Function to check if port is in use
check_port() {
    local port=$1
    
    # Try lsof first
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        fi
    # Fallback to netstat
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    # Fallback to ss
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi
    
    return 1
}

# Function to get PIDs using port
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
    
    if ! check_port $port; then
        echo -e "${GREEN}✓ Port $port is now free${NC}"
    fi
}

# Check requirements
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node -v)${NC}"

# Check and free WhatsApp port
echo ""
echo -e "${YELLOW}Checking port $WHATSAPP_PORT...${NC}"
if check_port $WHATSAPP_PORT; then
    kill_port_process $WHATSAPP_PORT
else
    echo -e "${GREEN}✓ Port $WHATSAPP_PORT is available${NC}"
fi

# Final verification
if check_port $WHATSAPP_PORT; then
    echo -e "${YELLOW}Trying once more to free port...${NC}"
    sleep 2
    kill_port_process $WHATSAPP_PORT
    
    if check_port $WHATSAPP_PORT; then
        echo -e "${RED}CRITICAL: Cannot free port $WHATSAPP_PORT${NC}"
        echo -e "${YELLOW}Run manually: lsof -ti:$WHATSAPP_PORT | xargs kill -9${NC}"
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install || {
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}Creating .env file...${NC}"
    echo "PORT=$WHATSAPP_PORT" > .env
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

echo ""
echo -e "${GREEN}✅ Port $WHATSAPP_PORT is ready${NC}"
echo ""
echo -e "${BLUE}Starting WhatsApp Bridge Server...${NC}"
echo -e "${BLUE}Server will be available at: http://localhost:$WHATSAPP_PORT${NC}"
echo -e "${BLUE}WebSocket available at: ws://localhost:$WHATSAPP_PORT${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server
npm start
