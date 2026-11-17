#!/bin/bash
set -e

# Deployment script to sync code and restart services on remote server
# Usage: ./scripts/deploy_to_server.sh

SSH_USER="hellomam"
SSH_HOST="66.116.199.2"
SSH_PORT="22"

# Base paths
REMOTE_COMPANY="/home/hellomam/public_html/techinpedia.com"
REMOTE_URBAN="/home/hellomam/public_html/urban.techinpedia.com"
REMOTE_ADMIN="/home/hellomam/public_html/admin.techinpedia.com"

echo "======================================"
echo " Starting Fast Deployment..."
echo " Target Host: $SSH_HOST"
echo "======================================"

# Ensure sshpass is no longer used for security reasons

deploy_site() {
    local SITE_NAME=$1
    local REMOTE_DIR=$2
    local PM2_PROCESS=$3

    echo ""
    echo ">>> Deploying $SITE_NAME to $REMOTE_DIR"
    
    echo "Building Next.js locally (skipping DB checks to prevent build crash)..."
    npm ci
    SKIP_DB_ON_BUILD=1 NEXT_TELEMETRY_DISABLED=1 npm run build
    
    echo "Syncing files via rsync (including .next build)..."
    rsync -avz -e "ssh -o StrictHostKeyChecking=no -p $SSH_PORT" \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude '.env*' \
      ./ $SSH_USER@$SSH_HOST:$REMOTE_DIR/

    echo "Running remote start..."
    ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SSH_USER@$SSH_HOST << INNER_EOF
        set -e
        cd $REMOTE_DIR
        
        echo "Installing production dependencies..."
        npm ci --prefer-offline

        echo "Generating Prisma client..."
        NEXT_TELEMETRY_DISABLED=1 npx prisma generate

        echo "Restarting PM2 process ($PM2_PROCESS)..."
        npx pm2 restart $PM2_PROCESS || npx pm2 start npm --name "$PM2_PROCESS" -- run start -- -p \$(grep PORT .env | cut -d '=' -f2)
        npx pm2 save
INNER_EOF
    echo ">>> $SITE_NAME deployed successfully."
}

# Only deploy Company for now to save time
deploy_site "TechInPedia Company" "$REMOTE_COMPANY" "techinpedia"

echo ""
echo "======================================"
echo " Deployment Complete!"
echo "======================================"
