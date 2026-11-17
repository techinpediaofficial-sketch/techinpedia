# Firebase & Push Notification Setup Guide

## 1. Architecture & Principle
Firebase in TechInPedia Employee Mobile App is utilized exclusively for **mobile infrastructure** (Push Notifications & Device Registration).
**Firebase does NOT replace the MySQL database or act as a secondary CRM store.**

## 2. Notification Data Flow
```
Customer WhatsApp Reply
       ↓ (Meta Webhook)
TechInPedia Backend (/api/whatsapp/webhook)
       ↓ (Identifies conversation, recipient employee & device tokens)
Firebase Cloud Messaging (FCM HTTP v1 API)
       ↓ (Push payload with { conversationId: "..." })
Employee Device (Android / iOS)
       ↓ (Tapping notification)
Flutter Mobile App
       ↓ (GoRouter deep-link)
Navigates directly to /chat/:conversationId
```

## 3. Client Implementation

### 3.1 Device Registration Endpoint
- **Endpoint**: `POST /api/mobile/devices`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "token": "<FCM_REGISTRATION_TOKEN>",
    "deviceType": "ANDROID" | "IOS"
  }
  ```
- **Backend Storage**: Stored securely in `db.setting` under `user_devices_${userId}` (zero database schema migration required).

### 3.2 Token Lifecycle
1. **On Login**: FCM token is obtained via `FirebaseMessaging.instance.getToken()` and registered against the user.
2. **On Refresh**: `FirebaseMessaging.instance.onTokenRefresh` updates the backend automatically.
3. **On Logout**: Calls `DELETE /api/mobile/devices` with the active token to ensure no residual notifications reach unauthorized devices.

## 4. Platform Setup Instructions

### Android Setup
1. Create a project in [Firebase Console](https://console.firebase.google.com).
2. Register Android app with package name:
   `com.techinpedia.employee`
3. Download `google-services.json` and place it in:
   `mobile/android/app/google-services.json`
4. Android notification permissions (`POST_NOTIFICATIONS` for Android 13+) and `INTERNET` are already configured in `AndroidManifest.xml`.

### iOS Setup
1. Register iOS app in Firebase Console with Bundle ID:
   `com.techinpedia.employee`
2. Download `GoogleService-Info.plist` and place it in:
   `mobile/ios/Runner/GoogleService-Info.plist`
3. In Apple Developer portal:
   - Enable Push Notifications capability on App ID.
   - Upload APNs Authentication Key (.p8) to Firebase Console under Project Settings -> Cloud Messaging -> Apple app configuration.
4. `Info.plist` already includes `UIBackgroundModes` for `remote-notification`.
