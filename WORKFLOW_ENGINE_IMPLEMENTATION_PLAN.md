# TechInPedia CRM - Visual Business Automation Engine Implementation Plan

## 1. Current Architecture Audit
- **Database Schema**: Existing `WorkflowRule` has only flat strings (`trigger`, `conditions`, `actions`, `isActive`), and `WorkflowExecution` has only `id`, `workflowId`, `status`, `errorLog`, `executedAt`.
- **API**: `/api/automation/workflows` handles basic JSON create/list, with a mock `TEST_EXECUTE` endpoint that merely creates a dummy row without running actual code.
- **Frontend**: A single form page with a raw JSON textarea for `actions` and a table listing rules.
- **Missing Capabilities**:
  - No visual workflow canvas or tree builder.
  - No condition group parser (no nested AND/OR evaluation).
  - No branching (IF/ELSE) or delayed execution.
  - No persistent queue or job scheduling (delays like "Wait 2 hours" cannot execute).
  - No step-by-step execution timeline or error tracking per node.
  - No draft/publish workflow versioning or validation.
  - No simulation/dry-run mode.
  - No templates gallery.

---

## 2. Proposed Database Schema Extension
In `prisma/schema.prisma`:
```prisma
model WorkflowRule {
  id                   String              @id @default(uuid())
  name                 String
  description          String?             @db.Text
  category             String              @default("CRM") // LEADS, DEALS, BILLING, SUPPORT, RENTALS, HRM
  status               String              @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
  version              Int                 @default(1)
  parentWorkflowId     String?
  trigger              String              // e.g. crm.lead.created
  triggerConfig        String?             @db.Text
  nodes                String              @db.LongText // JSON array of visual nodes
  edges                String?             @db.LongText // JSON array of connections
  conditions           String?             @db.Text // Preserved for backward compatibility
  actions              String?             @db.Text // Preserved for backward compatibility
  isActive             Boolean             @default(true)
  isTemplate           Boolean             @default(false)
  createdById          String?
  updatedById          String?
  totalExecutions      Int                 @default(0)
  successfulExecutions Int                 @default(0)
  failedExecutions     Int                 @default(0)
  lastExecutedAt       DateTime?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  executions           WorkflowExecution[]
  jobs                 WorkflowJob[]

  @@index([trigger])
  @@index([status])
  @@index([isActive])
}

model WorkflowExecution {
  id              String                  @id @default(uuid())
  workflowId      String
  workflowVersion Int                     @default(1)
  triggerEvent    String
  triggerPayload  String                  @db.LongText
  idempotencyKey  String?                 @unique
  status          String                  @default("PENDING") // PENDING, RUNNING, COMPLETED, FAILED, WAITING, CANCELLED
  stepCount       Int                     @default(0)
  currentStepId   String?
  errorLog        String?                 @db.LongText
  durationMs      Int?
  startedAt       DateTime                @default(now())
  completedAt     DateTime?
  resumedAt       DateTime?

  workflow        WorkflowRule            @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  steps           WorkflowExecutionStep[]
  jobs            WorkflowJob[]

  @@index([workflowId])
  @@index([status])
  @@index([startedAt])
}

model WorkflowExecutionStep {
  id            String            @id @default(uuid())
  executionId   String
  nodeId        String
  nodeType      String            // TRIGGER, CONDITION, BRANCH, ACTION, DELAY
  nodeName      String
  actionType    String?
  status        String            // SUCCESS, FAILED, SKIPPED, WAITING
  inputPayload  String?           @db.LongText
  outputPayload String?           @db.LongText
  errorDetails  String?           @db.LongText
  durationMs    Int?
  retryCount    Int               @default(0)
  executedAt    DateTime          @default(now())

  execution     WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId])
  @@index([nodeId])
  @@index([status])
}

model WorkflowJob {
  id          String            @id @default(uuid())
  executionId String
  workflowId  String
  nodeId      String
  status      String            @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED, RETRYING
  runAt       DateTime          @default(now())
  priority    Int               @default(0)
  attempts    Int               @default(0)
  maxAttempts Int               @default(3)
  lastError   String?           @db.Text
  lockedAt    DateTime?
  lockedBy    String?
  payload     String            @db.LongText
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  execution   WorkflowExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  workflow    WorkflowRule      @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([status, runAt])
  @@index([executionId])
}
```

---

## 3. Trigger and Action Registry Architecture
The registry (`src/lib/workflow/registry.ts`) establishes standard interfaces:

### Available Triggers
- **Leads & CRM**:
  - `crm.lead.created` (New lead via website, form, or WhatsApp)
  - `crm.lead.status_changed` (Status changed from NEW to CONTACTED, etc.)
  - `crm.lead.score_threshold` (Score exceeds threshold)
  - `crm.deal.created`, `crm.deal.stage_changed`, `crm.deal.won`, `crm.deal.lost`
  - `crm.customer.created`
- **Projects & Tasks**:
  - `projects.task.created`, `projects.task.completed`, `projects.task.overdue`
- **Finance & Sales**:
  - `finance.quotation.sent`, `finance.quotation.accepted`
  - `finance.invoice.issued`, `finance.invoice.overdue`
  - `finance.payment.received`
- **Support**:
  - `support.ticket.created`, `support.ticket.priority_escalated`
- **Hardware Rentals & AMC**:
  - `hardware.rental.created`, `hardware.rental.due_soon`
  - `hardware.amc.expiring`
- **HRM**:
  - `hr.employee.joined`, `hr.leave.requested`
- **Inbound Communications**:
  - `comm.whatsapp.received`, `integration.webhook.received`
- **Scheduled & Recurring**:
  - `scheduled.daily.cron`, `scheduled.hourly.cron`

### Available Actions
- **Communication**:
  - `SEND_WHATSAPP_MESSAGE` / `SEND_WHATSAPP_TEMPLATE` (reusing `whatsapp_cloud.ts`)
  - `SEND_EMAIL` (customer email or internal team notification via `email.ts`)
  - `IN_APP_NOTIFICATION`
- **CRM Operations**:
  - `UPDATE_LEAD_STATUS`, `ADD_LEAD_TAG`, `REMOVE_LEAD_TAG`, `CALCULATE_LEAD_SCORE`
  - `ASSIGN_USER` (Specific user)
  - `ASSIGN_ROUND_ROBIN` (Evenly distributes leads across sales team members)
  - `ASSIGN_LEAST_LOADED` (Assigns to user with lowest open lead count)
  - `UPDATE_DEAL_STAGE`
- **Tasks & Reminders**:
  - `CREATE_FOLLOW_UP` (CRM follow-up with reminder date)
  - `CREATE_PROJECT_TASK` (Task under a specific project)
- **Finance & Support**:
  - `CREATE_QUOTATION`, `CREATE_INVOICE`, `SEND_PAYMENT_REMINDER`
  - `CREATE_TICKET`, `ESCALATE_TICKET`
- **Integrations**:
  - `WEBHOOK_CALL` (POST/GET to external endpoint with custom headers & payload)
  - `APPEND_GOOGLE_SHEET_ROW` (reusing `google_sheets.ts`)

---

## 4. Asynchronous Execution & Queue Architecture
- **Persistent Engine**: Uses MySQL-backed `WorkflowJob` model.
- **Idempotency**: Triggers generate unique `idempotencyKey = ${triggerEvent}:${entityId}:${workflowId}:${timestamp_bucket}` to prevent duplicate executions.
- **Concurrency & Locking**: When processing a job, atomic state transition updates `lockedAt` and `lockedBy`.
- **Delay / Wait Mechanism**: Nodes with delay set `runAt = NOW() + delayMs`. The background worker / cron checks `runAt <= NOW()`.
- **Retry Policy**: Exponential backoff (1m, 5m, 15m) up to `maxAttempts = 3`.
- **Infinite Loop Guard**: Strict maximum execution step depth (50 steps). If exceeded, execution marks `FAILED` with recursion alarm.

---

## 5. Security & Masking Strategy
- **RBAC**: Protected by `automation.workflows.manage` and `requireRole([SUPER_ADMIN, ADMIN])`.
- **Credential Masking**: Any header or payload key matching `password`, `token`, `secret`, `apiKey`, `auth` is replaced with `***MASKED***` in `WorkflowExecutionStep.inputPayload` and `outputPayload`.
- **SSRF Prevention**: Outbound webhook action validates destination URLs to prevent intranet or localhost loopback probing.

---

## 6. Migration Strategy (Zero Downtime & 100% Backward Compatibility)
- `legacyMigrator.ts`: Inspects existing `WorkflowRule` rows. If `nodes` is empty or null, automatically converts old string `trigger`, `conditions`, and `actions` JSON into a valid visual node graph.
- Existing rules continue to run without interruption.

---

## 7. Implementation Phases
- **Phase 1**: Database schema expansion & migration.
- **Phase 2**: Core workflow library (types, registry, condition evaluator, action runner, queue engine, event emitter, legacy migrator).
- **Phase 3**: API endpoints (CRUD, versioning, test/dry-run, executions list, execution timeline, cron runner).
- **Phase 4**: Visual Workflow Builder UI with interactive canvas, condition groups, branches, delays, actions, and test drawer.
- **Phase 5**: Execution timeline dashboard (`/admin/workflows/[id]/executions` and `/admin/workflow-executions/[executionId]`).
- **Phase 6**: Workflow templates gallery (10 production templates) & analytics dashboard.
- **Phase 7**: Automated testing, local build verification, and live VPS deployment.
