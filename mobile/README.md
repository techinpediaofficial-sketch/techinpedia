# TechInPedia Employee Mobile App — Phase 1

A production-grade mobile CRM & Employee Workspace application built with Flutter, Riverpod, and Firebase, integrating with the live TechInPedia Business OS backend (`https://admin.techinpedia.com`).

---

## 1. Overview & Architecture

The mobile app follows **Feature-First Clean Architecture** with strict layer separation:

```
mobile/lib/
├── app/
│   ├── app.dart                   # Root MaterialApp with M3 ThemeData & Riverpod router
│   ├── config/
│   │   └── environment.dart       # Development, Staging, Production environments
│   ├── routes/
│   │   ├── app_router.dart        # GoRouter with authentication guards & deep-links
│   │   └── main_shell.dart        # 4-tab navigation shell: Inbox (with unread badge), Leads, Workforce, Profile
│   └── theme/
│       ├── app_colors.dart        # Indigo, Emerald & Amber Brand palette
│       └── app_theme.dart         # Material 3 Light & Dark themes
│
├── core/
│   ├── constants/api_endpoints.dart  # Centralized REST paths (inbox, templates, leads, hrm)
│   ├── errors/app_exception.dart     # Typed exception hierarchy (including Meta 24h)
│   ├── firebase/
│   │   └── firebase_messaging_service.dart # FCM token registration & notification router
│   ├── network/
│   │   ├── api_client.dart        # Dio client with timeout & interceptors
│   │   ├── auth_interceptor.dart  # Bearer token auto-injection
│   │   └── error_interceptor.dart # Error mapping & 401 session expiry
│   ├── storage/
│   │   └── secure_storage_service.dart # flutter_secure_storage wrapper
│   └── widgets/
│       └── permission_guard.dart  # Granular RBAC UI guard
│
├── features/
│   ├── auth/
│   │   ├── data/repositories/auth_repository.dart
│   │   ├── domain/models/user_model.dart
│   │   └── presentation/
│   │       ├── controllers/auth_controller.dart
│   │       └── screens/login_screen.dart, splash_screen.dart
│   │
│   ├── crm/
│   │   ├── data/repositories/lead_repository.dart
│   │   ├── domain/models/
│   │   │   ├── lead_model.dart, lead_timeline_model.dart, lead_note_model.dart
│   │   └── presentation/
│   │       ├── controllers/leads_controller.dart, lead_details_controller.dart
│   │       ├── screens/leads_screen.dart
│   │       └── widgets/lead_details_sheet.dart (Lead 360 Hub)
│   │
│   ├── hrm/
│   │   ├── data/repositories/hrm_repository.dart
│   │   ├── domain/models/
│   │   │   ├── attendance_punch_model.dart, leave_balance_model.dart
│   │   │   ├── leave_request_model.dart, payroll_model.dart
│   │   └── presentation/
│   │       ├── controllers/punch_controller.dart, leaves_controller.dart, payroll_controller.dart
│   │       ├── screens/hrm_screen.dart
│   │       └── widgets/punch_card.dart, leave_balance_card.dart, apply_leave_sheet.dart
│   │
│   ├── profile/
│   │   └── presentation/screens/profile_screen.dart
│   │
│   └── whatsapp/
│       ├── data/repositories/whatsapp_repository.dart
│       ├── domain/models/
│       │   ├── folder_metrics_model.dart, whatsapp_template_model.dart
│       │   ├── whatsapp_conversation_model.dart, whatsapp_message_model.dart
│       │   └── internal_note_model.dart
│       └── presentation/
│           ├── controllers/inbox_controller.dart, chat_controller.dart, template_controller.dart
│           ├── screens/inbox_screen.dart, chat_screen.dart
│           └── widgets/
│               ├── conversation_tile.dart, folder_filter_bar.dart, message_bubble.dart
│               └── template_picker_bottom_sheet.dart
│
└── main.dart
```

---

## 2. Requirements & Environment

- **Flutter SDK:** `>=3.38.3` (Channel stable)
- **Dart SDK:** `>=3.10.1`
- **Application ID:** `com.techinpedia.employee`
- **Backend API Base:** `https://admin.techinpedia.com`

---

## 3. Environment Configuration

The environment is configured via `lib/app/config/environment.dart`.
By default, the app connects to the production API gateway:
```dart
AppEnvironment.production => 'https://admin.techinpedia.com'
```

---

## 4. Authentication & Security (Bearer Tokens)

1. **Header Injection:**
   The app stores the issued JWT in `flutter_secure_storage` (Android Keystore / iOS Keychain).
   Requests to `https://admin.techinpedia.com/api/*` automatically attach:
   ```http
   Authorization: Bearer <token>
   ```
2. **Server-Side RBAC:**
   The backend resolves the user's role (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`), department, and fine-grained permissions (e.g. `whatsapp.view`, `whatsapp.send`, `whatsapp.assign`).
3. **No Direct Meta API Access:**
   All WhatsApp Cloud API requests stay strictly server-side. The mobile client never receives or stores Meta tokens.

---

## 5. WhatsApp CRM Shared Team Inbox

- **Folder Filtering:** `ALL`, `UNREAD`, `MINE` (Assigned to me), `OPEN`, `CLOSED`, `UNASSIGNED`.
- **Search:** Instant search across customer names and WhatsApp phone numbers.
- **24-Hour Service Window Detection:**
  The app detects Meta's 24-hour customer service window status (`is24hWindowActive`).
  When expired, outgoing free-form messages return `Meta24HourWindowException` with user guidance to send an approved template from the Admin Web Portal.
- **Message Types:**
  - **Inbound (Customer):** Slate bubble on the left.
  - **Outbound (Agent):** Indigo bubble on the right with delivery checkmarks (`SENT`, `DELIVERED`, `READ`).
  - **System (Automated Workflows):** Subtle amber card in the timeline identifying automated system messages.
- **Conversation Ownership & Status:**
  - Quick action menu to "Assign to Me" or reassign.
  - Toggle status between `OPEN` and `CLOSED`.

---

## 6. Firebase Cloud Messaging (Push Notifications)

- **Device Token Registration:**
  On login, FCM obtains the device token and registers it via `POST /api/mobile/devices`.
- **Deep Linking:**
  Tapping a notification automatically routes to `/chat/:conversationId`.
- **Deregistration:**
  Logging out calls `DELETE /api/mobile/devices` and clears the secure keystore.

---

## 7. Build Commands

### Run Locally
```bash
cd mobile
flutter run
```

### Run Tests & Analysis
```bash
flutter analyze
flutter test
```

### Build Android APK
```bash
# Debug build
flutter build apk --debug

# Release build
flutter build apk --release
```

### iOS Build
```bash
flutter build ios --no-codesign
```
