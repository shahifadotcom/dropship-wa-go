#!/bin/bash

# E-commerce Dropshipping Platform - Auto Installation Script
# For Ubuntu Server 20.04/22.04 LTS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    error "Please do not run this script as root. Use a sudo-enabled user instead."
    exit 1
fi

log "E-commerce Dropshipping Platform Installation Starting..."

# Update system
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
log "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    vim

# Install Node.js 18
log "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
log "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
log "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Supabase CLI
log "Installing Supabase CLI..."
npm install -g supabase

# Create project directory
PROJECT_DIR="/var/www/ecommerce-platform"
log "Creating project directory at $PROJECT_DIR..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone project (assuming it's in Git)
log "Setting up project..."
cd $PROJECT_DIR

# If project is from GitHub, uncomment and modify:
# git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Create environment file
log "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ecommerce_db"
POSTGRES_PASSWORD="your_secure_password"

# Supabase Configuration
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Application Configuration
NODE_ENV="production"
PORT=3000
DOMAIN="your-domain.com"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# WhatsApp Configuration (optional)
WHATSAPP_API_KEY="your_whatsapp_api_key"

# Payment Gateway Configuration (optional)
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
EOF

log "Environment file created. Please edit .env with your actual configuration values."

# Install project dependencies
if [ -f "package.json" ]; then
    log "Installing project dependencies..."
    npm install
else
    log "No package.json found. Please add your project files first."
fi

# Setup PostgreSQL
log "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ecommerce_db;" || warn "Database might already exist"
sudo -u postgres psql -c "CREATE USER ecommerce WITH PASSWORD 'your_secure_password';" || warn "User might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce;" || warn "Privileges might already be granted"

# Setup Supabase locally
log "Setting up local Supabase..."
cd $PROJECT_DIR
supabase init || warn "Supabase already initialized"

# Create Supabase configuration
cat > supabase/config.toml << EOF
project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54324
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://your-domain.com"]
jwt_expiry = 3600
jwt_secret = "your-jwt-secret"

[db]
port = 54322
shadow_port = 54320
max_connections = 100

[studio]
enabled = true
port = 54323

[storage]
enabled = true
port = 54325
image_transformation = true

[edge_functions]
enabled = true
port = 54326

[analytics]
enabled = false
port = 54327
vector_port = 54328
EOF

# Setup Nginx
log "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ecommerce-platform << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration will be added by Certbot
    
    # Frontend
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
    
    # Supabase API
    location /supabase/ {
        proxy_pass http://localhost:54321/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /static/ {
        alias $PROJECT_DIR/dist/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/ecommerce-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Setup firewall
log "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # For development
sudo ufw reload

# Setup systemd service for the application
log "Creating systemd service..."
sudo tee /etc/systemd/system/ecommerce-platform.service << EOF
[Unit]
Description=E-commerce Dropshipping Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Setup systemd service for Supabase
sudo tee /etc/systemd/system/supabase-local.service << EOF
[Unit]
Description=Supabase Local Development
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/local/bin/supabase start
ExecStop=/usr/local/bin/supabase stop
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable ecommerce-platform.service
sudo systemctl enable supabase-local.service

# Setup log rotation
log "Setting up log rotation..."
sudo tee /etc/logrotate.d/ecommerce-platform << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload ecommerce-platform.service
    endscript
}
EOF

# Create logs directory
mkdir -p $PROJECT_DIR/logs

# Setup backup script
log "Creating backup script..."
sudo tee /usr/local/bin/backup-ecommerce.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/ecommerce"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U ecommerce ecommerce_db > \$BACKUP_DIR/database_\$DATE.sql

# Backup application files
tar -czf \$BACKUP_DIR/application_\$DATE.tar.gz -C $PROJECT_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-ecommerce.sh

# Setup cron job for backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-ecommerce.sh") | crontab -

# Create admin user setup script
cat > $PROJECT_DIR/setup-admin.js << EOF
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
        console.log('Usage: node setup-admin.js <email> <password>');
        process.exit(1);
    }
    
    try {
        // Create user
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });
        
        if (userError) throw userError;
        
        // Assign admin role
        const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.user.id, role: 'admin' });
            
        if (roleError) throw roleError;
        
        console.log('Admin user created successfully:', email);
    } catch (error) {
        console.error('Error creating admin user:', error.message);
    }
}

createAdminUser();
EOF

log "Installation completed!"
echo ""
echo "=============================================="
echo "  E-commerce Platform Installation Complete  "
echo "=============================================="
echo ""
log "Next steps:"
echo "1. Edit $PROJECT_DIR/.env with your configuration"
echo "2. Update Nginx configuration with your domain:"
echo "   sudo nano /etc/nginx/sites-available/ecommerce-platform"
echo "3. Get SSL certificate:"
echo "   sudo certbot --nginx -d your-domain.com"
echo "4. Start Supabase:"
echo "   cd $PROJECT_DIR && supabase start"
echo "5. Run database migrations:"
echo "   cd $PROJECT_DIR && supabase db push"
echo "6. Create admin user:"
echo "   node setup-admin.js admin@example.com your-password"
echo "7. Start the application:"
echo "   sudo systemctl start ecommerce-platform.service"
echo "8. Start Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
log "Your e-commerce platform will be available at:"
log "- Frontend: https://your-domain.com"
log "- Admin: https://your-domain.com/admin"
log "- Supabase Studio: http://localhost:54323"
echo ""
warn "Remember to:"
warn "- Change default passwords in .env"
warn "- Configure your domain in Nginx"
warn "- Set up SSL with Certbot"
warn "- Configure payment gateways"
warn "- Set up email SMTP"
warn "- Configure WhatsApp API"
echo ""
log "Installation log saved to: /var/log/ecommerce-install.log"
log "Backup script scheduled to run daily at 2 AM"

# Save installation info
sudo tee /var/log/ecommerce-install.log << EOF
E-commerce Platform Installation Completed
Date: $(date)
Project Directory: $PROJECT_DIR
User: $USER
Domain: your-domain.com (update in Nginx config)
Services:
- ecommerce-platform.service
- supabase-local.service
- nginx
- postgresql
- redis-server

Configuration Files:
- Application: $PROJECT_DIR/.env
- Nginx: /etc/nginx/sites-available/ecommerce-platform
- Supabase: $PROJECT_DIR/supabase/config.toml

Scripts:
- Backup: /usr/local/bin/backup-ecommerce.sh
- Admin Setup: $PROJECT_DIR/setup-admin.js

Logs:
- Application: $PROJECT_DIR/logs/
- Nginx: /var/log/nginx/
- System: journalctl -u ecommerce-platform.service
EOF

log "Installation completed successfully!"