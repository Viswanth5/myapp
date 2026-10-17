# VIRA — Intelligent Personal Life-OS

> **Minimal manual updating is the #1 design rule.** Type or speak one messy sentence and VIRA organizes your tasks, exams, expenses, habits, and goals into a unified, glassmorphic system.

---

## ⚡ Supabase Setup Guide (PostgreSQL, Auth & Realtime)

VIRA is built to run on **Supabase PostgreSQL** with connection pooling, `@supabase/ssr` authentication, Row Level Security (RLS), and Realtime multi-device sync.

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Select your closest region (e.g. `ap-south-1` Mumbai / Asia South).

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the credentials from **Project Settings -> Database** & **Project Settings -> API**:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-server-only"

# Pooled Connection (port 6543 with pgbouncer=true)
DATABASE_URL="postgresql://postgres.your-project:your-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (port 5432) for migrations
DIRECT_URL="postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

GEMINI_API_KEY=""
GEMINI_MODEL="gemini-1.5-flash"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Run Database Migrations
Run the SQL migration scripts in the **Supabase SQL Editor** in order:
1. `supabase/migrations/20261007_schema.sql` (Creates all tables)
2. `supabase/migrations/20261007_auth_trigger.sql` (Auto-creates profile on signup)
3. `supabase/migrations/20261007_rls_policies.sql` (Enables Row Level Security)
4. `supabase/migrations/20261007_realtime.sql` (Enables Realtime replication on entries)

Alternatively, push schema directly via Prisma:
```bash
npx prisma db push
```

Populate realistic starter demo data:
```bash
npm run db:seed
```

### Step 5: Enable Google OAuth (Optional)
In Supabase Dashboard -> **Authentication -> Providers -> Google**:
1. Enable Google provider.
2. Add your Google Client ID and Client Secret from Google Cloud Console.
3. Add `https://<your-project>.supabase.co/auth/v1/callback` to Authorized Redirect URIs.

---

## 🎨 Midnight Study Desk Design System

- **3 Distinct Glass Depths**:
  - **Level 1 (Base Panels)**: 14px blur, 4% white, 8% border.
  - **Level 2 (Raised Cards)**: 24px blur, 8% white, 15% border, inner top highlight.
  - **Level 3 (Command Bar / Modals)**: 40px blur, 140% saturation, 12% white, 20% border.
- **Asymmetric Bento Layout**: Dominant Today Stack on the left with stacked Attention Radar, Pressure Meter, and Money Runway on the right.
- **Typography**: Display serif (**Fraunces / Instrument Serif**) with tight tracking and italic date accents, paired with **JetBrains Mono** tabular-nums for all numbers and ₹ amounts.
- **Floating Glass Dock**: Left vertical rail on desktop with spring-physics sliding active pill + mobile bottom dock.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run Vitest unit tests
npm test

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
