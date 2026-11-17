# TechInPedia - Server Access, Credentials & Deployment Guide

This document contains all server credentials, hosting details, database configuration, admin portal logins, branding details, and deployment commands for **TechInPedia India**.

---

## 1. Project & Website Summary

| Attribute | Details |
|---|---|
| **Company Name** | TechInPedia India |
| **Primary Domain** | [https://techinpedia.in](https://techinpedia.in) |
| **Secondary/Parent Domain** | [https://lucknows.shop](https://lucknows.shop) |
| **Local Project Path** | `/Users/adityaverma/Downloads/techinpedia` |
| **Tech Stack** | Next.js 16, TypeScript, Tailwind CSS, Prisma ORM, MySQL (MariaDB), CloudLinux Passenger (Node 20) |

---

## 2. Branding & Contact Details

| Field | Detail |
|---|---|
| **Company Name** | TechInPedia India |
| **Primary Email** | `contact@techinpedia.in` / `hello@techinpedia.in` |
| **Phone / WhatsApp** | `+91 98765 43210` (Raw: `919876543210`) |
| **Headquarters** | New Delhi & Remote Worldwide |
| **Logo Source** | `/Users/adityaverma/Downloads/techinpedia/public/logo.png` |
| **Favicon Icon** | `/Users/adityaverma/Downloads/techinpedia/public/favicon.ico` |

---

## 3. Admin Portal Access

- **Admin Login URL**: [https://techinpedia.in/admin/login](https://techinpedia.in/admin/login)
- **Admin Email**: `admin@techinpedia.in`
- **Default Password**: `Admin@123456`
- **Role**: `SUPER_ADMIN`

---

## 4. cPanel / FTP / Server & Host Details

| Parameter | Value |
|---|---|
| **Shared IP Address** | `103.102.234.161` |
| **cPanel Username** | `xxfeszkb` |
| **FTP Host** | `techinpedia.in` |
| **FTP User** | `xxfeszkb` |
| **FTP Password** | `Newpass@12346` |
| **Home Directory** | `/home/xxfeszkb` |
| **App Web Root** | `/home/xxfeszkb/techinpedia.in` |
| **Node.js Virtual Environment** | `/home/xxfeszkb/nodevenv/techinpedia.in/20/bin/node` |
| **cPanel URL** | `https://harmony.herosite.pro:2083` |

---

## 5. MySQL Database Access

| Parameter | Value |
|---|---|
| **Database Name** | `xxfeszkb_techlynk` |
| **MySQL Username** | `xxfeszkb_techlynk` |
| **Host** | `localhost` (Port: `3306`) |

---

## 6. How to Build & Deploy Updates to TechInPedia

Whenever you make local code changes in `/Users/adityaverma/Downloads/techinpedia`:

### Step 1: Build Local Production Bundle
```bash
cd /Users/adityaverma/Downloads/techinpedia
npm run build
```

### Step 2: Package Deployment Archive
```bash
zip -r techinpedia_deploy_opt.zip .next public src prisma server.js package.json package-lock.json .env htaccess_techinpedia_opt
```

### Step 3: Server Restart Command
To restart the Node server on CloudLinux Passenger:
```bash
mkdir -p /home/xxfeszkb/techinpedia.in/tmp
touch /home/xxfeszkb/techinpedia.in/tmp/restart.txt
```

---

## 7. CloudLinux NPROC 200 Crash Optimization Settings

To prevent CloudLinux NPROC 200/200 limit spikes and keep process usage under control:
- **Threadpool Restriction (`server.js`)**: `process.env.UV_THREADPOOL_SIZE = "2"` and `process.env.NODE_OPTIONS = "--max-old-space-size=256 --v8-pool-size=2"`
- **Direct Apache Static Bypass (`.htaccess`)**: `RewriteRule ^(_next/static/|images/|logo\.png|favicon\.ico|icon\.png|apple-icon\.png|google[a-f0-9]+\.html|sitemap\.xml|robots\.txt)$ - [L]`
- **Passenger Instance Control**: `PassengerMaxInstancesPerApp 1`, `PassengerMinInstances 0`, `PassengerPoolIdleTime 10`
- **Telemetry Disabled**: `NEXT_TELEMETRY_DISABLED=1`

