# ==============================================================================
# TechInPedia SEO Automation - Agent 4: Digital Marketing Specialist
# Generates high-converting B2B social content (LinkedIn & Instagram),
# creative visual briefs, promotional calendars, and lead gen campaigns.
# ==============================================================================

. "$PSScriptRoot\..\core\logger.ps1"
. "$PSScriptRoot\..\core\approval_manager.ps1"

function Invoke-DigitalMarketing {
    param(
        [switch]$GenerateSocialDraft
    )

    Write-SeoLog "Starting Digital Marketing strategy and campaign drafting..." -Level "INFO" -Agent "DIGITAL_MKTG"

    # 1. Weekly Social Marketing Promotional Calendar
    $promoCalendar = @(
        [PSCustomObject]@{
            Platform = "LinkedIn"
            Schedule = "Tuesday 10:00 AM IST"
            Format = "Carousel / Case Study PDF"
            Objective = "B2B Hardware Rental Inquiries (Delhi NCR CTOs & HR Heads)"
            Hook = "Buying 50 Laptops For Your Engineering Team? Here's How That Decision Costs You ₹15L More In 12 Months."
        },
        [PSCustomObject]@{
            Platform = "Instagram / Facebook"
            Schedule = "Thursday 04:00 PM IST"
            Format = "5-Slide Infographic Carousel"
            Objective = "Brand Authority & IT AMC Lead Capture"
            Hook = "3 Critical Signs Your Office IT AMC Needs An Immediate Upgrade."
        },
        [PSCustomObject]@{
            Platform = "LinkedIn"
            Schedule = "Friday 11:30 AM IST"
            Format = "Founder / Architecture Post"
            Objective = "Custom Software & SaaS Development Inquiries"
            Hook = "Why We Replaced Monolithic CMS Architectures with Next.js 16 + MySQL for Enterprise Clients."
        }
    )

    $stagedSocialDraft = $null

    if ($GenerateSocialDraft) {
        Write-SeoLog "Drafting production-ready LinkedIn and Instagram B2B marketing campaign..." -Level "INFO" -Agent "DIGITAL_MKTG"

        $campaignId = "camp-hardware-procurement-q4"
        $campaignTitle = "B2B Hardware Rental vs Ownership Campaign (Delhi NCR Focus)"

        # LinkedIn Post Content
        $linkedInPost = @"
Buying 50 Laptops For Your Team This Quarter? 

Here is why progressive enterprise leaders across Delhi NCR are halting CapEx purchases and switching to flexible IT hardware rentals:

💡 1. 100% Tax Deductible (OpEx)
Every rental invoice is a direct operating expense under GST with full Input Tax Credit (ITC)—shielding your cash flow and boosting balance sheet liquidity.

⚡ 2. Zero AMC & Maintenance Headaches
Hardware crash at 10 AM on a client delivery day? Waiting 2 weeks for OEM service centers ruins engineering velocity. With TechInPedia, our local hubs across Gurgaon, Noida, and Delhi dispatch doorstep replacement units within hours.

🔄 3. Rapid Scaling Without Long-Term Lock-In
Onboarding 20 contract developers or 35 summer interns? Rent commercial-grade Dell Latitude, Lenovo ThinkPad, or Apple MacBook Pro M-series for 1 to 24 months, and return or upgrade whenever project needs shift.

Over 100+ businesses across Cyber City, Sector 62 Noida, and Okhla trust TechInPedia for zero-downtime IT deployments.

👉 Exploring flexible laptop or desktop rentals for your company? 
Visit https://techinpedia.com/services/laptop-rental or DM us for a custom corporate quotation.

#CorporateLaptopRental #ITHardwareRentals #DelhiNCR #StartupsIndia #BusinessOperations #TechInPedia #OpexVsCapex #ITInfrastructure
"@

        # Instagram Carousel Script & Visual Brief
        $instagramCarousel = @{
            concept = "5-Slide Educational Carousel"
            visualTheme = "TechInPedia Dark Purple & Violet Gradient (#0f0728 with #802ee3 accents)"
            slides = @(
                @{
                    slideNumber = 1
                    headline = "STOP BUYING LAPTOPS FOR YOUR COMPANY IN 2026."
                    subtext = "Swipe to see the financial breakdown why Delhi NCR CTOs rent instead ➔"
                    visual = "Split image: Stack of cash vs sleek Dell Latitude & MacBook Pro"
                },
                @{
                    slideNumber = 2
                    headline = "1. Cash Flow Liquidity"
                    subtext = "Outright purchase locks ₹50L+ in depreciating silicon. Rentals preserve working capital for core growth and marketing."
                    visual = "Graph showing cash flow divergence over 24 months"
                },
                @{
                    slideNumber = 3
                    headline = "2. Zero Downtime Buffer Guarantee"
                    subtext = "Hardware failure? No 14-day warranty delays. We provide same-day doorstep hot-swap across Delhi, Noida & Gurgaon."
                    visual = "2-hour delivery clock icon with TechInPedia logistics van"
                },
                @{
                    slideNumber = 4
                    headline = "3. Always On Modern Silicon"
                    subtext = "Upgrade seamlessly from Intel i5/i7 to latest Apple M-Series without bearing secondary-market resale losses."
                    visual = "Side-by-side specs comparison table"
                },
                @{
                    slideNumber = 5
                    headline = "Equip Your Team in Under 24 Hours."
                    subtext = "Flexible tenure from 1 to 36 months. Bulk configurations available now."
                    cta = "Link in bio or WhatsApp +91 98187 68680 for immediate dispatch."
                    visual = "TechInPedia verified badge with WhatsApp CTA button"
                }
            )
            caption = "Scaling your team in Delhi NCR? Discover how renting Dell, HP, Lenovo & MacBook hardware cuts IT capital outlay by 60%. DM us 'RENT' or tap the link in bio for instant quotes. #ITRentals #TechInPedia #CorporateLeasing #DelhiNCR"
        }

        # Save to drafts
        $draftsDir = Join-Path $PSScriptRoot "..\drafts\social"
        if (-not (Test-Path $draftsDir)) { New-Item -ItemType Directory -Force -Path $draftsDir | Out-Null }
        $draftFile = Join-Path $draftsDir "$campaignId.json"

        $socialPayload = @{
            campaignId = $campaignId
            title = $campaignTitle
            targetAudience = "CTOs, Operations Directors, HR Managers (Delhi NCR)"
            linkedIn = @{
                text = $linkedInPost
                characterCount = $linkedInPost.Length
                targetLink = "https://techinpedia.com/services/laptop-rental"
            }
            instagram = $instagramCarousel
            status = "PENDING_APPROVAL"
            budgetProposed = "₹0 Organic (Optional ₹5,000 Boost upon review)"
        }

        $socialPayload | ConvertTo-Json -Depth 10 | Set-Content -Path $draftFile -Encoding utf8

        # Register in approval manager
        $stagedSocialDraft = Register-ApprovalItem -Type "SOCIAL_POST" `
            -Title "B2B Social Marketing Campaign: $campaignTitle" `
            -Summary "Multi-channel campaign (LinkedIn thought leadership + 5-slide Instagram visual carousel script) targeting corporate hardware rentals in Delhi NCR." `
            -Payload $socialPayload `
            -Agent "Agent 4 (Digital Marketing)"
    }

    $result = [PSCustomObject]@{
        Timestamp = Get-KolkataTime
        PromotionalCalendar = $promoCalendar
        StagedSocialDraft = $stagedSocialDraft
    }

    Write-SeoLog "Digital Marketing strategy compiled successfully." -Level "SUCCESS" -Agent "DIGITAL_MKTG"
    return $result
}
