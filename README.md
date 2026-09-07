# ChopRoute

A MERN-stack food delivery platform built for independent restaurants in
Lagos — the small vendors who can't clear the onboarding bar or afford the
infrastructure that bigger delivery platforms assume you already have.

> Customers browse nearby restaurants, order, and pay with Paystack. Vendors
> onboard in minutes through a form reviewed by AI, not a documentation pile.
> Orders are tracked end-to-end, backed by a real order state machine.

---

## Why this exists

Most delivery platforms are built for restaurants that already have a digital
presence, staff to manage an order queue, and the paperwork to pass
verification on day one. A huge number of small, single-location vendors
don't have any of that — so they stay offline, even though their customers
are already ordering food through apps every day.

ChopRoute is designed around removing that friction:

- **Low-friction onboarding** — sign up with a phone number, fill a simple
  menu form, and go live the same day. Full verification happens in the
  background, not as a gate.
- **AI as a reviewer, not a gatekeeper** — vendors type their own menu data;
  an AI pass catches likely errors (missing fields, price outliers,
  duplicates) and suggests fixes the vendor can accept, edit, or reject.
  Nothing publishes without the vendor's confirmation.
- **A shared delivery backbone** — a single dispatch layer serves every
  vendor on the platform, so no one restaurant needs its own fleet of riders.

---

## Features (v1)

- Customer signup with phone/OTP verification
- Browse restaurants near a saved address
- Cart, checkout, and delivery cost estimate
- Payments via Paystack, with webhook signature verification and idempotent
  processing
- Vendor signup and AI-reviewed menu onboarding
- Full order lifecycle: confirmed → preparing → ready → rider assigned →
  delivered
- In-house rider matching (nearest-available assignment)
- AI-powered customer support chat with order lookup

## Roadmap (documented, not yet built)

These are designed in detail — see [`docs/system-flows.md`](./docs/system-flows.md)
— but intentionally out of scope for v1 so the core product ships first:

- WhatsApp-based vendor order management (accept/ready via WhatsApp instead
  of an in-app dashboard)
- Pluggable external dispatch provider (e.g. Kwik, GIG Logistics) behind the
  same `DispatchProvider` interface used internally
- Human-agent live chat with AI handoff
- Scheduled payment reconciliation against Paystack's transaction API
- OTP/AI-review rate limiting and abuse protection at production scale

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React | Next.js
| Backend | Node.js / Express |
| Database | MongoDB |
| Real-time | Socket.IO |
| Payments | Paystack |
| AI | Claude API (menu review, support assistant) |
| Auth | Phone number + OTP (SMS gateway) |

---

## Architecture

- **Core API** handles orders, vendors, users, and auth.
- **Dispatch** is abstracted behind a `DispatchProvider` interface, with an
  in-house nearest-rider implementation for v1 and a documented seam for
  swapping in a third-party logistics API later.
- **Vendor status** is tracked on two independent fields, not one:
  - `verificationTier`: `unverified → pending → verified` (KYC/trust)
  - `storefrontStatus`: `editing → queued_for_review → rejected → live`
    (menu/AI-review lifecycle)

  A vendor can be `live` and `unverified` at the same time — that's
  intentional, so a new vendor can start selling immediately while trust
  verification happens in the background.

Full sequence diagrams for every major flow (customer order, vendor
onboarding, payment handling, support) are in
[`docs/system-flows.md`](./docs/system-flows.md).

---

## Getting started

```bash
git clone https://github.com/<your-username>/chowroute.git
cd chowroute

# install dependencies
cd server && npm install
cd ../client && npm install

# set up environment variables (see below), then:
cd ../server && npm run dev
cd ../client && npm run dev
```

### Environment variables

Create a `.env` file in `/server`:

```
MONGODB_URI=
JWT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
ANTHROPIC_API_KEY=
SMS_GATEWAY_API_KEY=
```

---

## Project structure

```
chowroute/
├── client/          # React frontend
├── server/          # Express API
│   ├── models/      # Mongoose schemas (User, Vendor, Order, Rider)
│   ├── routes/       
│   ├── services/    # dispatch, payments, ai-review, notifications
│   └── webhooks/    # Paystack, dispatch provider
├── docs/
│   └── system-flows.md   # sequence diagrams for every major flow
└── README.md
```

---

## License

MIT
