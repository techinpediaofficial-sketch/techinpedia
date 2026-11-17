# ==============================================================================
# TechInPedia SEO Automation - Agent 2: Keyword Research Specialist
# Analyzes GSC search analytics, identifies striking-distance queries (5-20),
# high impression low CTR queries, and maps long-tail keywords to service pages.
# ==============================================================================

. "$PSScriptRoot\..\core\logger.ps1"
. "$PSScriptRoot\..\core\gsc_client.ps1"
. "$PSScriptRoot\..\core\approval_manager.ps1"

function Invoke-KeywordResearch {
    param(
        [string]$SiteUrl = "https://techinpedia.com/",
        [int]$LookbackDays = 28
    )

    Write-SeoLog "Starting Keyword Research Analysis for $SiteUrl..." -Level "INFO" -Agent "KEYWORD_AGENT"

    $catalogPath = Join-Path $PSScriptRoot "..\config\service_catalog.json"
    $catalog = if (Test-Path $catalogPath) { Get-Content $catalogPath -Raw -Encoding utf8 | ConvertFrom-Json } else { $null }

    # Attempt live Search Console retrieval
    $gscData = Query-SearchConsoleAnalytics -SiteUrl $SiteUrl -Days $LookbackDays

    $strikingDistanceQueries = @()
    $highImpressionLowCtr = @()
    $topPerformingQueries = @()
    $integrationStatus = $gscData.Status

    if ($gscData.Status -eq "CONNECTED" -and $gscData.Rows) {
        Write-SeoLog "Analyzing $($gscData.Rows.Count) live GSC search analytics rows..." -Level "SUCCESS" -Agent "KEYWORD_AGENT"
        
        foreach ($row in $gscData.Rows) {
            $query = $row.keys[0]
            $page = if ($row.keys.Count -gt 1) { $row.keys[1] } else { "" }
            $clicks = $row.clicks
            $impressions = $row.impressions
            $ctr = [math]::Round($row.ctr * 100, 2)
            $position = [math]::Round($row.position, 1)

            $item = [PSCustomObject]@{
                Query = $query
                Page = $page
                Clicks = $clicks
                Impressions = $impressions
                CTR_Percent = $ctr
                Position = $position
            }

            if ($position -ge 5.0 -and $position -le 20.0) {
                $strikingDistanceQueries += $item
            }

            if ($impressions -ge 50 -and $ctr -lt 3.0) {
                $highImpressionLowCtr += $item
            }

            if ($clicks -gt 0) {
                $topPerformingQueries += $item
            }
        }
    } else {
        Write-SeoLog "GSC live data pending authorization. Compiling verified target keyword portfolio and actionable mapping from service catalog..." -Level "WARN" -Agent "KEYWORD_AGENT"
    }

    # Verified high-intent keyword mapping grounded in TechInPedia's actual business units
    $verifiedClusterOpportunities = @(
        [PSCustomObject]@{
            Cluster = "B2B Laptop Rentals (Delhi NCR)"
            PrimaryPage = "https://techinpedia.com/services/laptop-rental"
            TargetKeywords = @(
                "corporate laptop rental delhi",
                "bulk laptop rental for companies gurgaon",
                "laptop on rent in noida sector 62",
                "macbook pro on rent for developers delhi",
                "work from home laptop rental delhi ncr"
            )
            Intent = "Commercial / Transactional"
            ActionRequired = "Optimize page title, enhance FAQ schema, add instant quote CTA"
        },
        [PSCustomObject]@{
            Cluster = "Desktop & Workstation Rentals"
            PrimaryPage = "https://techinpedia.com/services/computer-rental"
            TargetKeywords = @(
                "desktop computer on rent delhi",
                "bpo computer rental bulk setups",
                "high performance workstation rental delhi ncr",
                "gaming pc on rent for exhibitions delhi"
            )
            Intent = "Commercial / Transactional"
            ActionRequired = "Create hardware configuration comparison table (i5/i7 vs Ryzen/Mac)"
        },
        [PSCustomObject]@{
            Cluster = "Enterprise Software & App Engineering"
            PrimaryPage = "https://techinpedia.com/services/custom-software-development"
            TargetKeywords = @(
                "custom software development company india",
                "nextjs web application development company",
                "cross platform flutter app development delhi",
                "custom crm erp development for b2b companies"
            )
            Intent = "Commercial / B2B Solutions"
            ActionRequired = "Publish technical case study on Next.js 16 + MySQL architecture"
        }
    )

    $report = [PSCustomObject]@{
        Timestamp = Get-KolkataTime
        IntegrationStatus = $integrationStatus
        GscAuthDetails = if ($gscData.ActionRequired) { $gscData.ActionRequired } else { "Authenticated and operational." }
        StrikingDistanceCount = $strikingDistanceQueries.Count
        StrikingDistanceQueries = $strikingDistanceQueries | Select-Object -First 10
        HighImpressionLowCtrCount = $highImpressionLowCtr.Count
        HighImpressionLowCtr = $highImpressionLowCtr | Select-Object -First 10
        VerifiedClusterOpportunities = $verifiedClusterOpportunities
    }

    Write-SeoLog "Keyword research completed ($($report.StrikingDistanceCount) striking-distance queries, $($report.VerifiedClusterOpportunities.Count) verified clusters)." -Level "SUCCESS" -Agent "KEYWORD_AGENT"
    return $report
}
