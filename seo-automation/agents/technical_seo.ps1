# ==============================================================================
# TechInPedia SEO Automation - Agent 1: Technical SEO
# Audits crawlability, status codes, titles, descriptions, canonicals, schema & prepares safe fixes
# ==============================================================================

. "$PSScriptRoot\..\core\logger.ps1"
. "$PSScriptRoot\..\core\approval_manager.ps1"
. "$PSScriptRoot\..\core\pagespeed_client.ps1"

function Invoke-TechnicalSeoAudit {
    param(
        [string]$BaseUrl = "https://techinpedia.com",
        [switch]$PrepareFixes
    )

    Write-SeoLog "Starting Technical SEO Audit on $BaseUrl..." -Level "INFO" -Agent "TECH_SEO"

    $endpoints = @(
        "/",
        "/services",
        "/services/laptop-rental",
        "/services/computer-rental",
        "/services/macbook-rental",
        "/services/mobile-application",
        "/services/website-development",
        "/services/custom-software-development",
        "/services/digital-marketing",
        "/laptop-on-rent/delhi",
        "/laptop-on-rent/noida",
        "/laptop-on-rent/gurgaon",
        "/desktop-on-rent/delhi",
        "/blog",
        "/blog/best-tech-stack-ecommerce-app-2026",
        "/blog/react-native-vs-flutter-android-ios-2026",
        "/about",
        "/contact"
    )

    $crawlResults = @()
    $issuesFound = @()

    # 1. Robots.txt and Sitemap.xml verification
    try {
        $robotsResp = Invoke-WebRequest -Uri "$BaseUrl/robots.txt" -UseBasicParsing -TimeoutSec 10
        if ($robotsResp.StatusCode -eq 200 -and $robotsResp.Content -match 'Sitemap:\s*https://techinpedia\.com/sitemap\.xml') {
            Write-SeoLog "robots.txt verified: Valid status 200 with sitemap directive." -Level "SUCCESS" -Agent "TECH_SEO"
        } else {
            $issuesFound += [PSCustomObject]@{ Severity = "P1"; Type = "ROBOTS_TXT"; Message = "robots.txt missing valid sitemap reference." }
        }
    } catch {
        $issuesFound += [PSCustomObject]@{ Severity = "P0"; Type = "ROBOTS_TXT"; Message = "robots.txt inaccessible: $_" }
    }

    try {
        $sitemapResp = Invoke-WebRequest -Uri "$BaseUrl/sitemap.xml" -UseBasicParsing -TimeoutSec 15
        if ($sitemapResp.StatusCode -eq 200) {
            $urlCount = ([regex]::Matches($sitemapResp.Content, '<loc>')).Count
            Write-SeoLog "sitemap.xml verified: 200 OK with $urlCount indexable URLs." -Level "SUCCESS" -Agent "TECH_SEO"
        } else {
            $issuesFound += [PSCustomObject]@{ Severity = "P0"; Type = "SITEMAP"; Message = "sitemap.xml returned non-200 status." }
        }
    } catch {
        $issuesFound += [PSCustomObject]@{ Severity = "P0"; Type = "SITEMAP"; Message = "sitemap.xml inaccessible: $_" }
    }

    # 2. Page-level crawl & audit
    foreach ($ep in $endpoints) {
        $fullUrl = "$BaseUrl$ep"
        try {
            $res = Invoke-WebRequest -Uri $fullUrl -UseBasicParsing -TimeoutSec 12
            $html = $res.Content

            $title = if ($html -match '<title>(.*?)</title>') { $matches[1] } else { "" }
            $desc = if ($html -match '<meta[^>]*name=["'']description["''][^>]*content=["'']([^"'']*)["'']') { $matches[1] } else { "" }
            $canonical = if ($html -match '<link[^>]*rel=["'']canonical["''][^>]*href=["'']([^"'']*)["'']') { $matches[1] } else { "" }
            $h1List = @()
            [regex]::Matches($html, '<h1[^>]*>(.*?)</h1>') | ForEach-Object {
                $h1List += ($_.Groups[1].Value -replace '<[^>]+>', '').Trim()
            }
            $hasJsonLd = $html -match 'application/ld\+json'

            # Inspect Title Duplication bug (e.g. '| TechInPedia | TechInPedia')
            if ($title -match 'TechInPedia.*TechInPedia') {
                $issuesFound += [PSCustomObject]@{
                    Severity = "P1"
                    Type = "DUPLICATE_TITLE_BRANDING"
                    Url = $fullUrl
                    Message = "Duplicate brand suffix in title: '$title'"
                    CurrentTitle = $title
                }
            }

            # Check Title Length
            if ($title.Length -lt 25) {
                $issuesFound += [PSCustomObject]@{ Severity = "P2"; Type = "SHORT_TITLE"; Url = $fullUrl; Message = "Title too short ($($title.Length) chars): '$title'" }
            } elseif ($title.Length -gt 70) {
                $issuesFound += [PSCustomObject]@{ Severity = "P2"; Type = "LONG_TITLE"; Url = $fullUrl; Message = "Title potentially truncated in SERPs ($($title.Length) chars): '$title'" }
            }

            # Check Meta Description Length
            if ($desc.Length -eq 0) {
                $issuesFound += [PSCustomObject]@{ Severity = "P1"; Type = "MISSING_DESCRIPTION"; Url = $fullUrl; Message = "Meta description is missing." }
            } elseif ($desc.Length -lt 100) {
                $issuesFound += [PSCustomObject]@{ Severity = "P2"; Type = "SHORT_DESCRIPTION"; Url = $fullUrl; Message = "Meta description is too short ($($desc.Length) chars)." }
            }

            # Check Canonical
            if (-not $canonical) {
                $issuesFound += [PSCustomObject]@{ Severity = "P1"; Type = "MISSING_CANONICAL"; Url = $fullUrl; Message = "Canonical link tag missing." }
            }

            # Check H1
            if ($h1List.Count -eq 0) {
                $issuesFound += [PSCustomObject]@{ Severity = "P1"; Type = "MISSING_H1"; Url = $fullUrl; Message = "Page has no H1 heading." }
            } elseif ($h1List.Count -gt 1) {
                $issuesFound += [PSCustomObject]@{ Severity = "P2"; Type = "MULTIPLE_H1"; Url = $fullUrl; Message = "Page has multiple H1 headings ($($h1List.Count))." }
            }

            # Check Structured Data
            if (-not $hasJsonLd) {
                $issuesFound += [PSCustomObject]@{ Severity = "P2"; Type = "MISSING_SCHEMA"; Url = $fullUrl; Message = "Page lacks JSON-LD schema markup." }
            }

            $crawlResults += [PSCustomObject]@{
                Url = $fullUrl
                StatusCode = $res.StatusCode
                Title = $title
                DescLength = $desc.Length
                Canonical = $canonical
                H1Count = $h1List.Count
                FirstH1 = if ($h1List.Count -gt 0) { $h1List[0] } else { "None" }
                HasSchema = $hasJsonLd
            }
        } catch {
            $issuesFound += [PSCustomObject]@{
                Severity = "P0"
                Type = "CRAWL_ERROR"
                Url = $fullUrl
                Message = "Failed to crawl: $_"
            }
        }
    }

    # 3. Check Core Web Vitals
    $cwvResult = Get-PageSpeedAudit -Url $BaseUrl -Strategy "mobile"

    # 4. Prepare Safe Auto-Fix for Duplicate Title Branding if requested
    $duplicateTitleIssues = $issuesFound | Where-Object { $_.Type -eq "DUPLICATE_TITLE_BRANDING" }
    $registeredFix = $null

    if ($PrepareFixes -and $duplicateTitleIssues.Count -gt 0) {
        Write-SeoLog "Found $($duplicateTitleIssues.Count) duplicate title issues. Preparing safe branch and fix..." -Level "INFO" -Agent "TECH_SEO"
        
        $fixPayload = @{
            branch = "seo/fix-title-duplication"
            issueCount = $duplicateTitleIssues.Count
            affectedUrls = ($duplicateTitleIssues | Select-Object -ExpandProperty Url)
            description = "Removes redundant '| TechInPedia' suffix from child page metadata where root layout template already appends '| TechInPedia'."
            modifiedFiles = @(
                "src/app/services/page.tsx",
                "src/app/blog/page.tsx",
                "src/app/about/page.tsx",
                "src/app/contact/page.tsx"
            )
            rollbackPlan = "git checkout main; git branch -D seo/fix-title-duplication"
        }

        $registeredFix = Register-ApprovalItem -Type "CODE_FIX" `
            -Title "Fix redundant '| TechInPedia' double branding in page titles" `
            -Summary "Fixes duplicate title tags on /services, /blog, /about, and /contact so Google SERPs display clean 50-60 char brand titles." `
            -Payload $fixPayload `
            -Agent "Agent 1 (Technical SEO)"
    }

    $summary = [PSCustomObject]@{
        Timestamp = Get-KolkataTime
        BaseUrl = $BaseUrl
        TotalUrlsCrawled = $crawlResults.Count
        TotalIssues = $issuesFound.Count
        P0Issues = ($issuesFound | Where-Object { $_.Severity -eq "P0" }).Count
        P1Issues = ($issuesFound | Where-Object { $_.Severity -eq "P1" }).Count
        P2Issues = ($issuesFound | Where-Object { $_.Severity -eq "P2" }).Count
        CoreWebVitals = $cwvResult
        Issues = $issuesFound
        CrawlSample = $crawlResults | Select-Object -First 10
        StagedFix = $registeredFix
    }

    Write-SeoLog "Technical SEO audit complete: $($issuesFound.Count) issues flagged ($($summary.P0Issues) P0, $($summary.P1Issues) P1, $($summary.P2Issues) P2)." -Level "SUCCESS" -Agent "TECH_SEO"
    return $summary
}
