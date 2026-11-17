#!/bin/bash
set -e
cd /home/<SERVER_USER>/public_html/urban.techinpedia.com

echo "Cloning or updating repository..."
if [ ! -d ".git" ]; then
  git clone https://github.com/adityagenlko12-wq/techinpedia.git temp_dir
  mv temp_dir/* temp_dir/.* . 2>/dev/null || true
  rm -rf temp_dir
else
  git fetch origin main
  git reset --hard origin/main
fi

echo "Setting up environment..."
cp ../techinpedia.com/.env ./.env
sed -i '/NEXT_PUBLIC_SITE_CODE/d' .env
sed -i '/NEXT_PUBLIC_BUSINESS_UNIT/d' .env
sed -i '/PORT=/d' .env
echo "NEXT_PUBLIC_SITE_CODE=MARKETPLACE_PUBLIC" >> .env
echo "NEXT_PUBLIC_BUSINESS_UNIT=MARKETPLACE" >> .env
echo "PORT=3001" >> .env

echo "Installing dependencies..."
npm ci

echo "Building..."
NEXT_TELEMETRY_DISABLED=1 npx prisma generate
NEXT_TELEMETRY_DISABLED=1 npm run build

echo "Starting PM2..."
npx pm2 delete techinpedia-urban || true
npx pm2 start npm --name "techinpedia-urban" -- run start -- -p 3001
npx pm2 save

echo "Setting up Reverse Proxy in .htaccess..."
cat << 'HTACCESS' > .htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
HTACCESS

echo "Deployment Complete!"
