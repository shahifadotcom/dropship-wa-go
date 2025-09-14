#!/bin/bash

# Ubuntu Installation Script for Shahifa E-commerce Platform
# This script installs all dependencies and sets up the project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Shahifa E-commerce Platform Installation${NC}"
echo "=========================================="

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js and npm
echo -e "${YELLOW}Installing Node.js and npm...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
echo -e "${YELLOW}Installing build essentials...${NC}"
sudo apt-get install -y build-essential

# Install Git
echo -e "${YELLOW}Installing Git...${NC}"
sudo apt-get install -y git

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
sudo apt-get install -y nginx

# Install SSL certificate tools
echo -e "${YELLOW}Installing SSL tools...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

# Install PM2 for process management
echo -e "${YELLOW}Installing PM2...${NC}"
sudo npm install -g pm2

# Install Supabase CLI
echo -e "${YELLOW}Installing Supabase CLI...${NC}"
curl -fsSL https://supabase.com/install.sh | sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# Install project dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
npm install

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Setup PM2 ecosystem
echo -e "${YELLOW}Setting up PM2 process management...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'shahifa-ecommerce',
    script: 'npm',
    args: 'run preview',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Setup Nginx configuration
echo -e "${YELLOW}Setting up Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/shahifa-ecommerce << EOF
server {
    listen 80;
    server_name 161.97.169.64;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/shahifa-ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Start the application
echo -e "${YELLOW}Starting the application...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}Installation completed successfully!${NC}"
echo ""
echo -e "${BLUE}Application Information:${NC}"
echo -e "URL: http://161.97.169.64"
echo -e "Admin Panel: http://161.97.169.64/admin"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "Start app: pm2 start shahifa-ecommerce"
echo -e "Stop app: pm2 stop shahifa-ecommerce"
echo -e "Restart app: pm2 restart shahifa-ecommerce"
echo -e "View logs: pm2 logs shahifa-ecommerce"
echo -e "Monitor: pm2 monit"
echo ""
echo -e "${YELLOW}Note: Configure SSL certificate with:${NC}"
echo -e "sudo certbot --nginx -d yourdomain.com"