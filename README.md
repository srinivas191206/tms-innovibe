# Innovibe TMS + AI Attendance Portal 🚀

An all-in-one corporate environment for real-time AI face recognition attendance, intelligent office lateness auditing, and visual project task boards. Built with **Next.js**, **Prisma**, **PostgreSQL (Supabase)**, and **TailwindCSS**.

---

## ⚡ Quick Start with Antigravity AI agent
If you are running this project with **Antigravity**, you don't need to do any manual setup! Simply open the project folder in your workspace and type the following in the chat:

```text
Initialize the project, configure my database URL: <YOUR_SUPABASE_DATABASE_URL>, and run the preview server.
```

Antigravity will automatically handle the environment configuration, dependency installation, database migration, seeding, and launch the dev server for you!

---

## 🛠️ Manual Setup Guide

Follow these simple steps to set up the project on your local machine with your own **Supabase** database.

### 1. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com) and sign in or sign up.
2. Click **New Project** and select/create an organization.
3. Enter a project name (e.g., `tms-innovibe`) and choose a database password (remember this password!).
4. Choose a region close to you and click **Create new project**.
5. Once your database is provisioned (takes about 1-2 minutes):
   - Go to **Project Settings** (gear icon) > **Database**.
   - Scroll down to **Connection string** and select **URI**.
   - Copy the connection URI. It will look like this:
     ```text
     postgresql://postgres.[YOUR_PROJECT_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
   - Replace `[YOUR_PASSWORD]` with the password you chose during project creation.

### 2. Run the Bootstrap Script
We have included a highly efficient bootstrapper script that automates the entire installation, schema migration, and seeding process.

#### On macOS & Linux:
1. Open your terminal in the project root directory.
2. Grant execution permissions to the script:
   ```bash
   chmod +x scripts/setup.sh
   ```
3. Run the script:
   ```bash
   ./scripts/setup.sh
   ```

#### On Windows (Command Prompt / PowerShell):
1. Open your terminal in the project root directory.
2. Run the batch script:
   ```cmd
   scripts\setup.bat
   ```

> [!NOTE]
> The setup script will:
> * Create a `.env` file from the `.env.example` template if it doesn't exist.
> * Ask you to fill in your `DATABASE_URL` (paste the Supabase URI you copied).
> * Install all `npm` dependencies.
> * Generate your local Prisma Client.
> * Push the database schema directly to your Supabase instance (`prisma db push`).
> * Seed your database with the default portal accounts (`prisma db seed`).
> * Launch the local Next.js development server at `http://localhost:3000`.

---

## 🔐 Seed Accounts & Login Credentials

Once the setup is complete, navigate to **[http://localhost:3000](http://localhost:3000)** in your browser. 

For easy testing, you will find **Developer Quick Fill Buttons** on the login page, or you can manually enter the credentials below:

| Portal Role | Corporate Email | Password |
| :--- | :--- | :--- |
| **Portal Administrator** | `admin@innovibe.com` | `admin123` |
| **Department Head (Manager)** | `head@innovibe.com` | `head123` |
| **Standard Employee** | `employee@innovibe.com` | `employee123` |

---

## 📂 Project Architecture

```text
├── prisma/
│   ├── schema.prisma   # PostgreSQL Database Schema
│   └── seed.ts         # Mock accounts and initial portal settings
├── public/
│   └── uploads/        # Local mock storage for selfies/proofs
├── scripts/
│   ├── setup.sh        # Bootstrapper for macOS/Linux
│   └── setup.bat       # Bootstrapper for Windows
└── src/
    ├── app/            # Next.js App Router Pages & API Endpoints
    ├── components/     # Shared UI layout, providers, and dashboards
    └── lib/            # Auth settings, database client, and utils
```

---

## 🎨 Tech Stack & Conventions
* **Frontend/Backend**: Next.js App Router with React 19.
* **Database Client**: Prisma ORM.
* **Authentication**: NextAuth.js.
* **Styling**: TailwindCSS & HSL tailored dark-mode gradients.
