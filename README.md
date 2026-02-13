# Professional Web Design Website

A modern, responsive website for web design services featuring integrated payment processing with Stripe and domain purchasing through Dynadot API.

## Features

- **Modern Design**: Clean, professional layout with responsive design
- **Pricing Plans**: One-time website design packages ($2,500 - $4,500) and monthly maintenance plans ($150 - $300)
- **Stripe Integration**: Secure payment processing for both one-time payments and subscriptions
- **Domain Services**: Dynadot API integration for domain availability checking and purchasing with commission
- **Portfolio Showcase**: Display of previous work and projects
- **Contact Forms**: Lead capture and project inquiry forms

## Pricing Structure

### Website Design Packages
- **Basic Website**: $2,500 (one-time)
  - Up to 5 pages
  - Responsive design
  - Basic SEO setup
  - Contact form
  - 1 month support

- **Professional Website**: $3,500 (one-time)
  # Packie Designs Backend and Studio

  This repository contains a minimal self-serve website builder and domain reselling demo. It includes an Express backend, a simple Studio UI, a React studio scaffold, Name.com integration helpers, and starter templates.

  Highlights

  - Stripe-based payments and subscription helpers
  - Name.com integration for domain checks, registration and DNS automation
  - Per-user static site publishing (served under `/published`)
  - Studio UI at `/studio/index.html` and a React visual editor scaffold at `/studio-react`
  - Admin dashboard at `/admin` to view persisted domain orders (requires `X-Admin-Key` header)

  Quick local setup

  1. Install dependencies:

  ```bash
  npm install
  ```

  2. Create environment variables (example `.env`):

  ```text
  PORT=3001
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  JWT_SECRET=your_jwt_secret
  NAMECOM_API_USERNAME=your_namecom_user
  NAMECOM_API_TOKEN=your_namecom_token
  ADMIN_KEY=some_admin_key
  ```

  3. Start the server:

  ```bash
  node server.js
  ```

  4. Open the studio UI in your browser:

  ```
  http://localhost:3001/studio/index.html
  ```

  5. Admin UI:

  ```
  http://localhost:3001/admin
  ```

  Pushing to `expert-umbrella` remote

  To push this repository to the requested remote:

  ```bash
  git remote add expert-umbrella git@github.com:Mattjhagen/expert-umbrella.git
  git push expert-umbrella main
  ```

  If the remote already exists, update and push:

  ```bash
  git remote set-url expert-umbrella git@github.com:Mattjhagen/expert-umbrella.git
  git push expert-umbrella main
  ```

  Notes and caveats

  - Name.com and ACME flows require valid credentials and a publicly reachable server. `cert-manager.js` uses Let's Encrypt staging by default.
  - This project uses filesystem persistence under `data/` for demo purposes. For production, migrate to a proper database and secure storage.
  - Harden security (validation, rate limiting, secret management) before accepting real payments.

  Next steps I completed for you

  - Persisting domain orders and processing them after Stripe payment success
  - Stripe helpers for customers and subscriptions
  - Admin orders endpoint and dashboard
  - README and deploy/push instructions

  If you want me to continue, I'll proceed to implement a full visual editor, image uploads, background workers for certificate issuance, and a production-ready persistence layer.
