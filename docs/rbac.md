# Role-Based Access Control (RBAC) Specification

## 1. Authority Principle
The backend server (`admin.techinpedia.com`) is the **sole security boundary**.
The mobile client never determines access control; it reflects permissions authorized and returned by the backend session (`/api/auth/me`).

## 2. Roles in TechInPedia
The backend system implements the following verified role hierarchy:
1. `SUPER_ADMIN`: Unlimited platform access across all companies and modules.
2. `ADMIN`: Company-wide administrative access, user management, and visibility across all team inboxes.
3. `MANAGER`: Team-level supervisory access, conversation reassignment, and status management.
4. `TEAM_LEADER`: Team-level lead access, assigned conversation visibility, and customer communication.
5. `EMPLOYEE`: Access restricted to assigned conversations and permitted module operations.

## 3. Verified Permission Codes (WhatsApp CRM)
The mobile app evaluates fine-grained permission codes returned by the server:

| Permission Code | Description | Role Default |
|-----------------|-------------|--------------|
| `whatsapp.view` | View permitted WhatsApp CRM conversations | All Staff |
| `whatsapp.view_all` | View conversations across all departments | Admin, Super Admin |
| `whatsapp.view_team` | View conversations within own team | Manager, Team Leader |
| `whatsapp.view_assigned` | View conversations assigned to self | Employee |
| `whatsapp.send` | Send outbound text messages & replies | Permitted Staff |
| `whatsapp.assign` | Assign / Reassign conversations to employees | Manager, Admin |
| `whatsapp.close` | Mark conversations as CLOSED or reopen | Permitted Staff |

## 4. Client Implementation
The app implements `PermissionGuard`:
```dart
PermissionGuard(
  permission: 'whatsapp.assign',
  child: AssignButton(),
  fallback: SizedBox.shrink(),
)
```
And model-level evaluation:
```dart
if (currentUser.hasPermission('whatsapp.assign')) { ... }
```
`SUPER_ADMIN` has an automatic bypass in `hasPermission()`, matching backend logic.
