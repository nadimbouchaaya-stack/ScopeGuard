# SCOPEGUARD — FULL CODEBASE AUDIT REPORT

---

## 1. CRITICAL BUGS (will break in production)

**BUG-1: `SUPABASE_SERVICE_ROLE_KEY` missing from `.env.local`**
- **Files:** `src/app/api/notify-cr/route.ts:24`, `src/app/api/scope-approved/route.ts:22`
- Both API routes require `SUPABASE_SERVICE_ROLE_KEY` to call `supabase.auth.admin.getUserById()`. This env var is **not in `.env.local`**. Both routes will return 500 immediately.
- **Impact:** Freelancer never receives email when: (a) client submits a change request, (b) client approves scope.

**BUG-2: Scope approval logic is inverted — new projects created as "Active"**
- **Files:** `src/app/projects/new/page.tsx:100`, `src/app/portal/[projectId]/page.tsx:277`
- New projects are created with `status: "Active"` (line 100 of new project page).
- The portal shows the "Approve Scope" button when `project.status === "Active"` (line 277).
- Clicking "Approve Scope" sets status to... `"Active"` (line 53) — a no-op.
- **The "Pending Approval" status is never used in the happy path.** The intended flow (project starts as "Pending Approval" -> client approves -> becomes "Active") is broken.
- **Fix needed:** Either create projects as "Pending Approval" and show the button for that status, or remove the approve flow entirely.

**BUG-3: `projects/page.tsx` handleChangeRequest uses `saveProject()` — causes duplicate/stale writes**
- **File:** `src/app/projects/page.tsx:107-141`
- When approving/declining a CR from the projects list, `handleChangeRequest` calls `saveProject(updatedProject)` which does a full `upsert` of the entire project including all change requests (line 162-173 of `storage.ts`). This sets `user_id` on every change request to the freelancer's ID, overwriting any anonymous CRs from the portal. It also risks overwriting concurrent changes.
- Meanwhile, `pending-approvals/page.tsx:185-254` correctly uses targeted `supabase.update().eq("id", crId)` calls. These two approval paths are inconsistent.

---

## 2. EMAIL FLOW ISSUES

**EMAIL-1: Notification email silently fails (see BUG-1)**
- `/api/notify-cr` and `/api/scope-approved` will always 500 without `SUPABASE_SERVICE_ROLE_KEY`.

**EMAIL-2: Excessive console.log in send-email route**
- **File:** `src/app/api/send-email/route.ts:16-21, 34-41, 159, 172`
- Logs API key presence, length, and full payload details. In production this leaks sensitive metadata to server logs.

**EMAIL-3: `&apos;` HTML entity renders literally in some email clients**
- **File:** `src/app/api/scope-approved/route.ts:74`
- The text `You&apos;re all set` — `&apos;` is not universally supported in HTML emails (it's an XML/HTML5 entity). Many email clients render it literally. Use `&#39;` or `'` instead.

**EMAIL-4: No email sent when freelancer approves/declines CR from projects list page**
- **File:** `src/app/projects/page.tsx:107-141`
- The `handleChangeRequest` function in `projects/page.tsx` approves/declines CRs but **never calls `/api/cr-action`** to notify the client. Only the `pending-approvals/page.tsx` path sends the notification email (line 241-254).

---

## 3. RLS / SECURITY ISSUES

**SEC-1: Projects UPDATE is fully open — `USING (true)`**
- **File:** `supabase-auth-migration.sql:47-49`
- Anyone with the project ID can update **any column** on any project (name, price, user_id, etc.). The portal only needs to update `status`, but the policy allows everything.
- **Risk:** A malicious actor who knows a project UUID can change the price, deadline, client info, or even reassign ownership.

**SEC-2: Change requests UPDATE is fully open — `USING (true)`**
- **File:** `supabase-auth-migration.sql:72-75`
- Anyone can update any change request's status, description, cost, etc.

**SEC-3: Change requests INSERT is fully open — `TO public WITH CHECK (true)`**
- **File:** `supabase-fix-cr-insert-policy.sql:17-20`
- Anyone can insert change requests into any project if they know the project UUID. There's no rate limiting.

**SEC-4: No middleware.ts — no server-side route protection**
- There is **no `middleware.ts`** file anywhere in the project. All auth checks happen client-side. Users can directly access `/dashboard`, `/projects`, etc. without being logged in — they'll see empty states rather than being redirected to login.

**SEC-5: Projects SELECT is fully open — `USING (true)`**
- Anyone can query and read ALL projects in the database, not just their own. The client-side `storage.ts` filters by `user_id`, but the database itself exposes everything.

**SEC-6: `.env.local` contains real API keys committed to the repo (or accessible)**
- **File:** `.env.local`
- Contains real `RESEND_API_KEY` and Supabase anon key. If this file is committed to git, these keys are exposed.

---

## 4. LOGIC ERRORS

**LOGIC-1: `getProject()` in storage.ts doesn't filter by user_id**
- **File:** `src/lib/storage.ts:109-132`
- `getProject(id)` fetches any project by ID without checking ownership. Only `getProjects()` (plural) filters by `user_id`. This means if someone navigates to `/projects/[someone-elses-id]`, the client-side code will load it.

**LOGIC-2: `deleteProject()` doesn't verify ownership**
- **File:** `src/lib/storage.ts:182-200`
- Deletes change requests and the project by ID without checking `user_id`. RLS on DELETE does require `user_id = auth.uid()`, so this is protected at the DB level, but the code gives no feedback if the delete silently fails due to RLS.

**LOGIC-3: Duplicate CR approval logic (two code paths)**
- **Path A:** `src/app/projects/page.tsx:107-141` — uses `saveProject()` (full upsert)
- **Path B:** `src/app/pending-approvals/page.tsx:185-254` — uses targeted updates + sends email
- These can produce different results. Path A doesn't send client notification emails. Path A overwrites CR `user_id`.

**LOGIC-4: `saveProjectPublic()` is defined but never called**
- **File:** `src/lib/storage.ts:235-262`
- This function exists for portal approve/decline flow but the portal page doesn't use it. The portal uses direct `supabase.from("projects").update()` calls instead.

**LOGIC-5: Real-time subscription in `pending-approvals` listens to ALL change_requests**
- **File:** `src/app/pending-approvals/page.tsx:176-179`
- The subscription listens to `event: "*"` on the entire `change_requests` table, not filtered by project IDs. Every CR change across all users triggers a full refetch.

**LOGIC-6: Real-time subscription in `dashboard` same issue**
- **File:** `src/app/dashboard/page.tsx:77-80`
- Same problem — listens to all `change_requests` changes globally.

---

## 5. TYPE / DATA ISSUES

**TYPE-1: `timeImpactDays` not coerced to Number in pending-approvals**
- **File:** `src/app/pending-approvals/page.tsx:152`
- `additionalCost` is wrapped in `Number()` but `timeImpactDays` is assigned raw: `timeImpactDays: dbCr.time_impact_days`. If the DB returns a string, arithmetic will break.

**TYPE-2: Non-null assertion on project lookup**
- **File:** `src/app/pending-approvals/page.tsx:156`
- `projects!.find((p) => p.id === dbCr.project_id)!` — double non-null assertion. If a CR references a deleted project, this crashes.

**TYPE-3: `ChangeRequest.status` type mismatch**
- **File:** `src/lib/types.ts:15` defines status as `"Pending" | "Approved" | "Declined"` (capitalized)
- Multiple places use `.toLowerCase().trim()` comparisons (e.g., `cr.status?.toLowerCase().trim() === "pending"`), suggesting the DB may return unexpected casing. The type definition and runtime checks are inconsistent.

**TYPE-4: `deliverables` column stored as JSON array but typed as `Deliverable[]`**
- **File:** `src/lib/storage.ts:20` — `deliverables: Deliverable[]` in `DbProject`
- Supabase returns JSON columns as parsed objects, but there's no runtime validation that the shape matches `Deliverable`.

---

## 6. UI/UX ISSUES

**UX-1: Portal shows "Approve Scope" on already-active projects (see BUG-2)**

**UX-2: No loading states on initial page load**
- **Files:** `dashboard/page.tsx:86`, `projects/page.tsx:175`, `pending-approvals/page.tsx:259`, `portal/[projectId]/page.tsx:127`
- All return `null` while loading, causing a flash of empty content. No skeleton loaders or spinners.

**UX-3: Quick actions menu doesn't close on outside click**
- **File:** `src/app/projects/page.tsx:92` — `quickMenuId` state
- The dropdown menu (`...` button) doesn't have a click-outside handler. It stays open until the user clicks another `...` button or takes an action.

**UX-4: Portal has no auth-gated indication**
- The portal is fully public. There's no visual indication to the client that this is their private portal or any mechanism to prevent URL sharing/leakage.

**UX-5: Cost/time impact fields on portal CR form accept negative numbers via keyboard**
- **File:** `src/app/portal/[projectId]/page.tsx:399-420`
- `min="0"` prevents the spinner from going below 0 but doesn't prevent typing negative numbers. `Number(crCost) || 0` will convert negatives to their value, not 0.

---

## 7. DEAD CODE / UNUSED CODE

**DEAD-1: `saveProjectPublic()` — never called anywhere**
- **File:** `src/lib/storage.ts:235-262`

**DEAD-2: CashRain component duplicated in 2 files**
- **File:** `src/app/projects/page.tsx:19-74` and `src/app/pending-approvals/page.tsx:18-63`
- Identical `CashRain` component is copy-pasted in both files. Should be a shared component.

**DEAD-3: `approve` redirect page is unnecessary**
- **File:** `src/app/portal/[projectId]/approve/page.tsx`
- Simply redirects to `/portal/[projectId]`. If no emails link to `/portal/[projectId]/approve` anymore, this page serves no purpose.

---

## 8. PERFORMANCE ISSUES

**PERF-1: `getProjects()` makes 2 sequential queries**
- **File:** `src/lib/storage.ts:70-107`
- Fetches all projects, then fetches all CRs. Could use a Supabase join or embed.

**PERF-2: Dashboard makes 3 separate Supabase calls on load**
- **File:** `src/app/dashboard/page.tsx:28-68`
- `getProjects()` (2 queries), then `getUser()`, then `user_profiles` query, then another `projects.select("id")` query. The project IDs are already available from `getProjects()`.

**PERF-3: 200-element CashRain renders 200 DOM nodes**
- **Files:** `projects/page.tsx:20`, `pending-approvals/page.tsx:20`
- Each approval triggers 200 absolutely-positioned animated div elements. On low-end devices this could cause jank.

**PERF-4: Real-time subscriptions trigger full data refetch**
- Every change on the `change_requests` table triggers `fetchData()` or `fetchPendingCount()` which re-queries everything instead of applying the delta.

---

## 9. ENV VARIABLES

| Variable | Present | Used By |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client |
| `RESEND_API_KEY` | Yes | All 4 email routes |
| `SUPABASE_SERVICE_ROLE_KEY` | **MISSING** | `notify-cr`, `scope-approved` |

---

## 10. COMPLETE EMAIL FLOW MAP

| # | Trigger | API Route | From / To | Status |
|---|---|---|---|---|
| 1 | Freelancer creates project | `/api/send-email` | ScopeGuard -> Client | **Works** (if RESEND_API_KEY set) |
| 2 | Client submits CR on portal | `/api/notify-cr` | ScopeGuard -> Freelancer | **BROKEN** (missing SERVICE_ROLE_KEY) |
| 3 | Freelancer approves CR (pending-approvals page) | `/api/cr-action` | ScopeGuard -> Client | **Works** |
| 4 | Freelancer declines CR (pending-approvals page) | `/api/cr-action` | ScopeGuard -> Client | **Works** |
| 5 | Freelancer approves CR (projects page) | *none* | — | **MISSING** (no email sent) |
| 6 | Client approves scope on portal | `/api/scope-approved` | ScopeGuard -> Freelancer | **BROKEN** (missing SERVICE_ROLE_KEY) |

---

## 11. WHAT'S WORKING WELL

- Clean TypeScript types in `src/lib/types.ts`
- Consistent email template design across all 4 routes (dark header, white body, footer)
- Proper error handling pattern in all API routes (try/catch, status codes, error messages)
- Real-time subscription setup for live CR count updates
- Good use of Supabase RLS for DELETE operations (properly scoped to owner)
- Portal UI is well-designed with revision tracking, cost/time badges, status indicators
- CashRain celebration animation is a nice touch for approvals
- Revenue stats dashboard provides useful business metrics
- Search/filter on projects page
- 4-tier revision progress bar coloring
- Profile-based emoji customization for CashRain

---

## 12. RECOMMENDED FIX ORDER

| Priority | Item | Effort |
|---|---|---|
| **P0** | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Vercel | 5 min |
| **P0** | Fix scope approval flow: create projects as "Pending Approval", show button for that status | 15 min |
| **P0** | Lock down RLS: restrict projects UPDATE to owner OR only `status` column for public | 30 min |
| **P1** | Add email notification to projects page CR approval path | 15 min |
| **P1** | Add `middleware.ts` for auth route protection | 20 min |
| **P1** | Restrict projects SELECT to owner + portal (filter by ID for anon) | 20 min |
| **P1** | Remove excessive `console.log` from send-email route | 5 min |
| **P2** | Fix `&apos;` in scope-approved email HTML | 2 min |
| **P2** | Extract CashRain into shared component | 10 min |
| **P2** | Add `Number()` coercion for `timeImpactDays` in pending-approvals | 2 min |
| **P2** | Fix non-null assertion crash on orphaned CRs | 5 min |
| **P2** | Add click-outside handler for quick actions dropdown | 10 min |
| **P3** | Remove dead `saveProjectPublic()` function | 2 min |
| **P3** | Filter real-time subscriptions by project IDs | 15 min |
| **P3** | Add loading skeletons instead of returning null | 20 min |
| **P3** | Prevent negative numbers in portal CR cost/time fields | 5 min |
