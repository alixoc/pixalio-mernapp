#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# Print versions
echo "Installed Versions:"
node -v
npm -v
pm2 -v
nginx -v

echo "------------------------------------------------"
echo "Setup Complete! Your VPS is ready."
echo "1. Upload your code or git clone it here."
echo "2. Run 'npm install && npm run build'."
echo "3. Start with 'pm2 start ecosystem.config.js --env production'."
echo "------------------------------------------------"
