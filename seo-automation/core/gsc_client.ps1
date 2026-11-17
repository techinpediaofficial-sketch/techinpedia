# ==============================================================================
# TechInPedia SEO Automation - Google Search Console Client
# Timezone: Asia/Kolkata
# Scopes: https://www.googleapis.com/auth/webmasters.readonly
# Compatible with both Windows PowerShell 5.1 and PowerShell Core 7+
# ==============================================================================

. "$PSScriptRoot\logger.ps1"

function Get-GscAuthToken {
    param(
        [string]$ClientEmail = "metaleads1@techinpedia-sheets.iam.gserviceaccount.com",
        [string]$PrivateKeyPem = "",
        [string]$Scope = "https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/spreadsheets"
    )

    try {
        if (-not $PrivateKeyPem) {
            # Try loading private key from setup script or env
            $setupScript = Join-Path $PSScriptRoot "..\..\setup-google-calendar.js"
            if (Test-Path $setupScript) {
                $content = Get-Content $setupScript -Raw
                if ($content -match 'const privateKey\s*=\s*"([^"]+)"') {
                    $PrivateKeyPem = $matches[1] -replace '\\n', "`n"
                }
            }
        }

        if (-not $PrivateKeyPem) {
            Write-SeoLog "No RSA private key found for Google Service Account." -Level "WARN" -Agent "GSC_CLIENT"
            return $null
        }

        # Build JWT Header and Claim
        $nowEpoch = [int][double]::Parse((Get-Date (Get-Date).ToUniversalTime() -UFormat %s))
        $expEpoch = $nowEpoch + 3600

        $headerObj = @{ alg = "RS256"; typ = "JWT" }
        $claimObj = @{
            iss = $ClientEmail
            scope = $Scope
            aud = "https://oauth2.googleapis.com/token"
            exp = $expEpoch
            iat = $nowEpoch
        }

        function Base64UrlEncode([byte[]]$bytes) {
            return [System.Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
        }

        $headerJson = $headerObj | ConvertTo-Json -Compress
        $claimJson = $claimObj | ConvertTo-Json -Compress

        $headerEncoded = Base64UrlEncode ([System.Text.Encoding]::UTF8.GetBytes($headerJson))
        $claimEncoded = Base64UrlEncode ([System.Text.Encoding]::UTF8.GetBytes($claimJson))
        $signatureInput = "$headerEncoded.$claimEncoded"
        $signatureInputBytes = [System.Text.Encoding]::UTF8.GetBytes($signatureInput)

        # Parse PKCS8 PEM Key
        $cleanKey = $PrivateKeyPem -replace '-----BEGIN PRIVATE KEY-----', '' -replace '-----END PRIVATE KEY-----', '' -replace '\s+', ''
        $keyBytes = [System.Convert]::FromBase64String($cleanKey)

        $signatureBytes = $null

        # Try RSACng first (native in Windows PowerShell 5.1 & .NET Framework)
        try {
            $cngKey = [System.Security.Cryptography.CngKey]::Import($keyBytes, [System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
            $rsaCng = New-Object System.Security.Cryptography.RSACng($cngKey)
            $signatureBytes = $rsaCng.SignData($signatureInputBytes, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
        } catch {
            # Fallback to RSA.ImportPkcs8PrivateKey (.NET Core / pwsh 7+)
            $rsa = [System.Security.Cryptography.RSA]::Create()
            $rsa.ImportPkcs8PrivateKey($keyBytes, [ref]0)
            $signatureBytes = $rsa.SignData($signatureInputBytes, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
        }

        $signatureEncoded = Base64UrlEncode $signatureBytes
        $assertionJwt = "$signatureInput.$signatureEncoded"

        # Exchange JWT for Bearer token
        $tokenUrl = "https://oauth2.googleapis.com/token"
        $tokenBody = @{
            grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
            assertion = $assertionJwt
        }

        $tokenResp = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $tokenBody -TimeoutSec 15
        if ($tokenResp.access_token) {
            Write-SeoLog "Successfully generated Google OAuth2 Bearer token." -Level "SUCCESS" -Agent "GSC_CLIENT"
            return $tokenResp.access_token
        }
        return $null
    } catch {
        Write-SeoLog "Google OAuth2 token exchange note: $($_.Exception.Message)" -Level "WARN" -Agent "GSC_CLIENT"
        return $null
    }
}

function Query-SearchConsoleAnalytics {
    param(
        [string]$SiteUrl = "https://techinpedia.com/",
        [int]$Days = 28
    )

    $token = Get-GscAuthToken
    if (-not $token) {
        Write-SeoLog "GSC authorization is pending or private key unavailable." -Level "WARN" -Agent "GSC_CLIENT"
        return [PSCustomObject]@{
            Status = "PENDING_CREDENTIALS"
            Message = "Service account token exchange failed or credentials missing."
            Data = @()
        }
    }

    try {
        $encodedSite = [System.Uri]::EscapeDataString($SiteUrl)
        $endpoint = "https://www.googleapis.com/webmasters/v3/sites/$encodedSite/searchAnalytics/query"

        $endDate = (Get-Date).AddDays(-3).ToString("yyyy-MM-dd") # GSC data lag is ~2-3 days
        $startDate = (Get-Date).AddDays(-($Days + 3)).ToString("yyyy-MM-dd")

        $body = @{
            startDate = $startDate
            endDate = $endDate
            dimensions = @("query", "page")
            rowLimit = 150
            aggregationType = "auto"
        } | ConvertTo-Json

        $headers = @{
            Authorization = "Bearer $token"
        }

        $resp = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 20
        Write-SeoLog "Retrieved Search Console rows for $SiteUrl." -Level "SUCCESS" -Agent "GSC_CLIENT"
        return [PSCustomObject]@{
            Status = "CONNECTED"
            Rows = $resp.rows
            StartDate = $startDate
            EndDate = $endDate
        }
    } catch {
        $errMsg = $_.Exception.Message
        Write-SeoLog "GSC API returned notice: $errMsg" -Level "WARN" -Agent "GSC_CLIENT"
        
        $action = if ($errMsg -match "403" -or $errMsg -match "permission") {
            "GSC Service Account permission required: Add 'metaleads1@techinpedia-sheets.iam.gserviceaccount.com' to Google Search Console under Users & Permissions."
        } else {
            "Check Google Search Console property verification: $errMsg"
        }

        return [PSCustomObject]@{
            Status = "PENDING_AUTHORIZATION"
            ActionRequired = $action
            ServiceAccount = "metaleads1@techinpedia-sheets.iam.gserviceaccount.com"
            SiteUrl = $SiteUrl
        }
    }
}
