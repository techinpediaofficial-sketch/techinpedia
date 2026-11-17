# WhatsApp CRM Module Specification — Mobile Client

## 1. Scope & Primary Mission
The WhatsApp CRM module in the TechInPedia Employee Mobile App provides a shared team inbox and customer conversation timeline, connecting employees directly to customer WhatsApp inquiries while maintaining enterprise controls.

## 2. API Integration Map

| Mobile Action | Backend Endpoint | Method | Payload / Query |
|---------------|------------------|--------|-----------------|
| List Conversations | `/api/whatsapp/conversations` | `GET` | `?folder=ALL&search=query` |
| View Messages | `/api/whatsapp/messages` | `GET` | `?conversationId=:id` |
| Send Outbound Message | `/api/whatsapp/messages` | `POST` | `{ conversationId: "...", text: "..." }` |
| Update Status / Assign | `/api/whatsapp/conversations` | `PATCH` | `{ id: "...", assignedUserId: "...", status: "..." }` |

## 3. Meta 24-Hour Customer Care Window Handling
- **Server Rule**: Meta WhatsApp Cloud API prohibits sending free-form text messages if more than 24 hours have passed since the customer's last inbound message.
- **Backend Detection**: `/api/whatsapp/messages` returns:
  ```json
  {
    "error": "Cannot send free-form message: 24-hour customer service window has expired.",
    "requiresTemplate": true,
    "hint": "Please send an approved WhatsApp Template message instead."
  }
  ```
- **Mobile UX**:
  1. The chat header displays a `24h Expired` badge.
  2. If an outbound send is attempted, the app intercepts `Meta24HourWindowException`.
  3. The app displays an amber warning banner:
     *"The 24-hour customer service window has expired. Standard text messages cannot be delivered. Send a WhatsApp template from the Admin Web Portal to reopen the window."*
  4. Optimistic bubbles are rolled back cleanly with zero data corruption.

## 4. Message Timeline & Differentiation
1. **INBOUND (`direction: 'INBOUND', senderType: 'CONTACT'`)**:
   - Slate-styled bubble aligned to the left.
   - Displays customer name, message text, and timestamp.
2. **OUTBOUND (`direction: 'OUTBOUND', senderType: 'AGENT'`)**:
   - Indigo-styled bubble aligned to the right.
   - Displays "You", message text, timestamp, and status checkmarks (`SENT`, `DELIVERED`, `READ`).
3. **SYSTEM (`senderType: 'SYSTEM'`)**:
   - Distinctive amber card centered in the timeline with a robot icon.
   - Clearly labeled *"Automated Workflow Message"* to prevent confusion with human agent replies.

## 5. Opt-Out & Suppression Handling
- If a customer sends an opt-out keyword (e.g. `STOP`, `UNSUBSCRIBE`), the backend marks the contact as suppressed.
- The mobile app displays the suppression status and disables message composition to ensure compliance with Meta WhatsApp policies.
