
# Deployment Guide

This guide covers deploying the IPTV streaming platform on a Linux server (Ubuntu 20.04 LTS or newer).

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS or Ubuntu 22.04 LTS
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps connection

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps connection

## Server Setup

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip software-properties-common -y
```

### 2. Install Node.js
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MongoDB
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 4. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 5. Install Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Application Deployment

### 1. Create Application User
```bash
sudo adduser --system --group iptv
sudo mkdir -p /var/www/iptv
sudo chown iptv:iptv /var/www/iptv
```

### 2. Clone and Setup Application
```bash
# Switch to application user
sudo su - iptv

# Clone repository
cd /var/www/iptv
git clone <repository-url> .

# Install dependencies
npm install --production

# Create necessary directories
mkdir -p public/receipts
mkdir -p public/upload
chmod 755 public/receipts
chmod 755 public/upload
```

### 3. Configure Environment
```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

### 4. Set up Database
```bash
# Connect to MongoDB and create database
mongo
use iptv_platform
db.createUser({
  user: "iptv_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "iptv_platform" }]
})
exit
```

### 5. Configure PM2
Create PM2 ecosystem file:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'iptv-platform',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/var/log/iptv/error.log',
    out_file: '/var/log/iptv/out.log',
    log_file: '/var/log/iptv/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

### 6. Create Log Directory
```bash
sudo mkdir -p /var/log/iptv
sudo chown iptv:iptv /var/log/iptv
```

### 7. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command
```

## Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/iptv-platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files
    location /static/ {
        alias /var/www/iptv/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Main application
    location / {
        limit_req zone=general burst=100 nodelay;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/iptv-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

### 1. Install Certbot
```bash
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 3. Auto-renewal
```bash
sudo systemctl status snap.certbot.renew.timer
# Certificate will auto-renew
```

## Security Configuration

### 1. Firewall Setup
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 2. MongoDB Security
```bash
sudo nano /etc/mongod.conf
```

```yaml
# Enable authentication
security:
  authorization: enabled

# Bind to localhost only
net:
  bindIp: 127.0.0.1
```

```bash
sudo systemctl restart mongod
```

### 3. Fail2Ban (Optional)
```bash
sudo apt install fail2ban -y

# Create custom configuration
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## Monitoring and Maintenance

### 1. Log Monitoring
```bash
# View application logs
pm2 logs iptv-platform

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### 2. System Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit
```

### 3. Database Backup
Create backup script:
```bash
sudo nano /usr/local/bin/backup-iptv.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/iptv"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="iptv_platform"

mkdir -p $BACKUP_DIR

# Create MongoDB backup
mongodump --db $DB_NAME --out $BACKUP_DIR/mongo_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz"
```

```bash
sudo chmod +x /usr/local/bin/backup-iptv.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-iptv.sh
```

### 4. Application Updates
```bash
# Create update script
sudo nano /usr/local/bin/update-iptv.sh
```

```bash
#!/bin/bash
cd /var/www/iptv

# Backup current version
cp -r . /var/backups/iptv/app_backup_$(date +%Y%m%d_%H%M%S)

# Pull latest changes
git pull origin main

# Install/update dependencies
npm install --production

# Restart application
pm2 restart iptv-platform

echo "Application updated successfully"
```

```bash
sudo chmod +x /usr/local/bin/update-iptv.sh
```

## Troubleshooting

### Common Issues

1. **Application won't start**
```bash
pm2 logs iptv-platform
# Check for port conflicts, missing dependencies, or configuration errors
```

2. **Database connection issues**
```bash
sudo systemctl status mongod
mongo # Test direct connection
```

3. **High memory usage**
```bash
pm2 restart iptv-platform
# Adjust max_memory_restart in ecosystem.config.js
```

4. **SSL certificate issues**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Performance Optimization

1. **Enable MongoDB indexing**
```javascript
// Connect to MongoDB and create indexes
db.devices.createIndex({ "mac_address": 1 })
db.transactions.createIndex({ "created_time": -1 })
db.playlists.createIndex({ "device_id": 1 })
```

2. **Nginx caching**
```nginx
# Add to Nginx configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **PM2 clustering**
```javascript
// In ecosystem.config.js
instances: 'max', // Use all CPU cores
exec_mode: 'cluster'
```

This deployment guide provides a complete setup for running the IPTV platform on a production Linux server with proper security, monitoring, and maintenance procedures.
