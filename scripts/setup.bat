@echo off
rem ========================================================
rem   INNOVIBE TMS + AI ATTENDANCE PORTAL WINDOWS BOOTSTRAP
rem ========================================================

echo ========================================================
echo    INNOVIBE TMS + AI ATTENDANCE PORTAL BOOTSTRAPPER     
echo ========================================================

rem 1. Environment Setup check
if not exist .env (
  echo [WARNING] .env configuration is missing. Auto-bootstrapping from template...
  copy .env.example .env
  echo [SUCCESS] .env file created successfully.
) else (
  echo [SUCCESS] .env configuration detected.
)

rem 2. Package installation
echo.
echo [1/4] Installing node dependencies...
call npm install

rem 3. Prisma client generation
echo.
echo [2/4] Generating Prisma PostgreSQL client types...
call npx prisma generate

rem 4. Database schema migration
echo.
echo [3/4] Provisioning PostgreSQL Database Tables...
echo [INFO] Pushing schemas directly to Supabase...
call npx prisma db push --accept-data-loss

rem 5. Database seeding
echo.
echo [4/4] Seeding corporate database mock accounts...
call npx prisma db seed

echo.
echo ========================================================
echo    Setup complete! Launching Local Portal Server...     
echo ========================================================

call npm run dev
