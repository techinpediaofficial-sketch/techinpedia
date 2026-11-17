# TechInPedia India - Professional Freelancing Agency & Digital Product Platform

A complete, production-ready, full-stack freelancing software agency website and CMS platform for **TechInPedia India**. Built with Next.js App Router, React, TypeScript, Tailwind CSS, Prisma ORM, and MySQL.

---

## 🌟 Key Features

### Public Website
- **Hero & Landing Page**: Modern, high-converting agency positioning, trust indicators, featured work, 7-step development process, and technology matrix.
- **Services System**: Detailed service catalog (`/services`) and dedicated landing pages (`/services/[slug]`) with custom problem-solving specifications and prefilled WhatsApp CTAs.
- **Portfolio & Case Studies**: Filterable portfolio grid (`/work`) and in-depth case study pages (`/work/[slug]`) featuring problem statements, solutions, key features, tech stack tags, and screenshot galleries.
- **Contact & Lead Capture**: Interactive contact form (`/contact`) with budget selectors ($500 -> $5,000+), service selection, client/server validation, input sanitization, and automated lead notifications.
- **Start Project Wizard**: 5-step proposal wizard (`/start-project`) for client project specifications (About You -> Project Specs -> Budget -> Timeline -> Review & Submit).
- **Blog & Insights**: Article catalog (`/blog`) and individual post view (`/blog/[slug]`) with sanitized HTML content rendering and category filtering.
- **Legal & Compliance**: Complete disclosures for `/privacy-policy`, `/terms`, and `/refund-policy`.
- **Floating WhatsApp Widget**: Bottom-right floating action widget powered by dynamic database settings.
- **SEO & Schema**: Dynamic OpenGraph tags, JSON-LD Schema markup (`Organization`, `Service`, `Article`, `FAQPage`), dynamic `/sitemap.xml`, and `/robots.txt`.

### Admin Panel & Lead CRM (`/admin`)
- **Secure Authentication**: JWT in HTTP-Only, SameSite cookies with password hashing (`bcryptjs`), rate limiting, failed login tracking, and forced password update on initial login.
- **Role-Based Access Control (RBAC)**: Enforced at API & server levels:
  - `SUPER_ADMIN`: Full system access, admin user management, system configuration.
  - `ADMIN`: Lead CRM, services, portfolio, blog, testimonials, FAQs, media, allowed settings.
  - `EDITOR`: Content management for blog, services, portfolio, testimonials, FAQs, media.
- **Lead CRM Pipeline**: Filter leads by status (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`, `ARCHIVED`), search by client/email/company, add internal notes, track UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`), and dispatch 1-click Email/Call/WhatsApp chats.
- **CMS Management**: Complete CRUD interfaces for Services, Case Studies, Blog Posts (with Rich Text editor), Testimonials, and FAQs.
- **Media Library**: File upload manager (`/admin/media`) with MIME type validation, file size enforcement (max 5MB), unique filename sanitization, local disk storage (`/public/uploads/`), copy URL, and database metadata tracking.
- **System Settings**: Categorized configuration tabs (Company Info, Social Handles, Default SEO, Website Assets) and centralized WhatsApp phone number management.
- **Audit Activity Logs**: Administrative action audit log (`/admin/activity`).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Next.js Server Components & Route Handlers, Node.js, TypeScript
- **Database & ORM**: MySQL database, Prisma ORM
- **Authentication**: JWT, HTTP-Only Cookies, bcryptjs
- **Email Service**: Nodemailer SMTP Integration
- **Validation**: Zod schema validation & input sanitization

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+ & npm
- MySQL Server running locally or on cloud (Port 3306)

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Example `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/techinpedia"
JWT_SECRET="techinpedia_super_secret_jwt_key_2026"
AUTH_SECRET="techinpedia_super_secret_auth_key_2026"

EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="contact@techinpedia.com"
EMAIL_PASSWORD="your_app_password"
EMAIL_FROM="TechInPedia India <contact@techinpedia.com>"

WHATSAPP_NUMBER="919876543210"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Database Migration & Seeding
Create the MySQL database `techinpedia`, push the Prisma schema, and run the initial seed script:

```bash
# Create database tables & sync schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial admin user, settings, services, projects, FAQs, and articles
npx prisma db seed
```

### 4. Default Admin Credentials
Initial seed script generates a Super Admin account:
- **URL**: `http://localhost:3000/admin/login`
- **Email**: `admin@techinpedia.com`
- **Password**: `Admin@123456`

> [!IMPORTANT]
> Upon first login, the admin is prompted to update this initial password for security.

### 5. Running Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to view the public website.

---

## 📦 Production Deployment Guide

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

### Process Management with PM2
```bash
pm2 start npm --name "techinpedia" -- run start
```

### Reverse Proxy (Nginx Example)
```nginx
server {
    server_name techinpedia.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 License

© 2026 TechInPedia India. All rights reserved.
