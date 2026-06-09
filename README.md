# BharatPredict 🇮🇳 — Trade What India Thinks

[![Live Site](https://img.shields.io/badge/Demo-Live_on_Vercel-blueviolet?style=for-the-badge&logo=vercel&logoColor=white)](https://bharatpredict-web.vercel.app/)

BharatPredict is a high-fidelity, real-time prediction market platform optimized for India (covering IPL cricket, stock indexes like NIFTY, assembly elections, and Bollywood movie openings). Users buy YES or NO shares on real-world events, where share prices represent crowdsourced probabilities in real time (e.g., ₹0.65 representing a 65% probability) and settle strictly at ₹1.00 for correct outcomes.

---

## ⚡ Quick Start: Running Instantly

Since this is a high-fidelity monorepo prototype, we have pre-configured everything to run with **zero dependencies** using an embedded **SQLite database**. You do **not** need Docker to run this!

### 1. Install Workspace Dependencies
From the monorepo root folder, run:
```bash
npm install
```

### 2. Generate Prisma Clients & Setup SQLite Database
Initialize the database models and run the automatic seed script to create the mock user (`Anshuman` with ₹25,000 capital) and the active Indian markets (CSK vs MI, NSE Nifty, Bihar Elections, Bollywood teaser):
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3. Launch Development Servers (Backend & Web Frontend)
Start both NestJS API (on port `4000`) and the Next.js 15 App (on port `3050`) in parallel using Turborepo:
```bash
npm run dev
```
Open [http://localhost:3050](http://localhost:3050) in your browser to start trading!

---

## 🏗️ Architectural Topology

BharatPredict is built inside a high-performance **Turborepo monorepo** containing separate microservices and package models.

```
/
├── apps/
│   ├── web/                     # Next.js 15 Webapp (Tailwind CSS, Recharts, Zustand)
│   └── api/                     # NestJS API (REST, Socket.IO gateway, LMSR Trading engine)
├── packages/
│   └── types/                   # Shared TypeScript models (User, Market, Holding, DTOs)
├── docker-compose.yml           # Production Docker configuration for Postgres & Redis
├── package.json                 # Monorepo Workspace Root
└── README.md                    # Setup & Mathematical formulation
```

---

## 📊 Quant Mechanics: Exact LMSR AMM

The platform uses a Logarithmic Market Scoring Rule (LMSR) Automated Market Maker (AMM) to provide guaranteed liquidity. Let:
- $q_1$: YES shares outstanding
- $q_2$: NO shares outstanding
- $b$: Market liquidity parameter (governing price elasticity)
- $C(q_1, q_2) = b \cdot \ln\left(e^{q_1/b} + e^{q_2/b}\right)$: Cost function representing total liquidity pool cash.

### 1. Spot Pricing
The spot prices representing crowdsourced probability are computed analytically:
- $P_{\text{YES}} = \frac{e^{q_1/b}}{e^{q_1/b} + e^{q_2/b}}$ (clamped in $[0.02, 0.98]$)
- $P_{\text{NO}} = 1 - P_{\text{YES}} = \frac{e^{q_2/b}}{e^{q_1/b} + e^{q_2/b}}$

To prevent floating-point overflow during exponential checks under heavy volume, the engine implements a **Log-Sum-Exp** numerical stabilizer:
$$C(q_1, q_2) = b \cdot \left[ m + \ln\left(e^{q_1/b - m} + e^{q_2/b - m}\right) \right] \quad \text{where } m = \max\left(\frac{q_1}{b}, \frac{q_2}{b}\right)$$

### 2. Analytical Fixed-Cash Purchases
Rather than forcing users to guess share volumes, they input exact cash amounts in INR ($A$). The engine resolves this analytically in $O(1)$ time to output the exact share quantities ($\Delta s$) they receive:

- **Buying YES shares with amount $A$**:
  $$\Delta s = b \cdot \ln\left(e^{(A + C(q_1, q_2))/b} - e^{q_2/b}\right) - q_1$$
  
  *Numerically stabilized fallback computation:*
  $$\Delta s = b \cdot \left[ x_1 + \ln\left(1 - e^{x_2 - x_1}\right) \right] - q_1 \quad \text{where } x_1 = \frac{A + C_0}{b}, \ x_2 = \frac{q_2}{b}$$

- **Buying NO shares with amount $A$**:
  $$\Delta s = b \cdot \ln\left(e^{(A + C(q_1, q_2))/b} - e^{q_1/b}\right) - q_2$$

---

## 🔌 API Documentation Maps

### 1. Markets
- **`GET /markets`**: Fetch all active prediction markets with live LMSR YES/NO spot prices.
- **`GET /markets/:id`**: Retrieve specific market detail, historical price timelines, simulated orderbooks, and recent trades.

### 2. Trading Desk
- **`POST /trade`**: Place a trade under transactional safety.
  - *Payload DTO:*
    ```json
    {
      "userId": "anshuman-user-uuid",
      "marketId": "market-uuid",
      "side": "YES",
      "amount": 1000.00
    }
    ```

### 3. Wallet Ledger
- **`GET /wallet?userId=...`**: Fetch active wallet balances and transactions history.
- **`POST /wallet/deposit`**: Deposit simulated funds (triggers UPI QR flows).
- **`POST /wallet/withdraw`**: Withdraw funds.

---

## 🛣️ Future Roadmap

1. **Production Database Scale**: Switch Prisma datasource back to PostgreSQL and plug Redis caching layers in docker networks.
2. [x] **P2P Orderbook Matcher**: Upgrade from AMM-only to a hybrid model supporting peer-to-peer limit orders. (Completed!)
3. **Decentralized Resolvers**: Plug oracle resolutions or public consensus vote pools.
4. **Real UPI Integrations**: Connect Razorpay/Cashfree sandbox endpoints for genuine merchant UPI callbacks.
