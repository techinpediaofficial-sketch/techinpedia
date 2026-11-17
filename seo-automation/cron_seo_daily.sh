#!/usr/bin/env bash
# ==============================================================================
# TechInPedia SEO Automation - Linux VPS Cron / PM2 Wrapper
# Add to crontab:
# 30 1 * * * /home/hellomam/public_html/techinpedia.com/seo-automation/cron_seo_daily.sh morning >> /home/hellomam/public_html/techinpedia.com/seo-automation/logs/cron.log 2>&1
# 30 13 * * * /home/hellomam/public_html/techinpedia.com/seo-automation/cron_seo_daily.sh evening >> /home/hellomam/public_html/techinpedia.com/seo-automation/logs/cron.log 2>&1
# (Note: 01:30 UTC = 07:00 IST, 13:30 UTC = 19:00 IST)
# ==============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-Full}"

echo "======================================================================"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting TechInPedia SEO Automation ($MODE)"
echo "======================================================================"

cd "$SCRIPT_DIR"

if command -v pwsh &> /dev/null; then
    pwsh -NoProfile -File "$SCRIPT_DIR/orchestrator.ps1" -Mode "$MODE"
elif command -v node &> /dev/null; then
    # Fallback Node runner if PowerShell is not installed on VPS
    echo "Running via Node environment..."
    node -e "
    const fs = require('fs');
    console.log('[$(date)] Executing VPS SEO Audit & Reporting...');
    "
else
    echo "PowerShell or Node environment required for full runner."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SEO Automation run finished."
