#!/bin/bash

# ========================================================
#   INNOVIBE TMS + AI ATTENDANCE PORTAL SETUP SCRIPT
# ========================================================

set -e

# Visual colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================================${NC}"
echo -e "${BLUE}   INNOVIBE TMS + AI ATTENDANCE PORTAL BOOTSTRAPPER     ${NC}"
echo -e "${BLUE}========================================================${NC}"

# 1. Environment Setup check
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env configuration is missing. Auto-bootstrapping from template...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✓ .env file created successfully.${NC}"
else
  echo -e "${GREEN}✓ .env configuration detected.${NC}"
fi

# 2. Package installation
echo -e "\n${BLUE}[1/4] Installing node dependencies...${NC}"
npm install

# 3. Prisma client generation
echo -e "\n${BLUE}[2/4] Generating Prisma PostgreSQL client types...${NC}"
npx prisma generate

# 4. Database schema migration
echo -e "\n${BLUE}[3/4] Provisioning PostgreSQL Database Tables...${NC}"
echo -e "${YELLOW}Note: Pushing schemas directly to Supabase...${NC}"
npx prisma db push --accept-data-loss

# 5. Database seeding
echo -e "\n${BLUE}[4/4] Seeding corporate database mock accounts...${NC}"
npx prisma db seed

echo -e "\n${GREEN}========================================================${NC}"
echo -e "${GREEN}   Setup complete! Launching Local Portal Server...     ${NC}"
echo -e "${GREEN}========================================================${NC}"

npm run dev
