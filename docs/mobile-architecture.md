# TechInPedia Employee Mobile Application — Architecture Specification

## 1. Architectural Philosophy
The TechInPedia Employee Mobile App is built strictly as a client for the existing TechInPedia Business OS (`admin.techinpedia.com`).
It implements **Feature-First Clean Architecture** with unidirectional data flow and strict layer boundaries:

```
[UI Layer (Widgets / Screens / Theme)]
       ↓ (watches StateNotifierProvider)
[Presentation Layer (Riverpod Controllers & State)]
       ↓ (calls Repository methods)
[Domain Layer (Entities, Models, RBAC Guards, Value Objects)]
       ↑ (implements Repository interfaces)
[Data Layer (Repositories, DTOs, Deserializers)]
       ↓ (delegates to)
[Core Infrastructure (ApiClient / SecureStorage / FirebaseMessaging)]
       ↓ (HTTP REST / APNs / FCM)
[TechInPedia Gateway (admin.techinpedia.com)]
```

## 2. Layer Definitions

### 2.1 Core Infrastructure (`lib/core/`)
- **`network/`**:
  - `ApiClient`: Dio-based HTTP client managing base URLs, 15s connect/receive timeouts, and header injection.
  - `AuthInterceptor`: Reads encrypted JWT from `SecureStorageService` and attaches `Authorization: Bearer <token>`.
  - `ErrorInterceptor`: Maps HTTP status codes to domain exceptions:
    - 401 → Session Expired callback (triggers silent logout and redirects to `/login`).
    - 403 → `ForbiddenException`.
    - 400 with Meta 24-hr flag → `Meta24HourWindowException`.
    - 500+ / Network → `ServerException` / `NetworkException`.
- **`storage/`**:
  - `SecureStorageService`: Hardware-backed encryption via Android Keystore (using AES-GCM EncryptedSharedPreferences) and iOS Keychain (`kSecAttrAccessibleAfterFirstUnlock`).
- **`firebase/`**:
  - `FirebaseMessagingService`: Manages device push registration, notification permissions, and deep-link payload routing to `/chat/:conversationId`.
- **`widgets/`**:
  - `PermissionGuard`: RBAC widget that hides or alters UI elements based on `UserModel.hasPermission(code)`.

### 2.2 Domain Layer (`lib/features/*/domain/`)
- Contains pure Dart domain models:
  - `UserModel`: Contains employee ID, company context, assigned roles, and fine-grained permission codes.
  - `WhatsAppConversationModel`: Represents customer conversation metadata, last message, priority, and 24h window status.
  - `WhatsAppMessageModel`: Typed timeline message representation (`INBOUND`, `OUTBOUND`, `SYSTEM`).
  - `FolderMetricsModel`: Live badge metrics for folders (`ALL`, `UNREAD`, `MY_CHATS`, `OPEN`, `CLOSED`, `UNASSIGNED`).

### 2.3 Presentation Layer (`lib/features/*/presentation/`)
- **State Management**: Flutter Riverpod (`StateNotifierProvider`, `Provider`, `family`).
- **Controllers**:
  - `AuthNotifier`: Manages session bootstrap, login validation, user profile fetching, and logout.
  - `InboxController`: Manages conversation lists, folder tabs, search filtering, pull-to-refresh, and 15s background synchronization.
  - `ChatController`: Manages active conversation timeline, 6s lightweight polling, optimistic message sending, and Meta 24h window guidance.
- **Routing (`lib/app/routes/`)**:
  - `GoRouter` with reactive redirection attached to `AuthNotifier`.
  - Route guards ensure unauthenticated access is confined to `/login` and authenticated users are immediately forwarded to `/inbox`.

## 3. Real-Time & Polling Strategy
1. **Inbox Level**: Auto-syncs every 15 seconds silently while the app is active, plus on pull-to-refresh and app foreground resume.
2. **Open Conversation Level**: Lightweight message check every 6 seconds while the specific chat screen is open.
3. **Background Level**: Zero active polling. Incoming messages trigger Firebase Cloud Messaging (FCM) high-priority push notifications.
4. **Lifecycle Sensitivity**: When screens are popped or the app is minimized, all timers are canceled immediately.
