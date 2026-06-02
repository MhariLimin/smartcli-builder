# smartcli-web — UI & Interactiveness Suggestions

**Author:** Claude session · **Date:** 2026-06-02
**Scope:** front-of-house experience only — what the user sees, touches, and
feels. Backend/data specs live in `.claude/context/specs/`; this document is
the UI lens over them.

This is a recommendations doc, not a spec. Each item notes the affected
component(s) and a rough effort tag (**S** = an afternoon, **M** = a day or
two, **L** = multi-day / depends on Tier 4–5 backend). Items are ordered so
the cheap, high-impact polish comes first and the Pro-tier surfaces come last.

**Every suggestion carries a visual example** — an ASCII mockup of the
layout/interaction, or a code sketch where that communicates the idea more
precisely. Mockups are illustrative, not pixel-spec; they exist to make the
intent unambiguous.

---

## Status (2026-06-02): specs filed

These suggestions have been promoted to pending feature specs under
`.claude/context/specs/pending/features/frontend/` (all frontend; the spec
tree is now organized by discipline — `frontend/ · backend/ · full-stack/ ·
deployment/ · tooling/ · meta/`). The roadmap in
`.claude/context/context.md` groups them as **Tier 6 — Frontend UX polish**
(§1–2, no backend dependency), plus the **Tier 4** account-auth-ui and the
**Tier 5** Pro UI specs (§4–6). Decisions taken while filing:

- **1.6 (command palette)** — a spec already existed
  (`command-palette-context.md`); it was **promoted** (its dependency, the
  sidebar nav, has shipped), not duplicated.
- **2.1 (typed inputs)** — the core already shipped
  (`typed-placeholders-context.md`: the form already renders number/select/
  checkbox by type). The new spec is the **enhancement** layer (steppers,
  segmented controls, reset-to-default) and extracts a reusable `<SlotInput>`.
- **2.2 (inline editing)** — expanded per your feedback into
  `inline-placeholder-editing-context.md`: inline-on-the-command-line editing
  that **reuses 2.1's `<SlotInput>`** so every placeholder type (text, number
  + stepper, dropdown) works inline, **plus a user preference** to choose the
  surface (below-the-line form vs inline). See the answer to your question
  below.
- **2.3 (recents/favorites)** — **dropped, per your call.** The Builder
  already has a Recent strip, and adding a "Favorites" concept would dilute
  the existing Saved-folders system. No spec filed.

### Answering your 2.2 questions

- **Difference between 2.2 and the segmented/select in 2.1?** They're
  *orthogonal*. 2.1 is about **which widget** renders for a slot (driven by
  the typed grammar — text vs number-with-stepper vs dropdown). 2.2 is about
  **where** you edit it (in the form below vs inline on the command line). The
  unified design makes the inline surface reuse 2.1's widgets, so they
  compose rather than compete.
- **What stops every placeholder being edited inline?** Nothing
  fundamental — and that's exactly the spec. The original
  `merged-input-preview` shipment *chose* the below-the-line form to avoid
  popover work and preserve hints cheaply; now that the per-type widget logic
  is centralized in `<SlotInput>`, inline editing reuses it rather than
  reinventing it, so "click `<count>` → inline number box with the same
  stepper" is the design.
- **User-chosen input method?** Yes — that's the headline of
  `inline-placeholder-editing-context.md`: a persisted preference toggling
  between the form and inline editing, both writing to the same
  position-tracked state so they stay consistent. Default stays the existing
  form so nothing changes until the user opts in.

---

## 0. Where the UI stands today

Grounding the suggestions in what actually exists:

- **Shell:** `App.tsx` → `Header` + `Sidebar` + routed `<main>`. Four
  destinations (Builder `/`, Saved, History, Catalog) via React Router v6,
  plus a `/c/:payload` share-link redirect.
- **Builder** (`BuilderView.tsx`) is the heart: a single mono input that *is*
  the command, a live suggestion list (prefix → extension → template), a
  placeholder form that substitutes in place, and a Copy / Save-to-folder /
  Share-link action row. Feedback is inline text flashes (`Copied!`,
  `✓ saved to history`).
- **Header** carries the logo, a **warm-wake pill** ("waking backend…") for
  Render cold starts, a theme switch (light/dark), and an **account dropdown
  whose Profile / Settings / Log out items are explicit stubs** ("Sign-in
  arrives with auth").
- **Keyboard** is already a first-class citizen: ↑/↓/Tab/Enter on the list,
  Cmd/Ctrl-Enter to copy, atomic `<slot>` deletion, Shift-? help modal.

**Today's layout, roughly:**

```
┌──────────────────────────────────────────────────────────────────┐
│ [logo] smartcli-web   Compose CLI commands     [waking…]  (G Guest ▾)│  ← Header
├────────────┬─────────────────────────────────────────────────────┤
│ ▸ Builder  │  Build a command                                     │
│   Saved    │  ┌─────────────────────────────────────────────┐     │
│   History  │  │ kubectl get pods -n <namespace>          ✕ │     │  ← Builder input
│   Catalog  │  └─────────────────────────────────────────────┘     │
│            │  [ suggestion list … ]                               │
│  (sidebar) │  [ placeholder form … ]                              │
│            │  [Copy command] [Save to folder…] [Share link]  ✓ saved│ ← inline flashes
└────────────┴─────────────────────────────────────────────────────┘
```

So the foundation is genuinely good. The gaps are: **feedback is scattered and
text-only**, **discovery relies on the user knowing to type**, the **account
menu writes a cheque auth hasn't cashed**, and there is **no visible surface
for the Pro tier** that the specs now describe. The suggestions below close
those.

---

## 1. Quick wins on the existing app (do these regardless of Pro)

### 1.1 Unify feedback into a toast system — **M**
Right now success/error states are bespoke inline `<span>`s scattered through
`BuilderView` (`copiedFlash`, `savedFlash`, `savedToFolderFlash`, `shareFlash`,
`shareError`) plus the `setTimeout` cleanup for each. That's five pieces of
near-duplicate state.

**Visual — one consistent corner instead of five inline spans:**

```
                                          ┌─────────────────────────────┐
   …main content…                         │ ✓ Copied — saved to history │  ⟵ auto-dismiss 2s
                                          └─────────────────────────────┘
                                          ┌─────────────────────────────┐
                                          │ ⚠ Clipboard blocked      ✕ │  ⟵ error: manual dismiss
                                          │   Link: https://…/c/AbC…    │
                                          └─────────────────────────────┘
                                                          (bottom-right, stacked)
```

**Code sketch — replaces the scattered flash state:**

```tsx
// before (in BuilderView): five of these
const [copiedFlash, setCopiedFlash] = useState(false);
setCopiedFlash(true); setTimeout(() => setCopiedFlash(false), 1500);
{copiedFlash && <span className="text-xs text-emerald-700">✓ saved</span>}

// after: one hook, used everywhere
const toast = useToast();
toast.success('Copied — saved to history');         // auto-dismiss
toast.error('Clipboard blocked', { url: result.url }); // sticky + dismiss
```

- `<ToastViewport>` bottom-right, stacked, `aria-live="polite"`. ~60 lines, no
  library.
- **Why it matters:** the user learns *one* place to look for "did that work?"
  and the action row stops carrying five conditional spans.

### 1.2 Command preview / "what will run" line — **S**
The input *is* the command, which is elegant but means a half-filled template
shows raw `<…>` in the very place the user copies from.

**Visual — a read-only strip under the action row:**

```
 input:   kubectl get pods -n <namespace> --field-selector status.phase=<phase>

 ┌─ Will copy ─────────────────────────────────────────────────────────────┐
 │ kubectl get pods -n ⟨namespace⟩ --field-selector status.phase=Running    │
 │                       └─ amber: still empty      green: filled ─┘         │
 └──────────────────────────────────────────────────────────────────────────┘
```

Amber chip = unfilled slot, green = filled. Reuses the existing
`remainingPlaceholders` / `filled` data — no new state, just a render of what's
already tracked.

### 1.3 Make Copy feel physical — **S**
The button swaps text to `Copied!` for 1.5s. Add an icon transition + a subtle
pulse so the single most-used action feels rewarding.

**Visual — button states:**

```
 idle:     [ 📋  Copy command ]
 success:  [ ✓   Copied!      ]   ← green flash + 150ms scale pulse, reverts after 1.5s
 disabled: [ 📋  Copy command ]   ← greyed when command is empty
```

Pair with the toast (1.1) so there's both a local (button) and global (toast)
signal.

### 1.4 Empty states with a path forward — **S**
Saved / History / Catalog hit an empty array on first run. Turn dead ends into
guided first-runs.

**Visual — History, empty:**

```
 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │                       🕑                                 │
 │           No commands yet                                │
 │   Commands you copy in the Builder show up here.         │
 │                                                          │
 │                 [  Open the Builder  ]                   │  ← single primary CTA
 │                                                          │
 └──────────────────────────────────────────────────────────┘
```

Especially valuable for a portfolio reviewer clicking around for 30 seconds.

### 1.5 Skeleton / shimmer instead of bare "loading" — **S**
List/page loads are abrupt today. Add lightweight animated skeleton rows.

**Visual — suggestion list while fetching (the bars shimmer):**

```
 ┌──────────────────────────────────────────────┐
 │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
 │ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
 └──────────────────────────────────────────────┘
   animate-pulse over bg-slate-200 / dark:bg-slate-800
```

Combined with the warm-wake pill, the first cold-Render load stops feeling
broken.

### 1.6 A global command palette (⌘K) — **M**
The app is already keyboard-forward; lean all the way in. A ⌘K / Ctrl-K overlay
that fuzzy-searches **catalog templates + saved commands + nav destinations**.

**Visual — the overlay:**

```
        ┌──────────────────────────────────────────────────────┐
        │ 🔍  kubectl rollo|                                    │
        ├──────────────────────────────────────────────────────┤
        │ TEMPLATES                                            │
        │  ▸ kubectl rollout restart deployment/<name> -n <ns> │  ← ↑/↓ to move
        │    kubectl rollout status deployment/<name>          │
        │ SAVED                                                │
        │    "restart api" → kubectl rollout restart …         │
        │ GO TO                                                │
        │    History · Catalog · Saved                         │
        ├──────────────────────────────────────────────────────┤
        │  ↵ insert into Builder    ⌥↵ copy    esc close       │
        └──────────────────────────────────────────────────────┘
```

The single feature that most makes a CLI-adjacent tool feel "pro" to a
technical audience. Reuses the suggestion API and the route/share plumbing that
already exist.

### 1.7 Mobile / narrow-width pass — **S/M**
`Sidebar` already collapses to a `w-14` icon rail at `sm`. Audit the Builder at
~360px.

**Visual — narrow layout (icon rail + stacked actions):**

```
 ┌───┬────────────────────────────┐
 │ ▸ │ kubectl get pods …      ✕ │   ← clear-✕ must not crowd input
 │ ▢ │ [ suggestions ]            │
 │ 🕑│ ┌──────────────────────┐   │
 │ ▦ │ │ Copy command         │   │   ← actions stack, full-width
 │   │ ├──────────────────────┤   │
 │   │ │ Save to folder…      │   │   ← min 44px tap targets
 │   │ └──────────────────────┘   │
 └───┴────────────────────────────┘
```

Confirm the `flex-wrap` action row stacks cleanly and suggestions are tappable.

---

## 2. Making the Builder more interactive

### 2.1 Per-slot input affordances driven by the typed-placeholder grammar — **M**
The grammar already supports `name:type`, `name:type=default`, and
`name|opt1,opt2` (parsed by `parseSlot`). Render the placeholder form *to that
grammar* instead of plain text inputs.

**Visual — same template, smarter inputs:**

```
 Template: kubectl scale deploy/<name> --replicas=<count:int=1> -n <env|dev,staging,prod=dev>

 ┌─ Fill placeholders ─────────────────────────────────────────────┐
 │  name      [ api-server            ]   ← plain text               │
 │  count:int [  3 ] [▲]                  ← number input + steppers  │
 │                  [▼]                                              │
 │  env       (•) dev  ( ) staging  ( ) prod   ↺ default             │  ← segmented / select
 └──────────────────────────────────────────────────────────────────┘
```

Turns "fill the blank" into a guided mini-form — the most visible payoff of the
typed-placeholder work that already shipped.

### 2.2 Inline slot editing in the input itself — **L**
Click a `<namespace>` token *inside* the command line and edit it in place via
a popover.

**Visual — token popover:**

```
 kubectl get pods -n [ namespace ▾]
                      └─────────────┐
                      │ namespace:  │
                      │ [ staging  ]│
                      │  staging    │  ← suggestions from history
                      │  prod       │
                      └─────────────┘
```

Higher effort and fiddly with the existing position-tracking logic — flag as a
**stretch**, not near-term.

### 2.3 Recently-used + favorites ahead of catalog suggestions — **DROPPED (2026-06-02)**
> **Not pursued.** The Builder already surfaces a Recent strip, and a
> "Favorites" concept would dilute the existing Saved-folders system (which
> is the deliberate home for curated commands). No spec filed. The mockup
> below is kept only for reference.

When the input is empty, the Builder shows six hard-coded `STARTER_SUGGESTIONS`.
Lead with the user's *actual* recents/favorites instead.

**Visual — empty Builder, personalized:**

```
 ┌─────────────────────────────────────────────┐
 │ Start typing… e.g. 'kubectl get'             │
 ├─────────────────────────────────────────────┤
 │ ★ FAVORITES                                 │
 │   git push origin main                       │
 │ 🕑 RECENT                                    │
 │   kubectl logs -f api-7d… -n staging         │
 │   docker compose up -d                       │
 │ ✦ STARTERS  (only if history is empty)      │
 │   kubectl get pods -n <namespace>            │
 └─────────────────────────────────────────────┘
```

Falls back to starters only on a truly empty install. Reduces typing for repeat
tasks via the existing `useHistory()` hook.

### 2.4 Destructive-command awareness in the free app — **S**
The Pro k8s/ssh/AI specs all describe a destructive-command confirm gate. Bring
a *read-only* version to the free Builder now.

**Visual — amber banner above Copy when the command matches the denylist:**

```
 input:  kubectl delete pods --all -n staging

 ┌────────────────────────────────────────────────────────────┐
 │ ⚠  Destructive — this deletes resources. Double-check the   │
 │    namespace before you run it.                             │
 └────────────────────────────────────────────────────────────┘
 [ Copy command ]  [ Save to folder… ]  [ Share link ]
```

Cheap, improves safety UX, and pre-builds the visual language the Pro features
reuse. Matches on `rm -rf`, `delete`, `--force`, `drop`, `kubectl delete`.

---

## 3. Auth & account UI (Tier 4 — fix the cheque the menu is writing)

The `Header` dropdown currently shows **Guest** with stubbed Profile / Settings
/ Log out and the disclaimer "Sign-in arrives with auth." Once
`[[login-account-context]]` lands, this becomes the most-scrutinized 200px of
the app.

**Visual — before (today) vs after (post-auth):**

```
 ── TODAY (stub) ──────────         ── SIGNED OUT ──────────       ── SIGNED IN ──────────
 ( G  Guest ▾ )                     (  Sign in  )                  ( 🟢 ML  Mhari ▾ )
  ┌─────────────────────┐                                          ┌─────────────────────┐
  │ Theme  ● Dark       │            ┌─────────────────────┐       │ Mhari Limin         │
  │ ───────────────     │            │  Sign in to smartcli│       │ ai_seat08@…         │
  │ Profile   (stub)    │            │  [ ✉ Email ]        │       │ Theme ● Dark        │
  │ Settings  (stub)    │            │  [  Google  ]       │       │ ─────────────       │
  │ Log out   (stub)    │            │  [  GitHub  ]       │       │ Settings            │
  │ "arrives with auth" │            └─────────────────────┘       │ Log out             │
  └─────────────────────┘                                          └─────────────────────┘
```

- Don't ship dead menu items past auth — hide Profile/Settings until they route
  somewhere real.
- **Why now:** the disclaimer is good interim honesty, but it's the first thing
  a reviewer reads. Closing it is the visual proof Tier 4 shipped.

---

## 4. Workspaces & the FREE/PRO seam (Tier 5)

These surfaces don't exist yet but the specs assume them. Designing them as
*UI* now keeps the backend specs honest.

### 4.1 Workspace switcher — **M** (needs `[[team-workspaces-context]]`)
A switcher in the Header: current workspace, membership dropdown, "Create
workspace", and a per-workspace **`PlanBadge`**.

**Visual:**

```
 [ 🗂 Mhari's Space  · FREE ▾ ]
  ┌──────────────────────────────────┐
  │ ✓ Mhari's Space        FREE       │  ← personal, auto-created on login
  │   Acme Platform Team   PRO ★      │
  │   Side Project         FREE       │
  │ ─────────────────────────────────│
  │ + Create workspace                │
  └──────────────────────────────────┘
```

Active workspace is what every Pro feature scopes to (`X-Workspace-Id`) — must
be glanceable at all times.

### 4.2 `<ProGate>` and the upsell card — **M** (needs `[[entitlements-feature-gating-context]]`)
The spec names `<ProGate capability="…">`, `UpsellCard`, `PlanBadge`. The UX
contract is the bit worth nailing.

**Visual — render the real chrome dimmed-and-locked, NOT hidden:**

```
 ┌─ AI Command Generation ───────────────────────── 🔒 PRO ─┐
 │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← real UI, dimmed
 │  ░ Describe a task…                              ░░░░░  │
 │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
 │                                                         │
 │        ┌─────────────────────────────────────┐         │
 │        │  ★ Unlock with Smart CLI Pro        │         │  ← UpsellCard (one reused component)
 │        │  Team templates, AI generation,     │         │
 │        │  k8s & SSH helpers.                 │         │
 │        │           [ Upgrade to Pro → ]      │         │
 │        └─────────────────────────────────────┘         │
 └─────────────────────────────────────────────────────────┘
```

**Code sketch — same component everywhere, and `402` reuses it:**

```tsx
<ProGate capability="ai.generate">
  <AiGeneratePanel />          {/* entitled → real feature */}
</ProGate>                     {/* not entitled → <UpsellCard capability="ai.generate"/> */}

// api/client.ts — a hand-crafted request that hits 402 surfaces the SAME card
if (res.status === 402) openUpsell(await res.json());  // { capability, plan }
```

Seeing what you'd get is the whole freemium mechanic — don't hide it. Server
still returns `402`; the lock is UX only.

### 4.3 Invite & members UI — **M** (needs `[[team-workspaces-context]]`)
Members table with role pills + an invite flow. Invites echo the token in
dev/demo mode, so mirror the existing Share-link copy UX.

**Visual:**

```
 Members — Acme Platform Team
 ┌────────────────────────────┬──────────┬──────────────┐
 │ Mhari Limin (you)          │ OWNER    │              │
 │ dana@acme.dev              │ ADMIN    │ [⋯]          │
 │ sam@acme.dev               │ MEMBER   │ [⋯]          │
 │ viewer@acme.dev            │ VIEWER   │ [⋯]          │
 └────────────────────────────┴──────────┴──────────────┘
 [ + Invite member ]
   └─▸ invite created (dev mode):
       ┌──────────────────────────────────────────────┐
       │ https://…/invite/9f2a…           [ 📋 Copy ] │  ← same copy+toast as Share link
       └──────────────────────────────────────────────┘
```

### 4.4 Sidebar grows Pro destinations — **S** (gated)
`NAV_ITEMS` in `Sidebar.tsx` is a clean array — add AI / Kubernetes / SSH with a
lock glyph on FREE.

**Visual:**

```
 ┌─────────────────┐
 │ ▸ Builder       │
 │   Saved         │
 │   History       │
 │   Catalog       │
 │ ─────────────── │
 │   AI Generate 🔒│  ← FREE: routes to upsell
 │   Kubernetes  🔒│
 │   SSH         🔒│
 └─────────────────┘
   (locks disappear once the active workspace is PRO)
```

Keeps discovery high even before upgrade.

---

## 5. Pro feature pages — the interactive payoffs

### 5.1 AI command generation page — **L** (`[[ai-command-generation-context]]`)
The headline Pro surface — give it the most interaction design.

**Visual — full page:**

```
 AI Command Generation                              Usage: ▓▓▓▓▓░░░░░ 12/50 today
 ┌──────────────────────────────────────────────────────────────────────┐
 │ Describe what you want to do…                                          │
 │ "delete all failed pods in staging"                                    │
 │ Tool: ( kubectl ) ( docker ) ( git ) ( aws ) ( shell )    [ Generate ]│  ← segmented hint
 └──────────────────────────────────────────────────────────────────────┘
 ┌─ Result ───────────────────────────────────────────────────────────────┐
 │ ⚠ Destructive — deletes resources. Review before running.              │
 │ ┌────────────────────────────────────────────────────────────────────┐ │
 │ │ kubectl delete pods --field-selector status.phase=Failed -n staging│ │  ← editable
 │ └────────────────────────────────────────────────────────────────────┘ │
 │ Why: selects pods whose phase is Failed and removes them…              │
 │ [ 📋 Copy ]   [ ★ Save as template ]            (no "run" button)      │
 └──────────────────────────────────────────────────────────────────────────┘
```

- **Stream the result** token-by-token (the spec leaves this open — from a UX
  standpoint, stream it; it reads as "AI" far more than a spinner).
- `UsageMeter` makes the quota *visible*; when exhausted, the card becomes the
  upsell. Never an auto-run button (matches "never executed server-side").

### 5.2 Shared workflow runner (k8s + SSH) — **L** (`[[kubernetes-helpers-context]]`, `[[ssh-workflow-management-context]]`)
Both specs share a `WorkflowStepper`. Make that one component excellent.

**Visual — per-step copy + done tracking, live context at top:**

```
 Context: [ prod-us-east · ns: payments ▾ ]      ← change → every step re-renders

 "Restart & watch"
 ┌──────────────────────────────────────────────────────────────────────┐
 │ ✓ 1  kubectl rollout restart deploy/api -n payments      [📋] [done]  │
 │ ▸ 2  kubectl rollout status deploy/api -n payments       [📋] [done]  │  ← current
 │   3  kubectl logs -f deploy/api -n payments              [📋] [done]  │
 │ ⚠ 4  kubectl delete pod api-old-xyz -n payments          [📋] [done]  │  ← destructive → ConfirmModal
 └──────────────────────────────────────────────────────────────────────┘
```

The per-step done-toggle (an open question in the k8s spec) is the more
interactive answer — it lets a user track their place mid-workflow. Reuse
`ConfirmModal` for destructive steps.

### 5.3 Shared templates editor — **M/L** (`[[shared-templates-context]]`)
Extend `Catalog.tsx` to show workspace templates alongside built-ins, clearly
distinguished.

**Visual — Catalog with both sources:**

```
 Catalog                                   workspace: Acme Platform Team (PRO)
 ┌─ BUILT-IN (read-only) ─────────────┐  ┌─ WORKSPACE TEMPLATES ──────────────┐
 │ 🔒 kubectl get pods -n <namespace> │  │ ✎ deploy api   git pull && ./ship  │
 │ 🔒 docker ps                       │  │ ✎ tail logs    kubectl logs -f …   │
 │ 🔒 git status                      │  │ [ + New template ]                 │  ← MEMBER+ only
 └────────────────────────────────────┘  └────────────────────────────────────┘
   (FREE workspace sees only the left column; edit ✎ hidden for VIEWER / FREE)
```

The editor reuses `PlaceholderForm` + the Builder suggestion input, so an author
sees the *exact* live preview teammates will get.

---

## 6. Billing return experience — **M** (`[[billing-stripe-context]]`)

`pages/BillingReturn.tsx` polls entitlements until the webhook flips the plan,
and the spec flags Render cold-start delay. The UX of *waiting* is the whole
thing.

**Visual — the three states:**

```
 ── WAITING ───────────────────       ── SUCCESS ───────────────────────────
 ┌───────────────────────────┐        ┌─────────────────────────────────────┐
 │        ◜◝ (spinner)        │        │   🎉  You're on Smart CLI Pro       │
 │  Confirming your upgrade…  │        │   You just unlocked:                │
 │  This can take a few       │        │    ✓ Invite teammates  →            │
 │  seconds on first load.    │        │    ✓ Shared templates  →            │
 └───────────────────────────┘        │    ✓ AI command generation →        │  ← each links to the feature
                                       │    ✓ k8s & SSH helpers →            │
 ── TIMEOUT (reassure) ────────        │            [ Start building ]       │
 │ ✓ Payment received — your   │       └─────────────────────────────────────┘
 │   plan will update shortly. │
 └─────────────────────────────┘       (webhook is authoritative; never show a hard error here)
```

Turns a transaction into an onboarding moment; the timeout state reassures
rather than errors, because a cold dyno may simply be slow.

---

## 7. Cross-cutting interaction polish

| Item | Effort | Note / example |
|---|---|---|
| Toast system (see 1.1) — the backbone the rest leans on | M | Build first; see §1.1 mockup |
| Reduced-motion (`prefers-reduced-motion`) for all new animation | S | `@media (prefers-reduced-motion) { animate-none }` |
| Focus management on modal open/close | S | Trap focus, restore to trigger on close (ConfirmModal, SaveToFolder, upsell) |
| Optimistic UI for Save/favorite with rollback | M | Star fills instantly → reverts + toast.error on failure |
| Consistent `aria-live` for async results | S | Extend the warm-wake pattern (it already does this) |
| `/login` and `/settings` routes so the menu stops dead-ending | M | Pairs with §3 |

**Example — reduced-motion + focus restore, the two most-missed:**

```tsx
// reduced-motion: gate the pulse/shimmer
<button className="transition motion-reduce:transition-none ...">

// focus restore: remember the trigger, return focus on close
const trigger = useRef<HTMLElement|null>(null);
const open  = (e) => { trigger.current = e.currentTarget; setOpen(true); };
const close = ()  => { setOpen(false); trigger.current?.focus(); };
```

---

## Recommended sequence

1. **Toasts (1.1) + preview line (1.2) + empty states (1.4)** — pure
   front-end, no backend dependency, immediately lifts the free app and the
   portfolio first-impression.
2. **Command palette (1.6) + typed-slot inputs (2.1) + destructive banner
   (2.4)** — deepen the Builder; still no backend dependency.
3. **Auth account UI (§3)** — as Tier 4 lands; closes the "stub menu" gap.
4. **Workspace switcher + ProGate/upsell (§4)** — the freemium seam.
5. **AI page, workflow runner, billing return (§5–6)** — the Pro payoffs, in
   the spec build order (templates → AI → k8s/ssh → billing).

The first two tiers need **zero backend work** and deliver most of the
perceived-quality jump — worth doing before the Pro tier is even unblocked.

---

*Cross-references: `[[entitlements-feature-gating-context]]`,
`[[billing-stripe-context]]`, `[[ai-command-generation-context]]`,
`[[shared-templates-context]]`, `[[kubernetes-helpers-context]]`,
`[[ssh-workflow-management-context]]`, `[[team-workspaces-context]]`,
`[[login-account-context]]` — under `.claude/context/specs/pending/features/`
(now in `full-stack/`, `backend/`, etc. by discipline). The frontend UI specs
filed from this document live in `.../pending/features/frontend/`.*
