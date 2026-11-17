# Existing System Overview

## Application
TechInPedia Platform (Company Website + Admin CRM/HRM)

## Framework
Next.js 16.3.4 (App Router) + React 19

## Purpose
A combined enterprise system that currently handles the public company website, a CMS, a CRM (Leads, Quotations), HRM (Employees, Payroll), and integrations (Google Sheets, WhatsApp, Razorpay).

## Database Access
Prisma 6.4.1 (MySQL)

## Authentication
JWT-based custom auth with cookies (`tip_admin_token`).

## Deployment Expectation
Node.js environment (server.js/pm2) on a VPS/Cloud provider.

## Summary
The codebase is a modular monolith. The frontend (public site) and backend (admin/API) are currently tightly coupled within the same Next.js repository.
