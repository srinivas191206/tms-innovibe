# Antigravity Setup Guide 🛸

This guide contains a single "all-in-one" prompt designed for **Antigravity**. If you or your friends clone or download this project, you can simply copy and paste the prompt below into Antigravity to get the entire application set up automatically!

---

### 📋 The All-in-One Prompt
Copy the entire block below and paste it directly into your Antigravity chat:

```text
I have cloned this Next.js project. Please set it up for me completely. Here is what I need you to do:
1. Check if a `.env` file exists in the project root. If it doesn't, create it by copying `.env.example`.
2. Ask me for my Supabase PostgreSQL database URL, and then save it to `DATABASE_URL` inside my `.env` file.
3. Run `npm install` to install all dependencies.
4. Run `npx prisma generate` to generate the Prisma client.
5. Push the database schema to my database using `npx prisma db push --accept-data-loss`.
6. Seed the database with mock accounts using `npx prisma db seed`.
7. Start the development server using `npm run dev` and provide me the local URL and login credentials for testing.
```

---

### 🔍 What Antigravity Will Do:
1. **Environment Setup:** Creates your `.env` configuration file.
2. **Database Connection:** Requests and securely configures your Supabase database link.
3. **Dependency Installation:** Automatically installs all required node packages.
4. **ORM Generation:** Sets up your typesafe database queries.
5. **Database Migration:** Creates all tables (Users, Tasks, Attendance, Settings) on your Supabase instance.
6. **Data Seeding:** Registers the default mock accounts (Admin, Manager, Employee).
7. **Server Startup:** Launches the local host dev portal so you can preview the app immediately!
