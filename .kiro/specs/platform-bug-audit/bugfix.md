# Bugfix Requirements Document — BharatPredict Platform Bug Audit

## Introduction

A comprehensive audit of the BharatPredict prediction market platform (NestJS API + Next.js 14 frontend monorepo) has identified **12 bugs** ranging from critical financial logic errors to UI state issues. Bugs are ordered by severity: **Critical → High → Medium → Low**. This document captures each bug using the bug condition methodology, specifying defective behavior, correct expected behavior, and regression-prevention constraints.

**Files audited:** `apps/api/src/modules/copytrading/copytrading.service.ts`, `apps/api/src/modules/payments/payments.service.ts`, `apps/api/src/modules/payments/payments.controller.ts`, `apps/api/src/main.ts`, `apps/api/src/modules/realtime/realtime.gateway.ts`, `apps/api/src/modules/trade/trading.service.ts`, `apps/api/src/modules/trade/lmsr.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/seed.ts`, `apps/web/src/hooks/useWallet.ts`, `apps/web/src/app/market/[id]/page.tsx`, `apps/web/src/components/Sidebar.tsx`

## Bug Analysis

### Current Behavior (Defect)

**[BUG-01 — CRITICAL] CopyTrading money printer: `simulateLeaderTrades` runs on every `getActiveRelations` call**

1.1 WHEN `GET /copytrading/active?userId=X` is called THEN the system executes `simulateLeaderTrades()` which has a 60% probability (`Math.random() > 0.4`) of crediting ₹15–₹100 to the user's wallet per active copy relation on every single read request

1.2 WHEN the frontend polls `fetchCopyRelations()` every 4 seconds THEN the system continuously inflates the user's wallet balance with fabricated profits and creates real `SETTLEMENT` transaction ledger entries in the database on every poll cycle

---

**[BUG-02 — CRITICAL] Payment flow broken: `simulateWebhook` generates a signature but never calls the webhook endpoint**

1.3 WHEN `POST /payments/simulate-webhook` is called with `{ orderId, amount, userId }` THEN the system generates a cryptographic HMAC signature and returns `{ payload, signature }` to the caller but does NOT forward the payload to `POST /payments/webhook`

1.4 WHEN a user initiates a deposit via `POST /payments/create-order` THEN the system creates a `PENDING` transaction record that is never transitioned to `SUCCESS`, leaving the user's wallet balance unchanged permanently

---

**[BUG-03 — CRITICAL] CORS misconfiguration: `credentials: true` with wildcard `origin: '*'`**

1.5 WHEN the NestJS API starts with `app.enableCors({ origin: '*', credentials: true })` THEN the system configures an invalid CORS policy that browsers reject per the CORS specification — wildcard origin is incompatible with `credentials: true`

1.6 WHEN a browser makes a credentialed request (with cookies or `Authorization` headers) to the API THEN the system causes the browser to block the response with a CORS error

---

**[BUG-04 — HIGH] Comment UI not updated after successful POST**

1.7 WHEN a user posts a comment and `POST /markets/:id/comments` succeeds THEN the system only clears the input field but does NOT add the new comment to the local `comments` state — the comment only appears if the WebSocket `new_comment_${marketId}` event is received

---

**[BUG-05 — HIGH] WebSocket trade broadcast: `trade.marketId` is undefined**

1.8 WHEN a trade is executed THEN the system calls `broadcastNewTrade({ id, username, avatar, marketTitle, side, amount, shares, price, createdAt })` — the object does NOT include `marketId`, so `this.server.to('market:${trade.marketId}')` emits to room `market:undefined` and no subscribed client receives the `trade:new` event

---

**[BUG-06 — HIGH] LMSR `calculateYesSharesForCash` returns NaN for near-zero `diff`**

1.9 WHEN `diff = x2 - x1` is a very small negative number close to zero (e.g., `-1e-15`) THEN the system computes `Math.exp(diff) ≈ 1`, making `1 - Math.exp(diff) ≈ 0`, and `Math.log(~0) = -Infinity`, causing `finalQ1 = -Infinity` and `shares = NaN`

1.10 WHEN `shares = NaN` THEN the system's guard `if (shares <= 0)` evaluates to `false` (because `NaN <= 0` is `false`), allowing a trade with `NaN` shares to proceed through the execution pipeline

---

**[BUG-07 — HIGH] Hardcoded `USER_ID` breaks entire app if seed not run**

1.11 WHEN the database has not been seeded (or was reset) THEN the system has no user with `id = 'anshuman-user-uuid'`, causing every API call that uses `USER_ID` to return `404 User not found` and the entire frontend to be non-functional

1.12 WHEN `fetchPortfolio` returns a 404 THEN the system silently leaves the wallet balance at the stale default of ₹25,000 with no visible error to the user

---

**[BUG-08 — MEDIUM] `CopyTradingRelation.leaderId` has no foreign key constraint**

1.13 WHEN `POST /copytrading/start` is called with a `leaderId` that does not correspond to any existing `User.id` THEN the system creates a `CopyTradingRelation` record with an invalid `leaderId` without any validation error, creating orphaned relations

---

**[BUG-09 — MEDIUM] `useWallet.init()` called on every page mount causes redundant API calls**

1.14 WHEN a user navigates between pages THEN the system calls `init()` on every page mount, re-running `fetchMarkets()`, `fetchPortfolio()`, and `fetchCopyRelations()` even though the Zustand store already has fresh data, amplifying BUG-01's money-printer effect on every navigation

---

**[BUG-10 — MEDIUM] Sidebar active state marks ALL category links active simultaneously on `/dashboard`**

1.15 WHEN the user is on the `/dashboard` route THEN the system evaluates `isActive` for Sports, Politics, and Finance links as `true` simultaneously because `item.href.includes('cat=') && pathname === '/dashboard'` is `true` for all three category links at once

---

**[BUG-11 — MEDIUM] Trade button permanently disabled when preview fetch fails silently**

1.16 WHEN the trade preview fetch (`GET /trade/preview`) fails (network error, 404, or 500) THEN the system catches the error silently with `console.error` and leaves `calculatedShares` at `0`, permanently keeping the trade submit button disabled with no feedback to the user

---

**[BUG-12 — LOW] Comment not shown after POST until WebSocket event arrives**

1.17 WHEN a user posts a comment and the POST succeeds THEN the system does not optimistically update the local comment list, so the comment only appears when the WebSocket event is received — if the event is delayed or missed, the user sees no confirmation their comment was saved

---

### Expected Behavior (Correct)

**[BUG-01 Fix]**

2.1 WHEN `GET /copytrading/active?userId=X` is called THEN the system SHALL return the current active relations without triggering any wallet mutations, profit simulations, or database writes

2.2 WHEN copy trading profit simulation is needed THEN the system SHALL only execute it via a dedicated scheduled job or explicit settlement endpoint, never as a side effect of a read operation

---

**[BUG-02 Fix]**

2.3 WHEN `POST /payments/simulate-webhook` is called THEN the system SHALL construct the signed payload AND internally invoke the webhook processing logic so the deposit is credited to the user's wallet

2.4 WHEN the webhook processing succeeds THEN the system SHALL update the `Transaction` status from `PENDING` to `SUCCESS` and increment the user's `walletBalance` by the deposited INR amount, then broadcast a `wallet:update` Socket.IO event

---

**[BUG-03 Fix]**

2.5 WHEN the API starts THEN the system SHALL configure CORS with an explicit allowed origin (e.g., from an `ALLOWED_ORIGIN` environment variable) instead of `'*'` when `credentials: true` is set

2.6 WHEN a browser makes a credentialed request from the allowed origin THEN the system SHALL respond with `Access-Control-Allow-Origin: <explicit-origin>` and `Access-Control-Allow-Credentials: true`

---

**[BUG-04 Fix]**

2.7 WHEN `POST /markets/:id/comments` returns a successful response with the created comment object THEN the system SHALL prepend the new comment to the local `comments` state immediately without waiting for the WebSocket event

---

**[BUG-05 Fix]**

2.8 WHEN `broadcastNewTrade` is called from `TradingService.executeTrade` THEN the system SHALL include `marketId` in the trade payload so `this.server.to('market:${trade.marketId}')` emits to the correct room

---

**[BUG-06 Fix]**

2.9 WHEN `diff` is in the range `(-1e-10, 0)` THEN the system SHALL use a numerically stable computation (e.g., `Math.log1p(-Math.exp(diff))` or clamp `diff` to `-1e-10`) to avoid `-Infinity` and `NaN`

2.10 WHEN `calculateYesSharesForCash` or `calculateNoSharesForCash` would produce `NaN` or `-Infinity` THEN the system SHALL return `0` and the calling service SHALL throw `BadRequestException('Trade size too small')`

---

**[BUG-07 Fix]**

2.11 WHEN `fetchPortfolio` returns a non-OK response THEN the system SHALL surface a visible error state in the UI rather than silently leaving stale data

2.12 WHEN the seed UUID is the source of truth THEN the system SHALL export it as a shared constant in `packages/types` so both `seed.ts` and `useWallet.ts` reference the same value and a mismatch is caught at compile time

---

**[BUG-08 Fix]**

2.13 WHEN `POST /copytrading/start` is called THEN the system SHALL validate that a `User` with `id = leaderId` exists and return `404 NotFoundException('Leader user not found')` if not

2.14 WHEN the Prisma schema is updated THEN `CopyTradingRelation.leaderId` SHALL be a proper foreign key referencing `User.id`

---

**[BUG-09 Fix]**

2.15 WHEN `init()` is called and the store has already been initialized (`isInitialized = true`) THEN the system SHALL skip all fetch calls and return early

2.16 WHEN the app loads for the first time THEN the system SHALL set `isInitialized = true` after the first successful `init()` so subsequent calls are no-ops

---

**[BUG-10 Fix]**

2.17 WHEN the user is on `/dashboard` with no `cat` query param THEN the system SHALL mark only the "Dashboard" link as active

2.18 WHEN the user is on `/dashboard?cat=IPL` THEN the system SHALL mark only the "Sports" link as active; similarly for `cat=Politics` → "Politics" and `cat=Finance` → "Finance"

---

**[BUG-11 Fix]**

2.19 WHEN the preview fetch fails THEN the system SHALL display an inline error message near the trade form and SHALL NOT permanently disable the trade button

2.20 WHEN `cashAmount` is a valid positive number and `market` is loaded THEN the system SHALL provide a way for the user to proceed with the trade even if the preview is temporarily unavailable

---

**[BUG-12 Fix]**

2.21 WHEN `POST /markets/:id/comments` returns a successful response THEN the system SHALL prepend the new comment to the local `comments` state immediately

2.22 WHEN the WebSocket event subsequently arrives with the same comment THEN the system SHALL deduplicate by comment `id` to avoid showing the comment twice

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user starts copy trading by calling `POST /copytrading/start` THEN the system SHALL CONTINUE TO deduct the allocated amount from the copier's wallet and create the `CopyTradingRelation` record correctly

3.2 WHEN `GET /copytrading/active` is called THEN the system SHALL CONTINUE TO return the list of active copy trading relations for the given user

3.3 WHEN `POST /payments/webhook` receives a request with an invalid HMAC signature THEN the system SHALL CONTINUE TO reject it with a 400 Bad Request

3.4 WHEN `POST /payments/webhook` receives a duplicate `payment.captured` event for an already-`SUCCESS` transaction THEN the system SHALL CONTINUE TO return `{ status: 'SUCCESS' }` idempotently without double-crediting

3.5 WHEN a request arrives from an origin not in the CORS allowed list THEN the system SHALL CONTINUE TO reject it with a CORS error

3.6 WHEN a WebSocket `new_comment_${marketId}` event is received THEN the system SHALL CONTINUE TO prepend the new comment to the comments list

3.7 WHEN a trade is broadcast THEN the system SHALL CONTINUE TO emit the global `new_trade` event to all connected clients for the scrolling ticker feed

3.8 WHEN `broadcastMarketPrice` is called with a valid `marketId` THEN the system SHALL CONTINUE TO emit `market:update` to the correct room

3.9 WHEN `cashAmount` is a normal positive value and `diff` is well below zero (e.g., `< -0.01`) THEN the system SHALL CONTINUE TO calculate LMSR shares correctly using the existing formula

3.10 WHEN `diff >= 0` in LMSR calculations THEN the system SHALL CONTINUE TO return `0` shares

3.11 WHEN the seed has been run and the user exists THEN the system SHALL CONTINUE TO load wallet balance, portfolio, and markets correctly on init

3.12 WHEN both `copierId` and `leaderId` reference valid users THEN the system SHALL CONTINUE TO create the copy trading relation and deduct the allocated amount

3.13 WHEN the app loads for the first time THEN the system SHALL CONTINUE TO fetch markets, portfolio, and copy relations on the first `init()` call

3.14 WHEN the user is on `/portfolio`, `/leaderboard`, `/wallet`, or `/admin` THEN the system SHALL CONTINUE TO mark only the matching navigation item as active

3.15 WHEN the preview fetch succeeds THEN the system SHALL CONTINUE TO display estimated shares, average price, and slippage in the trade panel

3.16 WHEN `cashAmount` is empty or zero THEN the system SHALL CONTINUE TO disable the trade button

3.17 WHEN a comment POST fails THEN the system SHALL CONTINUE TO leave the input text intact and show an error
