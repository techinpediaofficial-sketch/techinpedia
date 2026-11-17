<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set("display_errors", 1);

$dbUser = "xxfeszkb_techlynk";
$dbPass = "Newpass@12346";
$dbName = "xxfeszkb_techlynk";
$dbHost = "localhost";

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $websites = [
        [
            "id" => "web-admiless",
            "title" => "Admiles Multi-Vendor Portal",
            "slug" => "admiless-portal",
            "category" => "Multi-Vendor / E-Commerce & Food",
            "clientType" => "Admiles New Mart Ltd",
            "shortDesc" => "All-in-one on-demand web portal for multi-vendor restaurant food ordering, retail e-commerce shopping, and courier parcel dispatch.",
            "description" => "Admiles Web Portal is an enterprise-grade on-demand multi-vendor e-commerce platform built to seamlessly connect consumers, store vendors, and delivery fleets. Customers can explore hundreds of local food menus, order retail products, calculate instant courier parcel rates, and track orders in real-time.",
            "problem" => "The client needed a high-performance web platform that synchronizes simultaneously with their mobile apps for multi-vendor food, shopping, and courier logistics.",
            "solution" => "Engineered a responsive Next.js and Flutter Web super-portal with real-time vendor catalog sync, geolocation store discovery, dynamic delivery pricing algorithms, and instant checkout.",
            "features" => [
                "Multi-Vendor Food & Retail Marketplace",
                "Real-Time Store Locator & Geolocation",
                "Instant Courier Parcel Rate Calculator",
                "Dynamic Delivery Driver Dispatch Sync",
                "Multi-Payment Gateway Integration",
                "Vendor Admin Management Dashboard"
            ],
            "technologies" => ["Next.js", "Flutter Web", "Node.js", "Express", "MySQL", "Google Maps API", "Socket.io"],
            "results" => [
                "Live at admiless.com",
                "Synchronized 3-in-1 Super Portal",
                "Sub-Second Search & Order Routing"
            ],
            "featuredImage" => "/projects/screenshots/admiless.png",
            "gallery" => [
                "/projects/screenshots/admiless.png",
                "https://admiless.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 10
        ],
        [
            "id" => "web-vijayabharnajewellers",
            "title" => "Vijayabharna Jewellers",
            "slug" => "vijayabharna-jewellers-web",
            "category" => "Luxury Jewellery / E-Commerce",
            "clientType" => "Vijaya Bharna Jewellers",
            "shortDesc" => "Luxury jewellery digital storefront with live gold rate tickers, bridal collection showcases, and custom inquiry engine.",
            "description" => "Vijaya Bharna Jewellers is a premier digital jewellery storefront designed to exhibit traditional gold, diamond, and bridal jewellery collections with elegant high-fashion aesthetics. Features dynamic gold price calculations, categorized bridal vaults, custom inquiry engine, and secure payment checkout.",
            "problem" => "Traditional showroom required an upscale digital identity to showcase daily fluctuating gold/silver rates and allow pan-India customers to browse precious bridal collections.",
            "solution" => "Built a bespoke e-commerce catalog platform with live bullion market API integration, high-resolution product carousels, custom jewellery request funnels, and secure WhatsApp customer concierge.",
            "features" => [
                "Live Gold (24K, 22K) & Silver Market Ticker",
                "Bridal, Temple & Contemporary Vault Showcases",
                "Bespoke Jewellery Consultation Booking",
                "Direct Concierge WhatsApp Ordering",
                "Faceted Metal Purity & Gemstone Filters",
                "Instant Inquiry & Showroom Appointment Engine"
            ],
            "technologies" => ["Laravel", "PHP 8.3", "MySQL", "Tailwind CSS", "JavaScript", "Bullion API"],
            "results" => [
                "Live at vijayabharnajewellers.com",
                "Over 1,000+ Curated Jewellery SKUs",
                "40% Increase in High-Value Bridal Enquiries"
            ],
            "featuredImage" => "/projects/screenshots/vijayabharnajewellers.png",
            "gallery" => [
                "/projects/screenshots/vijayabharnajewellers.png",
                "https://vijayabharnajewellers.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 11
        ],
        [
            "id" => "web-realestate-vb",
            "title" => "Vijayabharna Real Estate",
            "slug" => "vijayabharna-realestate",
            "category" => "Real Estate & Land Properties",
            "clientType" => "Vijaya Bharna Properties Devadurga",
            "shortDesc" => "Property listing and layout portal for commercial plots, residential land, and site visit booking in Devadurga.",
            "description" => "A dedicated real estate and property showcase web platform for exploring verified residential layouts, commercial developments, and land plots with interactive master plans, amenity maps, brochure downloads, and direct site-visit scheduling.",
            "problem" => "Prospective land buyers lacked access to layout maps, approval certificates, and plot dimension details without visiting the physical development site.",
            "solution" => "Engineered an interactive real estate portal presenting verified land developments, layout dimensions, nearby infrastructure highlights, downloadable brochures, and one-click site visit scheduling.",
            "features" => [
                "Verified Plot & Layout Interactive Showcase",
                "One-Click Site Visit Appointment Booking",
                "Master Plan & Approval Document Downloads",
                "Nearby Amenities & Connectivity Maps",
                "Direct Property Agent WhatsApp Connect",
                "Fast Mobile-Optimized Layout Architecture"
            ],
            "technologies" => ["Laravel", "PHP 8.3", "MySQL", "Bootstrap 5", "Google Maps API"],
            "results" => [
                "Live at realestate.vijayabharnajewellers.com",
                "100% Verified Plot Documentation Access",
                "Streamlined Property Site Visit Lead Flow"
            ],
            "featuredImage" => "/projects/screenshots/realestate-vijayabharna.png",
            "gallery" => [
                "/projects/screenshots/realestate-vijayabharna.png",
                "https://realestate.vijayabharnajewellers.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 12
        ],
        [
            "id" => "web-velorajewels",
            "title" => "Velora Jewels",
            "slug" => "velora-jewels",
            "category" => "Fashion Jewellery & D2C E-Commerce",
            "clientType" => "Velora Jewels India",
            "shortDesc" => "Modern D2C e-commerce jewellery shopping brand with dynamic product filtering, customer cart, and express pan-India checkout.",
            "description" => "Velora Jewels is an online direct-to-consumer fashion jewellery store offering handcrafted earrings, necklace sets, rings, and festive collections. Built with an optimized shopping cart, inventory sync, seasonal discount promo engine, and seamless mobile-first checkout.",
            "problem" => "Brand needed a lightning-fast shopping storefront with modern aesthetic to drive direct sales from Instagram and social advertising campaigns.",
            "solution" => "Engineered a high-converting D2C e-commerce platform with faceted search, instant cart persistence, automated discount coupon triggers, and express checkout.",
            "features" => [
                "D2C Shopping Cart & Express Checkout",
                "Faceted Category & Occasion Filtering",
                "Seasonal Discount Promo & Coupon Engine",
                "Customer Review Aggregation & Star Ratings",
                "Real-Time Stock Inventory Synchronization",
                "Integrated Digital Payment Gateways (UPI/Cards)"
            ],
            "technologies" => ["PHP", "Laravel", "MySQL", "JavaScript", "Tailwind CSS", "Razorpay"],
            "results" => [
                "Live at velorajewels.co.in",
                "Sub-1.2s Fast Page Load Speed",
                "Pan-India Direct Order Fulfillment"
            ],
            "featuredImage" => "/projects/screenshots/velorajewels.png",
            "gallery" => [
                "/projects/screenshots/velorajewels.png",
                "https://velorajewels.co.in/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 13
        ],
        [
            "id" => "web-trucraftmodular",
            "title" => "TruCraft Modular Solutions",
            "slug" => "trucraft-modular",
            "category" => "Architecture & Modular Manufacturing",
            "clientType" => "TruCraft Modular Private Limited",
            "shortDesc" => "Precision modular kitchen, wardrobe, and interior architecture showcase website for custom residential and commercial manufacturing.",
            "description" => "TruCraft Modular is a premium manufacturing and interior design digital portfolio showcasing bespoke modular kitchens, luxury wardrobes, and commercial fit-outs. Designed with clean architectural lines, material finish selectors, 3D visualization showcases, and quotation inquiry funnels.",
            "problem" => "B2B & B2C interior clients needed to understand the factory manufacturing precision, raw material quality, and design turnaround times before contracting.",
            "solution" => "Architected an elegant portfolio website highlighting factory precision joinery, production matrices, 3D modular kitchen galleries, and interactive quote consultation forms.",
            "features" => [
                "Architectural Modular Showcase Portfolio",
                "Modular Kitchen & Luxury Wardrobe Galleries",
                "Factory Production & Joinery Matrix Walkthrough",
                "Instant Design Consultation Request Funnel",
                "Interactive WhatsApp Business Chatbot Integration",
                "Fluid Next-Gen Responsive Web Aesthetics"
            ],
            "technologies" => ["Next.js", "React", "Tailwind CSS", "Framer Motion", "Node.js"],
            "results" => [
                "Live at trucraftmodular.com",
                "Ultra-Premium Modern Architecture Layout",
                "3.5x Increase in Qualified Interior Quotations"
            ],
            "featuredImage" => "/projects/screenshots/trucraftmodular.png",
            "gallery" => [
                "/projects/screenshots/trucraftmodular.png",
                "https://trucraftmodular.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 14
        ],
        [
            "id" => "web-vinfexotech",
            "title" => "Vinfexo Tech",
            "slug" => "vinfexo-tech",
            "category" => "Enterprise IT & Digital Agency",
            "clientType" => "Vinfexo Tech Private Limited",
            "shortDesc" => "Corporate technology agency website highlighting web development, mobile applications, cloud engineering, and digital growth services.",
            "description" => "Vinfexo Tech is a full-service technology agency portal presenting custom software engineering, cloud architecture, mobile app development, and enterprise digital transformation capabilities with modern dark-mode aesthetic and interactive tech matrices.",
            "problem" => "Agency required an authoritative corporate digital footprint that clearly articulated enterprise technical capabilities and generated inbound client inquiries.",
            "solution" => "Engineered a high-performance Next.js corporate agency platform featuring modern dark-mode typography, interactive services breakdown, and seamless CRM lead capture.",
            "features" => [
                "Corporate Dark-Mode Engineering Aesthetics",
                "Interactive Technology & Cloud Capability Stacks",
                "Client Project Case Study Showcases",
                "Multi-Step Consultation & Estimate Request Form",
                "Automated Email & Telegram Lead Alerts",
                "Flawless Core Web Vitals Performance"
            ],
            "technologies" => ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js"],
            "results" => [
                "Live at vinfexotech.com",
                "98+ Google Lighthouse Performance Score",
                "Consistent Global Inbound Technical Leads"
            ],
            "featuredImage" => "/projects/screenshots/vinfexotech.png",
            "gallery" => [
                "/projects/screenshots/vinfexotech.png",
                "https://vinfexotech.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 15
        ],
        [
            "id" => "web-hellomam",
            "title" => "Hello Mam Beauty & Skincare",
            "slug" => "hello-mam",
            "category" => "Cosmetics & Beauty E-Commerce",
            "clientType" => "Hello Mam Lifestyle Brand",
            "shortDesc" => "Curated beauty, skincare, and women's wellness e-commerce shopping platform with categorized product catalogue and speedy checkout.",
            "description" => "Hello Mam is a dedicated e-commerce online retail platform catering to premium beauty products, herbal skincare essentials, and wellness accessories. Featuring ingredient transparency, verified customer reviews, flash sale banners, and automated inventory logistics.",
            "problem" => "Cosmetics brand needed an intuitive, trustworthy e-commerce storefront with smooth product browsing and fast mobile checkout.",
            "solution" => "Developed a streamlined beauty retail platform with skin concern filtering, clear ingredient information, customer star ratings, and friction-free payment flow.",
            "features" => [
                "Beauty, Skincare & Cosmetics Catalog",
                "Skin Concern & Ingredient Filtering",
                "Quick Add-to-Cart & Direct Buy Flows",
                "Customer Review & Rating Aggregator",
                "Flash Sale & Discount Promo Banners",
                "Pan-India Courier Logistics Synchronization"
            ],
            "technologies" => ["Laravel", "PHP", "MySQL", "JavaScript", "Tailwind CSS", "Razorpay"],
            "results" => [
                "Live at hellomam.co.in",
                "High Customer Retention & Repeat Orders",
                "Friction-Free Mobile Shopping Funnel"
            ],
            "featuredImage" => "/projects/screenshots/hellomam.png",
            "gallery" => [
                "/projects/screenshots/hellomam.png",
                "https://hellomam.co.in/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 16
        ],
        [
            "id" => "web-abdielaircon",
            "title" => "Abdiel Aircon",
            "slug" => "abdiel-aircon",
            "category" => "Industrial HVAC & Spare Parts Supply",
            "clientType" => "Abdiel Aircon Industrial",
            "shortDesc" => "B2B industrial catalog and supply portal for genuine commercial HVAC compressors, refrigerants, and cooling spare parts.",
            "description" => "Abdiel Aircon is an industrial B2B digital catalog and distribution platform for HVAC contractors, air conditioning technicians, and commercial facilities. Hosts comprehensive technical datasheets, compressor specs, bulk quote requests, and direct technician contact.",
            "problem" => "Commercial HVAC technicians and contractors struggled to find genuine, verified cooling parts with exact technical specifications online.",
            "solution" => "Constructed a comprehensive industrial spare parts portal categorized by compressor type, tonnage capacity, refrigerant compatibility, and instant quotation ordering.",
            "features" => [
                "Industrial HVAC Spare Parts Digital Catalog",
                "Rotary, Scroll & Reciprocating Compressor Specs",
                "B2B Bulk Price Quotation Request Engine",
                "Technical Datasheet & Compatibility Guides",
                "Instant WhatsApp Field Support for Technicians",
                "Fast Part Search & SKU Lookup"
            ],
            "technologies" => ["HTML5", "CSS3", "JavaScript", "PHP", "MySQL"],
            "results" => [
                "Live at abdielaircon.info",
                "Over 500+ Verified HVAC Parts Listed",
                "Direct B2B Inquiries from Commercial Contractors"
            ],
            "featuredImage" => "/projects/screenshots/abdielaircon.png",
            "gallery" => [
                "/projects/screenshots/abdielaircon.png",
                "https://abdielaircon.info/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 17
        ],
        [
            "id" => "web-shivalikfinadvisor",
            "title" => "Swastik / Shivalik FinAdvisors",
            "slug" => "shivalik-finadvisor",
            "category" => "Financial Services & Loan Advisory",
            "clientType" => "Swastik FinAdvisors LLP",
            "shortDesc" => "Online loan comparison, EMI calculation, and financial advisory portal connecting borrowers with top banking partners.",
            "description" => "Shivalik Sales & FinAdvisors is a modern financial consultancy platform helping individuals and enterprises secure personal loans, home loans, and business financing with lowest interest rates. Features interactive EMI calculators, eligibility checks, and instant banker callbacks.",
            "problem" => "Borrowers faced confusing loan terms and lack of transparent comparison across major banking institutions.",
            "solution" => "Engineered a financial advisory web portal equipped with dynamic loan EMI calculators, eligibility comparison matrices, and encrypted customer consultation forms.",
            "features" => [
                "Interactive Loan EMI & Interest Calculator",
                "Multi-Bank Loan Comparison Matrix",
                "Instant Borrower Eligibility Assessment Form",
                "Document Checklist & Approval Guides",
                "SSL-Encrypted Customer Lead Vault",
                "Direct Financial Advisor Consultation Scheduling"
            ],
            "technologies" => ["PHP", "Laravel", "MySQL", "JavaScript", "Bootstrap 5"],
            "results" => [
                "Live at shivaliksalesfinadvisor.com",
                "Real-Time EMI Calculations",
                "Over ₹50Cr+ Loan Advisory Inquiries Processed"
            ],
            "featuredImage" => "/projects/screenshots/shivaliksalesfinadvisor.png",
            "gallery" => [
                "/projects/screenshots/shivaliksalesfinadvisor.png",
                "https://shivaliksalesfinadvisor.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 18
        ],
        [
            "id" => "web-bmnaveenmovies",
            "title" => "BM Naveen Movies Portal",
            "slug" => "bm-naveen-movies-web",
            "category" => "Entertainment & Video Streaming",
            "clientType" => "BM Naveen Entertainment",
            "shortDesc" => "High-speed multimedia entertainment web portal for discovering movie trailers, upcoming releases, and video streaming.",
            "description" => "BM Naveen Movies Web Portal delivers an immersive digital entertainment experience for movie buffs with instant trailer playback, categorized film genres, actor biographies, and release date countdowns with fluid dark-mode cinema aesthetics.",
            "problem" => "Entertainment audience required an ad-free, fast portal to stream HD trailers, read synopses, and discover trending regional cinema releases.",
            "solution" => "Developed a responsive entertainment streaming web application with video player integration, genre filtering, and responsive cloud media delivery.",
            "features" => [
                "High-Definition Video Streaming & Trailer Player",
                "Genre & Language Cinema Categorization",
                "Upcoming Movie Release Calendar & Countdown",
                "Actor Filmographies & Production Credits",
                "Dark Cinema Aesthetic with Fluid Transitions",
                "Mobile & Desktop Video Optimization"
            ],
            "technologies" => ["Next.js", "Node.js", "HLS Video Streaming", "Tailwind CSS", "MySQL"],
            "results" => [
                "Live at movie.bmnaveens.com",
                "Instant Zero-Buffer Trailer Playback",
                "High User Engagement Across Devices"
            ],
            "featuredImage" => "/projects/screenshots/movie-bmnaveens.png",
            "gallery" => [
                "/projects/screenshots/movie-bmnaveens.png",
                "https://movie.bmnaveens.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 19
        ],
        [
            "id" => "web-kcnsons",
            "title" => "KCN Sons Luxury Fashion",
            "slug" => "kcn-sons-boutique",
            "category" => "Heritage Bridal & Luxury Couture",
            "clientType" => "KCN Sons Lucknow",
            "shortDesc" => "Prestigious heritage bridal boutique website featuring handcrafted Lucknowi Gararas, Chikankari craftsmanship, and custom designer appointments.",
            "description" => "KCN Sons is an opulent digital boutique honoring authentic Awadhi heritage fashion, pure Lucknowi Chikankari, and regal bridal gararas. Crafted with regal gold-and-navy aesthetics, bridal lookbooks, custom tailoring consultation scheduling, and global concierge shipping.",
            "problem" => "Historic bridal atelier needed a royal digital presence to present bespoke handcrafted bridal gararas to elite families across India and the diaspora.",
            "solution" => "Created a luxury digital atelier with high-resolution embroidery zoom, heritage storytelling, bespoke bridal consultation scheduler, and global concierge ordering.",
            "features" => [
                "Luxury Bridal Couture Lookbook with High-Res Zoom",
                "Authentic Awadhi Craftsmanship & History Storytelling",
                "Custom Bridal Consultation & Measurement Scheduler",
                "International Concierge Shipping Inquiry Flow",
                "Multi-Currency Display & VIP WhatsApp Stylist Connect",
                "Opulent Gold & Deep-Navy Luxury Design System"
            ],
            "technologies" => ["PHP 8.3", "MySQL", "JavaScript", "CSS3 Luxury Styling", "Bootstrap"],
            "results" => [
                "Live at kcnsons.in",
                "Global Inquiries from USA, UK & Middle East",
                "Celebrated Authentic Lucknowi Heritage Brand"
            ],
            "featuredImage" => "/projects/screenshots/kcnsons.png",
            "gallery" => [
                "/projects/screenshots/kcnsons.png",
                "https://kcnsons.in/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 20
        ],
        [
            "id" => "web-bookmyhotel",
            "title" => "Book My Hotel",
            "slug" => "book-my-hotel",
            "category" => "Hospitality & Hotel Booking Engine",
            "clientType" => "Book My Hotel Hospitality Network",
            "shortDesc" => "Comprehensive hotel reservation and stay discovery platform featuring destination filtering, live room rates, and instant booking confirmation.",
            "description" => "Book My Hotel is an advanced hotel reservation engine enabling travelers to discover resorts, boutique hotels, and business stays. Equipped with location-based radius search, amenity filters, real-time room availability, guest review aggregation, and instant SMS/Email voucher dispatch.",
            "problem" => "Independent hotels and travelers required a transparent, direct booking marketplace with competitive rates and zero hidden commissions.",
            "solution" => "Constructed an end-to-end hotel booking portal with date-picker reservation engines, room availability calendars, room-type selector, and automated instant vouchers.",
            "features" => [
                "Real-Time Hotel Room Booking Engine",
                "Destination, Price & Star-Rating Filtering",
                "Detailed Room Amenities & Gallery Presentation",
                "Instant Booking Confirmation Voucher Generation",
                "Guest Review & Verified Rating System",
                "Secure Online Payment & Pay-At-Hotel Options"
            ],
            "technologies" => ["Laravel", "PHP", "MySQL", "JavaScript", "REST APIs", "Payment Gateway"],
            "results" => [
                "Live at book-myhotel.com",
                "Instant Reservation Processing",
                "Direct Booking Fee Savings for Hotel Owners"
            ],
            "featuredImage" => "/projects/screenshots/book-myhotel.png",
            "gallery" => [
                "/projects/screenshots/book-myhotel.png",
                "https://book-myhotel.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 21
        ],
        [
            "id" => "web-anytimesalon",
            "title" => "Anytime Salon",
            "slug" => "anytime-salon",
            "category" => "Beauty, Grooming & Salon Booking",
            "clientType" => "Anytime Salon Network",
            "shortDesc" => "On-demand salon and beauty appointment booking marketplace connecting customers with professional stylists and spa therapies.",
            "description" => "Anytime Salon is a digital salon appointment and grooming service platform allowing clients to explore top-rated stylists, book salon chairs or at-home beauty services, view transparent price menus, and receive automated appointment reminders.",
            "problem" => "Salon clients faced long wait times and uncertainty regarding service prices and appointment availability.",
            "solution" => "Engineered a time-slot based salon reservation platform with stylist catalogs, service duration tracking, transparent pricing, and automated SMS appointment confirmations.",
            "features" => [
                "Time-Slot Salon & Stylist Booking Engine",
                "Transparent Beauty & Spa Service Menu",
                "In-Salon & At-Home Grooming Options",
                "Automated Appointment Reminders via WhatsApp/SMS",
                "Customer Review & Verified Stylist Ratings",
                "Dynamic Barber Chair Availability Management"
            ],
            "technologies" => ["Laravel", "PHP", "MySQL", "JavaScript", "Tailwind CSS"],
            "results" => [
                "Live at anytimesalon.com",
                "Eliminated Salon Walk-In Wait Times",
                "3x Growth in Repeat Beauty Appointments"
            ],
            "featuredImage" => "/projects/screenshots/anytimesalon.png",
            "gallery" => [
                "/projects/screenshots/anytimesalon.png",
                "https://anytimesalon.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 22
        ],
        [
            "id" => "web-makeuptym",
            "title" => "MakeupTym Studio & Academy",
            "slug" => "makeuptym",
            "category" => "Bridal Makeup & Artist Academy",
            "clientType" => "MakeupTym Academy & Studio",
            "shortDesc" => "Professional bridal makeup portfolio and beauty academy portal for booking elite bridal packages and makeup artistry masterclasses.",
            "description" => "MakeupTym is a dedicated bridal beauty studio and makeup education portal. Showcasing certified bridal makeover portfolios, before-after transformations, makeup academy course curriculums, and masterclass enrollment with date-reservation calendars.",
            "problem" => "Elite bridal artist needed an authoritative portal to manage high-volume wedding season bookings and enroll students into professional certification courses.",
            "solution" => "Built an engaging beauty studio platform highlighting bridal transformations, course syllabus downloads, bridal date reservation inquiries, and masterclass enrollments.",
            "features" => [
                "High-Definition Bridal Makeover Transformation Gallery",
                "Makeup Academy Course Curriculums & Enrollment",
                "Wedding Date Availability Reservation Calendar",
                "Bridal Package Breakdown & Consultation Engine",
                "Client Video Reviews & Celebrity Makeover Spotlights",
                "Direct WhatsApp Bridal Booking Assistant"
            ],
            "technologies" => ["PHP", "MySQL", "Bootstrap", "JavaScript", "HTML5"],
            "results" => [
                "Live at makeuptym.com",
                "100% Advance Booking for Wedding Seasons",
                "Active Academy Enrollment Batches"
            ],
            "featuredImage" => "/projects/screenshots/makeuptym.png",
            "gallery" => [
                "/projects/screenshots/makeuptym.png",
                "http://makeuptym.com/"
            ],
            "featured" => 1,
            "status" => "PUBLISHED",
            "displayOrder" => 23
        ]
    ];

    $sql = "INSERT INTO `Project` (`id`, `title`, `slug`, `category`, `clientType`, `shortDesc`, `description`, `problem`, `solution`, `features`, `technologies`, `results`, `featuredImage`, `gallery`, `featured`, `status`, `displayOrder`, `createdAt`, `updatedAt`) VALUES (:id, :title, :slug, :category, :clientType, :shortDesc, :description, :problem, :solution, :features, :technologies, :results, :featuredImage, :gallery, :featured, :status, :displayOrder, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `category` = VALUES(`category`), `clientType` = VALUES(`clientType`), `shortDesc` = VALUES(`shortDesc`), `description` = VALUES(`description`), `problem` = VALUES(`problem`), `solution` = VALUES(`solution`), `features` = VALUES(`features`), `technologies` = VALUES(`technologies`), `results` = VALUES(`results`), `featuredImage` = VALUES(`featuredImage`), `gallery` = VALUES(`gallery`), `featured` = VALUES(`featured`), `displayOrder` = VALUES(`displayOrder`), `updatedAt` = NOW(3)";
    $stmt = $pdo->prepare($sql);

    $count = 0;
    foreach ($websites as $w) {
        $stmt->execute([
            ":id" => $w["id"],
            ":title" => $w["title"],
            ":slug" => $w["slug"],
            ":category" => $w["category"],
            ":clientType" => $w["clientType"],
            ":shortDesc" => $w["shortDesc"],
            ":description" => $w["description"],
            ":problem" => $w["problem"],
            ":solution" => $w["solution"],
            ":features" => json_encode($w["features"]),
            ":technologies" => json_encode($w["technologies"]),
            ":results" => json_encode($w["results"]),
            ":featuredImage" => $w["featuredImage"],
            ":gallery" => json_encode($w["gallery"]),
            ":featured" => $w["featured"],
            ":status" => $w["status"],
            ":displayOrder" => $w["displayOrder"]
        ]);
        $count++;
    }

    echo json_encode(["success" => true, "message" => "Successfully seeded $count client websites into live Project table!"]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
