#!/bin/bash

# Start script for Dropship WhatsApp Go project
# This script ensures the application runs on port 3000
# If port 3000 is in use, it kills the existing process first

PORT=3000
PROJECT_DIR=$(dirname "$0")

echo "🚀 Starting Dropship WhatsApp Go Server..."
echo "📁 Project Directory: $PROJECT_DIR"
echo "🔌 Target Port: $PORT"

# Function to check if port is in use
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1
    elif command -v ss >/dev/null 2>&1; then
        ss -tulpn | grep ":$port " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2
    else
        echo "No port checking tool available"
        return 1
    fi
}

# Function to kill process on port
kill_port_process() {
    local port=$1
    echo "🔍 Checking if port $port is in use..."
    
    local pids=$(check_port $port)
    
    if [ -n "$pids" ]; then
        echo "⚠️  Port $port is already in use by process(es): $pids"
        echo "🗡️  Killing existing process(es)..."
        
        for pid in $pids; do
            if [ -n "$pid" ] && [ "$pid" != "-" ]; then
                echo "   Killing PID: $pid"
                kill -9 $pid 2>/dev/null || sudo kill -9 $pid 2>/dev/null
                sleep 1
            fi
        done
        
        # Double check if port is free now
        sleep 2
        local remaining_pids=$(check_port $port)
        if [ -n "$remaining_pids" ]; then
            echo "❌ Failed to kill all processes on port $port"
            echo "   Remaining PIDs: $remaining_pids"
            echo "   You may need to kill them manually or use sudo"
            exit 1
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is available"
    fi
}

# Function to check dependencies
check_dependencies() {
    echo "🔧 Checking dependencies..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ Node.js $(node --version) and npm $(npm --version) are available"
}

# Function to install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install dependencies"
            exit 1
        fi
    else
        echo "✅ Dependencies already installed"
    fi
}

# Function to start the development server
start_server() {
    echo "🏗️  Building and starting the development server..."
    echo "🌐 Server will be available at: http://localhost:$PORT"
    echo "🌐 External access at: http://161.97.169.64:$PORT"
    echo ""
    echo "📊 Server logs:"
    echo "=================================================================================="
    
    # Set the port environment variable
    export PORT=$PORT
    export VITE_PORT=$PORT
    
    # Start the development server
    npm run dev -- --port $PORT --host 0.0.0.0
}

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping server..."
    # Kill any remaining processes on our port
    local pids=$(check_port $PORT)
    if [ -n "$pids" ]; then
        for pid in $pids; do
            if [ -n "$pid" ] && [ "$pid" != "-" ]; then
                kill -9 $pid 2>/dev/null
            fi
        done
    fi
    echo "✅ Server stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    cd "$PROJECT_DIR"
    
    echo "🎯 Dropship WhatsApp Go - Development Server Starter"
    echo "======================================================"
    
    check_dependencies
    kill_port_process $PORT
    install_dependencies
    
    echo ""
    echo "🎉 Starting server... Press Ctrl+C to stop"
    echo ""
    
    start_server
}

# Run main function
main "$@"