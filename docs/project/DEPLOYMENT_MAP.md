# DEPLOYMENT MAP

| Application       | Domain                | Business Unit    | Purpose                | Deployment Path                                    | Status                   |
| ----------------- | --------------------- | ---------------- | ---------------------- | -------------------------------------------------- | ------------------------ |
| Company Website   | techinpedia.com       | COMPANY_SERVICES | Public company website | `/home/<SERVER_USER>/public_html/techinpedia.com`       | LIVE                     |
| Urban Marketplace | urban.techinpedia.com | MARKETPLACE      | Marketplace frontend   | `/home/<SERVER_USER>/public_html/urban.techinpedia.com` | LIVE                     |
| Admin Platform    | admin.techinpedia.com | CENTRAL          | CRM/HRM/Admin          | `/home/<SERVER_USER>/public_html/admin.techinpedia.com` | LIVE                     |

## Server Information Policy

Allowed:
- Server Host/IP reference if operationally required
- SSH port
- SSH username
- deployment directories
- PM2 process names
- application ports

DO NOT write:
- SSH passwords
- database passwords
- API secrets
- JWT secrets
- encryption keys
- private keys
- Razorpay secrets
- WhatsApp secrets
- Google credentials

## Server Infrastructure

- **Host:** `<SERVER_IP>`
- **SSH/SFTP Port:** `22`
- **SSH/SFTP User:** `<SERVER_USER>`

### PM2 Process & Port Mapping

| PM2 Name | Port | Directory | Notes |
| --- | --- | --- | --- |
| `techinpedia` | 3000 | `/home/<SERVER_USER>/public_html/techinpedia.com` | Public company website & customer portal |
| `techinpedia-admin` | 3002 | `/home/<SERVER_USER>/public_html/admin.techinpedia.com` | Central Admin, CRM & IT Hardware Rentals |
| `techinpedia-urban` | 3001 | `/home/<SERVER_USER>/public_html/urban.techinpedia.com` | Urban marketplace frontend |
| `techinpedia-worker` | - | `/home/<SERVER_USER>/public_html/techinpedia.com` | Background queues & worker |

