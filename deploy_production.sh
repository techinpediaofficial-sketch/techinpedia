#!/bin/bash
set -e

REPO_URL="https://github.com/adityagenlko12-wq/techinpedia.git"
BRANCH="main"

echo "Deploying techinpedia.com..."
cd /home/hellomam/public_html/techinpedia.com
if [ ! -d ".git" ]; then
  git clone $REPO_URL temp_dir
  mv temp_dir/* temp_dir/.* . 2>/dev/null || true
  rm -rf temp_dir
else
  git remote add origin $REPO_URL 2>/dev/null || git remote set-url origin $REPO_URL
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
fi
npm ci
npx prisma generate
npx prisma migrate deploy
NEXT_TELEMETRY_DISABLED=1 npm run build
npx pm2 restart techinpedia

echo "Deploying admin.techinpedia.com..."
cd /home/hellomam/public_html/admin.techinpedia.com
if [ ! -d ".git" ]; then
  git clone $REPO_URL temp_dir
  mv temp_dir/* temp_dir/.* . 2>/dev/null || true
  rm -rf temp_dir
else
  git remote add origin $REPO_URL 2>/dev/null || git remote set-url origin $REPO_URL
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
fi
npm ci
npx prisma generate
NEXT_TELEMETRY_DISABLED=1 npm run build
npx pm2 restart techinpedia-admin

echo "Deployment completed successfully!"
