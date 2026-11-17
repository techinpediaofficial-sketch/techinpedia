# ==============================================================================
# TechInPedia SEO Automation - Telegram Bot Client
# Dispatches alerts, approval notices, and daily reports
# ==============================================================================

. "$PSScriptRoot\logger.ps1"

function Send-TelegramNotification {
    param(
        [Parameter(Mandatory=$true)][string]$Message,
        [string]$ParseMode = "HTML",
        [switch]$DryRun
    )

    $botToken = $env:TELEGRAM_BOT_TOKEN
    $chatId = $env:TELEGRAM_CHAT_ID

    # If env vars not set, check .env file
    if (-not $botToken -or -not $chatId) {
        $envPath = Join-Path $PSScriptRoot "..\..\.env"
        $seoEnvPath = Join-Path $PSScriptRoot "..\config\.env"
        
        $targetEnv = if (Test-Path $seoEnvPath) { $seoEnvPath } elseif (Test-Path $envPath) { $envPath } else { $null }
        if ($targetEnv) {
            Get-Content $targetEnv | ForEach-Object {
                if ($_ -match '^\s*TELEGRAM_BOT_TOKEN\s*=\s*["'']?([^"'']+)["'']?') { $botToken = $matches[1] }
                if ($_ -match '^\s*TELEGRAM_CHAT_ID\s*=\s*["'']?([^"'']+)["'']?') { $chatId = $matches[1] }
            }
        }
    }

    if ($DryRun -or -not $botToken -or -not $chatId -or $botToken -eq "your_telegram_bot_token_here") {
        Write-SeoLog "Telegram credentials not set or DryRun enabled. Simulating message dispatch..." -Level "INFO" -Agent "TELEGRAM"
        
        $dryRunDir = Join-Path $PSScriptRoot "..\logs\telegram_outbox"
        if (-not (Test-Path $dryRunDir)) { New-Item -ItemType Directory -Force -Path $dryRunDir | Out-Null }
        $now = Get-KolkataTime
        $outboxPath = Join-Path $dryRunDir "$($now.ToString('yyyyMMdd-HHmmss'))-outbox.html"
        Set-Content -Path $outboxPath -Value $Message -Encoding utf8
        Write-SeoLog "Simulated Telegram message saved to: $outboxPath" -Level "SUCCESS" -Agent "TELEGRAM"
        return [PSCustomObject]@{
            Success = $true
            Mode = "SIMULATED"
            OutboxFile = $outboxPath
            Timestamp = $now
        }
    }

    try {
        $url = "https://api.telegram.org/bot$botToken/sendMessage"
        $body = @{
            chat_id = $chatId
            text = $Message
            parse_mode = $ParseMode
            disable_web_page_preview = $false
        } | ConvertTo-Json -Compress

        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 15
        if ($response.ok) {
            Write-SeoLog "Telegram notification successfully sent (Message ID: $($response.result.message_id))." -Level "SUCCESS" -Agent "TELEGRAM"
            return [PSCustomObject]@{
                Success = $true
                Mode = "LIVE"
                MessageId = $response.result.message_id
                Timestamp = Get-KolkataTime
            }
        } else {
            Write-SeoLog "Telegram API error: $($response.description)" -Level "ERROR" -Agent "TELEGRAM"
            return [PSCustomObject]@{ Success = $false; Error = $response.description }
        }
    } catch {
        Write-SeoLog "Failed to dispatch Telegram message: $_" -Level "ERROR" -Agent "TELEGRAM"
        return [PSCustomObject]@{ Success = $false; Error = $_.Exception.Message }
    }
}
