# TechInPedia Mobile API Audit — Phase 1
**Mobile Client**: Flutter + Dart (Employee CRM / WhatsApp)  
**Target Backend**: `https://admin.techinpedia.com` / `https://techinpedia.com`  
**Authentication Standard**: JWT (HMAC SHA-256) via `Authorization: Bearer <token>`  

---

## 1. Authentication & Session APIs

### 1.1. Login Endpoint
- **Endpoint**: `/api/auth/login`
- **HTTP Method**: `POST`
- **Authentication**: Public (no token required)
- **Rate Limiting / Lockout**: Account locks for 15 minutes after 5 failed attempts (`lockedUntil`).
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "employee@techinpedia.com",
    "password": "Password123!"
  }
  ```
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "45e1c6ed-67e7-4374-8157-9ed0b5d0c63b",
      "name": "Aditya Verma",
      "email": "aditya@techinpedia.com",
      "role": "SUPER_ADMIN",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses**:
  - `400`: `{"error": "Email and password are required."}`
  - `401`: `{"error": "Invalid email or password."}`
  - `429`: `{"error": "Account temporarily locked. Please try again later."}`
- **Mobile Usage**: Login screen form submission. Save `token` into `FlutterSecureStorage`.
- **Backend Enhancement Applied**: Added `token` directly to response JSON alongside existing cookie for dual Web / Mobile support.

---

### 1.2. Get Current User & Role Profile
- **Endpoint**: `/api/auth/me`
- **HTTP Method**: `GET`
- **Authentication**: Required (`Authorization: Bearer <token>` or `tip_admin_token` cookie)
- **Request Headers**: `Authorization: Bearer <token>`
- **Response Body (HTTP 200)**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "45e1c6ed-67e7-4374-8157-9ed0b5d0c63b",
      "name": "Aditya Verma",
      "email": "aditya@techinpedia.com",
      "role": "SUPER_ADMIN",
      "mustChangePassword": false,
      "companyId": null,
      "companyName": null,
      "companyRole": null,
      "isTenant": false,
      "tenantStatus": "ACTIVE",
      "allowedModules": ["whatsapp", "crm", "hrm"],
      "permissions": [
        "whatsapp.view",
        "whatsapp.inbox.view",
        "whatsapp.inbox.assign",
        "whatsapp.send",
        "comm.whatsapp.view",
        "comm.whatsapp.send"
      ]
    },
    "session": {
      "userId": "45e1c6ed-67e7-4374-8157-9ed0b5d0c63b",
      "employeeId": "emp-101",
      "employeeCode": "TIP-001",
      "employeeName": "Aditya Verma",
      "departmentId": "dept-1",
      "departmentName": "Engineering",
      "teamId": "team-1",
      "teamName": "Core Ops",
      "designationTitle": "Lead Architect",
      "permissions": ["whatsapp.view", "whatsapp.inbox.view", "whatsapp.send"],
      "businessUnitIds": ["27880553-4656-4557-abef-55ba9b5949c2"]
    }
  }
  ```
- **Error Responses**:
  - `401`: `{"authenticated": false, "user": null}`
- **Mobile Usage**: App bootstrap / splash screen, profile screen, Riverpod `authNotifierProvider` state initialization.

---

### 1.3. Logout Endpoint
- **Endpoint**: `/api/auth/logout`
- **HTTP Method**: `POST`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Request Body**: Empty `{}`
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```
- **Mobile Usage**: Clears backend `EmployeeSession` record (`status: OFFLINE`) and triggers local `FlutterSecureStorage.deleteAll()`.

---

## 2. WhatsApp Communication CRM APIs

### 2.1. List Conversations & Metrics
- **Endpoint**: `/api/whatsapp/conversations`
- **HTTP Method**: `GET`
- **Authentication**: Required (`whatsapp.inbox.view` or `comm.whatsapp.view`)
- **Query Parameters**:
  - `folder`: Filter by taxonomy folder. Supported values:
    - `ALL`: All active conversations (excluding archived)
    - `MY_CHATS`: Conversations assigned to `session.userId`
    - `UNASSIGNED`: Conversations where `assignedUserId == null`
    - `UNREAD`: Conversations where `unreadCount > 0`
    - `WAITING_CUSTOMER`: Inquiries where last message was sent by agent/system
    - `HIGH_PRIORITY`: Priority in `['HIGH', 'URGENT']`
    - `CLOSED`: Closed conversation threads
  - `search`: String matching `customerName`, `waNumber`, or `lastMessageText`
  - `limit`: Number of records (default: 50)
- **Response Body (HTTP 200)**:
  ```json
  {
    "conversations": [
      {
        "id": "fdb4df33-d60b-478d-ae46-29825ebbab81",
        "companyId": null,
        "waNumber": "+918924099779",
        "customerName": "Aditya",
        "contactId": "bb30fbeb-90d4-4db1-894b-a5a72783d09c",
        "leadId": "08c19904-6baf-43ce-9a43-0f2b056e4332",
        "customerId": null,
        "assignedUserId": null,
        "assignedTeam": "Sales",
        "status": "OPEN",
        "priority": "HIGH",
        "unreadCount": 0,
        "lastMessageText": "Helo testing live auto reply",
        "lastMessageSender": "CONTACT",
        "lastMessageAt": "2026-09-29T13:38:29.353Z",
        "lastCustomerActivityAt": "2026-09-29T13:38:27.890Z",
        "is24hWindowActive": true,
        "assignedUser": null
      }
    ],
    "folderMetrics": {
      "ALL": 15,
      "MY_CHATS": 3,
      "UNASSIGNED": 7,
      "UNREAD": 2,
      "WAITING_CUSTOMER": 5,
      "HIGH_PRIORITY": 4,
      "CLOSED": 1
    }
  }
  ```
- **Mobile Usage**: Shared Team Inbox listing screen, category chips (`All`, `Unread`, `Mine`, `Open`, `Closed`), and real-time search.

---

### 2.2. Fetch Message History & 360° Lead Context
- **Endpoint**: `/api/whatsapp/messages`
- **HTTP Method**: `GET`
- **Authentication**: Required (`whatsapp.inbox.view` or `comm.whatsapp.view`)
- **Query Parameters**:
  - `conversationId`: UUID of the conversation (mandatory)
- **Automatic Side Effect**: Automatically updates `unreadCount: 0` in database on retrieval!
- **Response Body (HTTP 200)**:
  ```json
  {
    "messages": [
      {
        "id": "dae4fcc7-66d9-4faf-9b5c-73951807ed81",
        "conversationId": "fdb4df33-d60b-478d-ae46-29825ebbab81",
        "metaMessageId": "wamid.TEST_ADITYA_LIVE_1790689106",
        "direction": "INBOUND",
        "senderType": "CONTACT",
        "type": "text",
        "textBody": "Helo testing live auto reply",
        "mediaUrl": null,
        "status": "DELIVERED",
        "createdAt": "2026-09-29T13:38:27.926Z"
      },
      {
        "id": "a37ff1a4-fc78-44f6-89cf-2b5878604d25",
        "conversationId": "fdb4df33-d60b-478d-ae46-29825ebbab81",
        "metaMessageId": "wamid.HBgMOTE4OTI0MDk5Nzc5FQIAERgSQjY1QzRBMTNDMkMxRDY1RDY4AA==",
        "direction": "OUTBOUND",
        "senderType": "SYSTEM",
        "type": "text",
        "textBody": "WELCOME TO Abdiel Aircon!\n\nHI Aditya,\n\nAapka inquiry receive ho gaya hai.\nHamare team aapse jald hi contact karegi.",
        "mediaUrl": null,
        "status": "SENT",
        "createdAt": "2026-09-29T13:38:29.308Z"
      }
    ],
    "conversation": {
      "id": "fdb4df33-d60b-478d-ae46-29825ebbab81",
      "waNumber": "+918924099779",
      "customerName": "Aditya",
      "status": "OPEN",
      "priority": "HIGH",
      "is24hWindowActive": true
    },
    "crmContext": {
      "lead": {
        "id": "08c19904-6baf-43ce-9a43-0f2b056e4332",
        "name": "Aditya",
        "service": "General Inquiry",
        "status": "NEW",
        "score": 55
      }
    },
    "is24hWindowActive": true
  }
  ```
- **Mobile Usage**: Conversation Chat Screen, timeline bubbles (INBOUND vs OUTBOUND vs SYSTEM), Customer details modal, 24h Window banner.

---

### 2.3. Send Outbound WhatsApp Message
- **Endpoint**: `/api/whatsapp/messages`
- **HTTP Method**: `POST`
- **Authentication**: Required (`whatsapp.send` or `comm.whatsapp.send`)
- **Request Body (Free-Form Text Message)**:
  ```json
  {
    "conversationId": "fdb4df33-d60b-478d-ae46-29825ebbab81",
    "type": "text",
    "text": "Hello, how can I assist you with our services today?"
  }
  ```
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "messageId": "wamid.HBgMOTE4OTI0MDk5Nzc5FQIAERgSNDc5NDRCNzA5RUQzREYyOTkzAA=="
  }
  ```
- **Error Responses**:
  - **24-Hour Window Expired (HTTP 400)**:
    ```json
    {
      "success": false,
      "error": "The 24-hour customer care window has expired. Meta policy requires an approved WhatsApp Template to re-open conversation.",
      "requiresTemplate": true,
      "hint": "Please select an approved template to message this contact."
    }
    ```
- **Mobile Usage**: Message Composer send action. Handles 24-hr window expiration gracefully with user guidance.

---

### 2.4. Conversation Assignment & Management
- **Endpoint**: `/api/whatsapp/conversations`
- **HTTP Method**: `PATCH`
- **Authentication**: Required (`whatsapp.inbox.assign` or `comm.whatsapp.send`)
- **Request Body**:
  ```json
  {
    "id": "fdb4df33-d60b-478d-ae46-29825ebbab81",
    "assignedUserId": "45e1c6ed-67e7-4374-8157-9ed0b5d0c63b",
    "status": "OPEN",
    "priority": "HIGH"
  }
  ```
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "conversation": {
      "id": "fdb4df33-d60b-478d-ae46-29825ebbab81",
      "assignedUserId": "45e1c6ed-67e7-4374-8157-9ed0b5d0c63b",
      "status": "OPEN",
      "priority": "HIGH"
    }
  }
  ```
- **Mobile Usage**: "Assign to Me", Reassign Agent dropdown, Close / Re-open conversation toggle.

---

## 3. Mobile-Specific Extensions (Phase 1)

### 3.1. Firebase Device Registration
- **Endpoint**: `/api/mobile/devices`
- **HTTP Method**: `POST`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "fcmToken": "f47yZ_...",
    "platform": "ANDROID",
    "deviceModel": "Pixel 8 Pro",
    "osVersion": "Android 14"
  }
  ```
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Device token registered successfully."
  }
  ```

### 3.2. Firebase Device Token Invalidation (On Logout)
- **Endpoint**: `/api/mobile/devices`
- **HTTP Method**: `DELETE`
- **Authentication**: Required (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "fcmToken": "f47yZ_..."
  }
  ```
- **Response Body (HTTP 200)**:
  ```json
  {
    "success": true,
    "message": "Device token removed."
  }
  ```
