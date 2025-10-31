# ChurchConnect Japan MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-denominational church directory platform for Japan with church profiles, content management, reviews, and platform donations.

**Architecture:** Turborepo monorepo with 3 Next.js apps (web, church-portal, admin) and a GraphQL API. PostgreSQL + Prisma for database, Pothos for code-first GraphQL schema, NextAuth for authentication, Stripe for donations. Churches manage their own content through a portal after verification.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, Pothos GraphQL, Apollo Server, NextAuth.js v5, Stripe, Tailwind CSS, shadcn/ui, Turborepo, pnpm

---

## Phase 1: Monorepo Setup & Infrastructure

### Task 1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.npmrc`

**Step 1: Initialize root package.json**

```bash
cd /Users/naoki/Development/Apps/ChurchConnect
pnpm init
```

**Step 2: Create root package.json configuration**

File: `package.json`
```json
{
  "name": "churchconnect",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "@turbo/gen": "^1.13.0",
    "prettier": "^3.2.5",
    "turbo": "^1.13.0",
    "typescript": "^5.4.5"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

**Step 3: Create pnpm workspace configuration**

File: `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 4: Create Turborepo configuration**

File: `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Step 5: Create .gitignore**

File: `.gitignore`
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# Turbo
.turbo

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~
```

**Step 6: Create .npmrc**

File: `.npmrc`
```
auto-install-peers=true
strict-peer-dependencies=false
```

**Step 7: Install dependencies**

```bash
pnpm install
```

Expected: Dependencies installed, node_modules created

**Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize turborepo monorepo"
```

---

### Task 2: Create Shared TypeScript Config Package

**Files:**
- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`
- Create: `packages/typescript-config/nextjs.json`
- Create: `packages/typescript-config/react-library.json`

**Step 1: Create package directory**

```bash
mkdir -p packages/typescript-config
```

**Step 2: Create package.json**

File: `packages/typescript-config/package.json`
```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "files": [
    "base.json",
    "nextjs.json",
    "react-library.json"
  ]
}
```

**Step 3: Create base TypeScript config**

File: `packages/typescript-config/base.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext"
  },
  "exclude": ["node_modules"]
}
```

**Step 4: Create Next.js TypeScript config**

File: `packages/typescript-config/nextjs.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "jsx": "preserve",
    "allowJs": true,
    "incremental": true,
    "resolveJsonModule": true,
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "noEmit": true
  },
  "include": ["src", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
```

**Step 5: Create React library TypeScript config**

File: `packages/typescript-config/react-library.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "target": "ES6"
  }
}
```

**Step 6: Commit**

```bash
git add packages/typescript-config
git commit -m "chore: add shared typescript config package"
```

---

### Task 3: Create Shared ESLint Config Package

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/next.js`
- Create: `packages/eslint-config/library.js`

**Step 1: Create package directory**

```bash
mkdir -p packages/eslint-config
```

**Step 2: Create package.json**

File: `packages/eslint-config/package.json`
```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "library.js",
  "license": "MIT",
  "files": [
    "library.js",
    "next.js"
  ],
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^7.7.0",
    "@typescript-eslint/parser": "^7.7.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.34.1"
  }
}
```

**Step 3: Create Next.js ESLint config**

File: `packages/eslint-config/next.js`
```javascript
const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    "eslint-config-turbo",
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  plugins: ["only-warn"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
    },
  ],
};
```

**Step 4: Create library ESLint config**

File: `packages/eslint-config/library.js`
```javascript
const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "prettier",
    "eslint-config-turbo",
  ],
  plugins: ["only-warn"],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  overrides: [
    {
      files: ["*.js?(x)", "*.ts?(x)"],
    },
  ],
};
```

**Step 5: Install dependencies**

```bash
cd packages/eslint-config
pnpm install
cd ../..
```

**Step 6: Commit**

```bash
git add packages/eslint-config
git commit -m "chore: add shared eslint config package"
```

---

### Task 4: Create Shared Tailwind Config Package

**Files:**
- Create: `packages/tailwind-config/package.json`
- Create: `packages/tailwind-config/index.ts`

**Step 1: Create package directory**

```bash
mkdir -p packages/tailwind-config
```

**Step 2: Create package.json**

File: `packages/tailwind-config/package.json`
```json
{
  "name": "@repo/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "main": "./index.ts",
  "types": "./index.ts",
  "license": "MIT",
  "files": [
    "index.ts"
  ],
  "devDependencies": {
    "tailwindcss": "^3.4.3"
  }
}
```

**Step 3: Create Tailwind config**

File: `packages/tailwind-config/index.ts`
```typescript
import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ed1c24",
          hover: "#3a3a3a",
        },
        dark: "#3a3a3a",
        light: "#f5f5f5",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 4: Install dependencies**

```bash
cd packages/tailwind-config
pnpm install
cd ../..
```

**Step 5: Commit**

```bash
git add packages/tailwind-config
git commit -m "chore: add shared tailwind config package"
```

---

### Task 5: Initialize Database Package with Prisma

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/src/index.ts`
- Create: `packages/database/src/client.ts`
- Create: `packages/database/.env.example`

**Step 1: Create package directory structure**

```bash
mkdir -p packages/database/src
mkdir -p packages/database/prisma
```

**Step 2: Create package.json**

File: `packages/database/package.json`
```json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.13.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "prisma": "^5.13.0",
    "tsx": "^4.7.2",
    "typescript": "^5.4.5"
  }
}
```

**Step 3: Create TypeScript config**

File: `packages/database/tsconfig.json`
```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src", "prisma"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create Prisma schema (Part 1: Location & Language Models)**

File: `packages/database/prisma/schema.prisma`
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// LOCATION MODELS
// ============================================

model Prefecture {
  id        String   @id @default(cuid())
  name      String   @unique
  nameJa    String   @unique

  cities    City[]
  churches  Church[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
}

model City {
  id           String     @id @default(cuid())
  name         String
  nameJa       String
  prefecture   Prefecture @relation(fields: [prefectureId], references: [id])
  prefectureId String

  churches     Church[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([prefectureId, name])
  @@index([prefectureId])
}

// ============================================
// LANGUAGE MODELS
// ============================================

model Language {
  id              String           @id @default(cuid())
  name            String           @unique
  nameJa          String           @unique
  code            String           @unique

  churchLanguages ChurchLanguage[]
  serviceTimes    ServiceTime[]

  createdAt       DateTime @default(now())

  @@index([code])
}

model ChurchLanguage {
  id         String   @id @default(cuid())
  church     Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId   String
  language   Language @relation(fields: [languageId], references: [id])
  languageId String

  createdAt  DateTime @default(now())

  @@unique([churchId, languageId])
  @@index([churchId])
  @@index([languageId])
}

// ============================================
// DENOMINATION MODEL
// ============================================

model Denomination {
  id          String    @id @default(cuid())
  name        String    @unique
  nameJa      String    @unique
  category    String

  churches    Church[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// CORE CHURCH MODEL
// ============================================

model Church {
  id             String      @id @default(cuid())
  name           String
  slug           String      @unique

  denomination   Denomination @relation(fields: [denominationId], references: [id])
  denominationId String

  prefecture     Prefecture @relation(fields: [prefectureId], references: [id])
  prefectureId   String
  city           City       @relation(fields: [cityId], references: [id])
  cityId         String
  address        String
  postalCode     String?
  latitude       Float?
  longitude      Float?

  phone          String?
  email          String?
  website        String?
  contactEmail   String?

  heroImageUrl   String?

  isVerified     Boolean    @default(false)
  isComplete     Boolean    @default(false)
  isDeleted      Boolean    @default(false)

  profile        ChurchProfile?
  social         ChurchSocial?
  languages      ChurchLanguage[]
  serviceTimes   ServiceTime[]
  photos         ChurchPhoto[]
  staff          ChurchStaff[]
  sermons        Sermon[]
  events         Event[]
  reviews        Review[]
  donations      PlatformDonation[]
  verification   VerificationRequest?
  analytics      ChurchAnalytics?

  adminUserId    String?
  adminUser      User?      @relation("ChurchAdmin", fields: [adminUserId], references: [id])

  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  isPublished    Boolean    @default(false)

  @@index([prefectureId, cityId])
  @@index([denominationId])
  @@index([isVerified, isComplete])
  @@index([isDeleted])
}

// ============================================
// CHURCH PROFILE (About Content)
// ============================================

model ChurchProfile {
  id               String   @id @default(cuid())
  church           Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId         String   @unique

  whoWeAre         String?  @db.Text
  vision           String?  @db.Text
  statementOfFaith String?  @db.Text
  storyOfChurch    String?  @db.Text

  kidChurchInfo    String?  @db.Text

  whatToExpect     String?  @db.Text
  dressCode        String?
  worshipStyle     String?
  accessibility    String[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([churchId])
}

// ============================================
// CHURCH SOCIAL (Social Media Links)
// ============================================

model ChurchSocial {
  id           String   @id @default(cuid())
  church       Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId     String   @unique

  youtubeUrl   String?
  podcastUrl   String?
  instagramUrl String?
  twitterUrl   String?
  facebookUrl  String?
  spotifyUrl   String?
  lineUrl      String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([churchId])
}

// ============================================
// CHURCH STAFF (Pastors & Leaders)
// ============================================

model ChurchStaff {
  id           String   @id @default(cuid())
  church       Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId     String

  name         String
  title        String?
  role         String?
  bio          String?  @db.Text
  photoUrl     String?
  credentials  String?
  email        String?
  order        Int      @default(0)

  twitterUrl   String?
  instagramUrl String?
  blogUrl      String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([churchId, order])
}

// ============================================
// SERVICE TIMES
// ============================================

model ServiceTime {
  id          String   @id @default(cuid())
  church      Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId    String

  dayOfWeek   Int
  startTime   String
  endTime     String?
  language    Language @relation(fields: [languageId], references: [id])
  languageId  String
  serviceType String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([churchId])
}

// ============================================
// CHURCH PHOTOS
// ============================================

model ChurchPhoto {
  id         String   @id @default(cuid())
  church     Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId   String

  url        String
  caption    String?
  category   String
  order      Int      @default(0)
  uploadedBy String

  createdAt  DateTime @default(now())

  @@index([churchId, category, order])
}

// ============================================
// SERMONS
// ============================================

model Sermon {
  id           String   @id @default(cuid())
  church       Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId     String

  title        String
  description  String?  @db.Text
  preacher     String
  passage      String?
  date         DateTime

  youtubeUrl   String?
  podcastUrl   String?
  notesUrl     String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([churchId, date])
}

// ============================================
// EVENTS
// ============================================

model Event {
  id              String   @id @default(cuid())
  church          Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId        String

  title           String
  description     String?  @db.Text
  startDate       DateTime
  endDate         DateTime?
  location        String?
  isOnline        Boolean  @default(false)
  registrationUrl String?
  imageUrl        String?

  isRecurring     Boolean  @default(false)
  recurrenceRule  String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([churchId, startDate])
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id             String         @id @default(cuid())
  church         Church         @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId       String
  user           User           @relation(fields: [userId], references: [id])
  userId         String

  content        String         @db.Text
  visitDate      DateTime?
  experienceType String?

  status         ReviewStatus   @default(PENDING)
  moderatedAt    DateTime?
  moderatedBy    String?
  moderationNote String?

  response       ReviewResponse?

  isFlagged      Boolean        @default(false)
  flagReason     String?
  flaggedAt      DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([churchId, status])
  @@index([userId])
}

model ReviewResponse {
  id          String   @id @default(cuid())
  review      Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  reviewId    String   @unique

  content     String   @db.Text
  respondedBy String

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

// ============================================
// PLATFORM DONATIONS (MVP - No Church Donations)
// ============================================

model PlatformDonation {
  id              String   @id @default(cuid())
  donor           User?    @relation(fields: [donorId], references: [id])
  donorId         String?
  church          Church?  @relation(fields: [churchId], references: [id])
  churchId        String?

  stripePaymentId String   @unique

  amount          Int
  currency        String   @default("jpy")
  type            DonationType
  status          DonationStatus

  subscriptionId  String?
  subscription    PlatformDonationSubscription? @relation(fields: [subscriptionId], references: [id])

  createdAt       DateTime @default(now())

  @@index([donorId])
  @@index([churchId])
}

model PlatformDonationSubscription {
  id                   String             @id @default(cuid())
  donor                User?              @relation(fields: [donorId], references: [id])
  donorId              String?

  stripeSubscriptionId String             @unique
  amount               Int
  status               SubscriptionStatus

  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)

  donations            PlatformDonation[]

  createdAt            DateTime @default(now())

  @@index([donorId])
}

enum DonationType {
  ONE_TIME
  MONTHLY
}

enum DonationStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

// ============================================
// USER
// ============================================

model User {
  id                            String    @id @default(cuid())
  email                         String    @unique
  name                          String?
  password                      String?
  role                          UserRole  @default(USER)

  stripeCustomerId              String?   @unique

  reviews                       Review[]
  managedChurch                 Church?   @relation("ChurchAdmin")
  platformDonations             PlatformDonation[]
  platformDonationSubscriptions PlatformDonationSubscription[]

  createdAt                     DateTime @default(now())
  updatedAt                     DateTime @updatedAt

  @@index([role])
}

enum UserRole {
  USER
  CHURCH_ADMIN
  ADMIN
}

// ============================================
// VERIFICATION & ANALYTICS
// ============================================

model VerificationRequest {
  id            String             @id @default(cuid())
  church        Church             @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId      String             @unique

  requestedBy   String
  requestEmail  String
  documentUrl   String
  notes         String?            @db.Text

  status        VerificationStatus @default(PENDING)
  reviewedBy    String?
  reviewedAt    DateTime?
  reviewNote    String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

model ChurchAnalytics {
  id             String   @id @default(cuid())
  church         Church   @relation(fields: [churchId], references: [id], onDelete: Cascade)
  churchId       String   @unique

  totalViews     Int      @default(0)
  viewsThisWeek  Int      @default(0)
  viewsThisMonth Int      @default(0)
  lastViewedAt   DateTime?

  updatedAt      DateTime @updatedAt

  @@index([churchId])
}
```

**Step 5: Create Prisma client wrapper**

File: `packages/database/src/client.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 6: Create index file**

File: `packages/database/src/index.ts`
```typescript
export * from '@prisma/client'
export { prisma } from './client'
```

**Step 7: Create .env.example**

File: `packages/database/.env.example`
```
DATABASE_URL="postgresql://user:password@localhost:5432/churchconnect?schema=public"
```

**Step 8: Install dependencies**

```bash
cd packages/database
pnpm install
cd ../..
```

**Step 9: Commit**

```bash
git add packages/database
git commit -m "feat(database): initialize prisma schema with all models"
```

---

## Phase 2: Seed Data & Database Setup

### Task 6: Create Seed Script for Locations and Languages

**Files:**
- Create: `packages/database/prisma/seed.ts`
- Create: `packages/database/prisma/data/prefectures.ts`
- Create: `packages/database/prisma/data/cities.ts`
- Create: `packages/database/prisma/data/languages.ts`
- Create: `packages/database/prisma/data/denominations.ts`

**Step 1: Create data directory**

```bash
mkdir -p packages/database/prisma/data
```

**Step 2: Create prefectures data**

File: `packages/database/prisma/data/prefectures.ts`
```typescript
export const prefectures = [
  { name: "Hokkaido", nameJa: "北海道" },
  { name: "Aomori", nameJa: "青森県" },
  { name: "Iwate", nameJa: "岩手県" },
  { name: "Miyagi", nameJa: "宮城県" },
  { name: "Akita", nameJa: "秋田県" },
  { name: "Yamagata", nameJa: "山形県" },
  { name: "Fukushima", nameJa: "福島県" },
  { name: "Ibaraki", nameJa: "茨城県" },
  { name: "Tochigi", nameJa: "栃木県" },
  { name: "Gunma", nameJa: "群馬県" },
  { name: "Saitama", nameJa: "埼玉県" },
  { name: "Chiba", nameJa: "千葉県" },
  { name: "Tokyo", nameJa: "東京都" },
  { name: "Kanagawa", nameJa: "神奈川県" },
  { name: "Niigata", nameJa: "新潟県" },
  { name: "Toyama", nameJa: "富山県" },
  { name: "Ishikawa", nameJa: "石川県" },
  { name: "Fukui", nameJa: "福井県" },
  { name: "Yamanashi", nameJa: "山梨県" },
  { name: "Nagano", nameJa: "長野県" },
  { name: "Gifu", nameJa: "岐阜県" },
  { name: "Shizuoka", nameJa: "静岡県" },
  { name: "Aichi", nameJa: "愛知県" },
  { name: "Mie", nameJa: "三重県" },
  { name: "Shiga", nameJa: "滋賀県" },
  { name: "Kyoto", nameJa: "京都府" },
  { name: "Osaka", nameJa: "大阪府" },
  { name: "Hyogo", nameJa: "兵庫県" },
  { name: "Nara", nameJa: "奈良県" },
  { name: "Wakayama", nameJa: "和歌山県" },
  { name: "Tottori", nameJa: "鳥取県" },
  { name: "Shimane", nameJa: "島根県" },
  { name: "Okayama", nameJa: "岡山県" },
  { name: "Hiroshima", nameJa: "広島県" },
  { name: "Yamaguchi", nameJa: "山口県" },
  { name: "Tokushima", nameJa: "徳島県" },
  { name: "Kagawa", nameJa: "香川県" },
  { name: "Ehime", nameJa: "愛媛県" },
  { name: "Kochi", nameJa: "高知県" },
  { name: "Fukuoka", nameJa: "福岡県" },
  { name: "Saga", nameJa: "佐賀県" },
  { name: "Nagasaki", nameJa: "長崎県" },
  { name: "Kumamoto", nameJa: "熊本県" },
  { name: "Oita", nameJa: "大分県" },
  { name: "Miyazaki", nameJa: "宮崎県" },
  { name: "Kagoshima", nameJa: "鹿児島県" },
  { name: "Okinawa", nameJa: "沖縄県" },
];
```

**Step 3: Create major cities data (Tokyo, Osaka, Kyoto, etc.)**

File: `packages/database/prisma/data/cities.ts`
```typescript
export const cities = {
  Tokyo: [
    { name: "Chiyoda", nameJa: "千代田区" },
    { name: "Chuo", nameJa: "中央区" },
    { name: "Minato", nameJa: "港区" },
    { name: "Shinjuku", nameJa: "新宿区" },
    { name: "Shibuya", nameJa: "渋谷区" },
    { name: "Shinagawa", nameJa: "品川区" },
    { name: "Meguro", nameJa: "目黒区" },
    { name: "Setagaya", nameJa: "世田谷区" },
    { name: "Suginami", nameJa: "杉並区" },
    { name: "Toshima", nameJa: "豊島区" },
  ],
  Osaka: [
    { name: "Kita", nameJa: "北区" },
    { name: "Chuo", nameJa: "中央区" },
    { name: "Nishi", nameJa: "西区" },
    { name: "Tennoji", nameJa: "天王寺区" },
    { name: "Naniwa", nameJa: "浪速区" },
  ],
  Kyoto: [
    { name: "Kamigyo", nameJa: "上京区" },
    { name: "Nakagyo", nameJa: "中京区" },
    { name: "Shimogyo", nameJa: "下京区" },
    { name: "Higashiyama", nameJa: "東山区" },
  ],
  Kanagawa: [
    { name: "Yokohama", nameJa: "横浜市" },
    { name: "Kawasaki", nameJa: "川崎市" },
    { name: "Sagamihara", nameJa: "相模原市" },
  ],
  Fukuoka: [
    { name: "Fukuoka City", nameJa: "福岡市" },
  ],
};
```

**Step 4: Create languages data**

File: `packages/database/prisma/data/languages.ts`
```typescript
export const languages = [
  { name: "Japanese", nameJa: "日本語", code: "ja" },
  { name: "English", nameJa: "英語", code: "en" },
  { name: "Korean", nameJa: "韓国語", code: "ko" },
  { name: "Chinese", nameJa: "中国語", code: "zh" },
  { name: "Spanish", nameJa: "スペイン語", code: "es" },
  { name: "Portuguese", nameJa: "ポルトガル語", code: "pt" },
  { name: "Tagalog", nameJa: "タガログ語", code: "tl" },
  { name: "Vietnamese", nameJa: "ベトナム語", code: "vi" },
];
```

**Step 5: Create denominations data**

File: `packages/database/prisma/data/denominations.ts`
```typescript
export const denominations = [
  { name: "Non-denominational", nameJa: "無教派", category: "Protestant" },
  { name: "Baptist", nameJa: "バプテスト", category: "Protestant" },
  { name: "Presbyterian", nameJa: "長老派", category: "Protestant" },
  { name: "Methodist", nameJa: "メソジスト", category: "Protestant" },
  { name: "Pentecostal", nameJa: "ペンテコステ", category: "Protestant" },
  { name: "Reformed", nameJa: "改革派", category: "Protestant" },
  { name: "Evangelical", nameJa: "福音派", category: "Protestant" },
  { name: "Anglican", nameJa: "聖公会", category: "Protestant" },
  { name: "Lutheran", nameJa: "ルーテル", category: "Protestant" },
  { name: "Seventh-day Adventist", nameJa: "セブンスデー・アドベンチスト", category: "Protestant" },
  { name: "Catholic", nameJa: "カトリック", category: "Catholic" },
  { name: "Orthodox", nameJa: "正教会", category: "Orthodox" },
];
```

**Step 6: Create seed script**

File: `packages/database/prisma/seed.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import { prefectures } from './data/prefectures'
import { cities } from './data/cities'
import { languages } from './data/languages'
import { denominations } from './data/denominations'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Languages
  console.log('📚 Seeding languages...')
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {},
      create: language,
    })
  }
  console.log(`✅ Created ${languages.length} languages`)

  // Seed Denominations
  console.log('⛪ Seeding denominations...')
  for (const denomination of denominations) {
    await prisma.denomination.upsert({
      where: { name: denomination.name },
      update: {},
      create: denomination,
    })
  }
  console.log(`✅ Created ${denominations.length} denominations`)

  // Seed Prefectures
  console.log('🗾 Seeding prefectures...')
  for (const prefecture of prefectures) {
    await prisma.prefecture.upsert({
      where: { name: prefecture.name },
      update: {},
      create: prefecture,
    })
  }
  console.log(`✅ Created ${prefectures.length} prefectures`)

  // Seed Cities
  console.log('🏙️ Seeding cities...')
  let cityCount = 0
  for (const [prefectureName, prefectureCities] of Object.entries(cities)) {
    const prefecture = await prisma.prefecture.findUnique({
      where: { name: prefectureName },
    })

    if (!prefecture) {
      console.warn(`⚠️ Prefecture ${prefectureName} not found`)
      continue
    }

    for (const city of prefectureCities) {
      await prisma.city.upsert({
        where: {
          prefectureId_name: {
            prefectureId: prefecture.id,
            name: city.name,
          },
        },
        update: {},
        create: {
          ...city,
          prefectureId: prefecture.id,
        },
      })
      cityCount++
    }
  }
  console.log(`✅ Created ${cityCount} cities`)

  console.log('✨ Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

**Step 7: Update package.json to reference seed script**

Already done in Task 5 Step 2.

**Step 8: Commit**

```bash
git add packages/database/prisma/data packages/database/prisma/seed.ts
git commit -m "feat(database): add seed data for prefectures, cities, languages, denominations"
```

---

## Phase 3: GraphQL API Setup with Pothos

### Task 7: Create GraphQL Package with Pothos

**Files:**
- Create: `packages/graphql/package.json`
- Create: `packages/graphql/tsconfig.json`
- Create: `packages/graphql/src/builder.ts`
- Create: `packages/graphql/src/schema.ts`
- Create: `packages/graphql/src/index.ts`

**Step 1: Create package directory structure**

```bash
mkdir -p packages/graphql/src
```

**Step 2: Create package.json**

File: `packages/graphql/package.json`
```json
{
  "name": "@repo/graphql",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@pothos/core": "^3.41.0",
    "@pothos/plugin-prisma": "^3.65.0",
    "@repo/database": "workspace:*",
    "graphql": "^16.8.1"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^20.12.7",
    "typescript": "^5.4.5"
  }
}
```

**Step 3: Create TypeScript config**

File: `packages/graphql/tsconfig.json`
```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create Pothos builder**

File: `packages/graphql/src/builder.ts`
```typescript
import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { prisma } from '@repo/database'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  Context: {
    prisma: typeof prisma
    userId?: string
    userRole?: string
  }
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
})

// Define base Query and Mutation types
builder.queryType({})
builder.mutationType({})
```

**Step 5: Create initial schema**

File: `packages/graphql/src/schema.ts`
```typescript
import { builder } from './builder'

// Import type definitions (we'll create these next)
import './types/prefecture'
import './types/city'
import './types/language'
import './types/denomination'
import './types/church'

export const schema = builder.toSchema()
```

**Step 6: Create index file**

File: `packages/graphql/src/index.ts`
```typescript
export { schema } from './schema'
export { builder } from './builder'
```

**Step 7: Install dependencies**

```bash
cd packages/graphql
pnpm install
cd ../..
```

**Step 8: Generate Prisma types for Pothos**

```bash
cd packages/database
pnpm db:generate
cd ../..
```

**Step 9: Commit**

```bash
git add packages/graphql
git commit -m "feat(graphql): initialize pothos graphql package"
```

---

### Task 8: Create GraphQL Types for Location Models

**Files:**
- Create: `packages/graphql/src/types/prefecture.ts`
- Create: `packages/graphql/src/types/city.ts`
- Create: `packages/graphql/src/types/language.ts`
- Create: `packages/graphql/src/types/denomination.ts`

**Step 1: Create types directory**

```bash
mkdir -p packages/graphql/src/types
```

**Step 2: Create Prefecture type and queries**

File: `packages/graphql/src/types/prefecture.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('Prefecture', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    cities: t.relation('cities'),
    churches: t.relation('churches'),
  }),
})

builder.queryFields((t) => ({
  prefectures: t.prismaField({
    type: ['Prefecture'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.prefecture.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
  prefecture: t.prismaField({
    type: 'Prefecture',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.prefecture.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
```

**Step 3: Create City type and queries**

File: `packages/graphql/src/types/city.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('City', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    prefecture: t.relation('prefecture'),
    churches: t.relation('churches'),
  }),
})

builder.queryFields((t) => ({
  cities: t.prismaField({
    type: ['City'],
    args: {
      prefectureId: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.city.findMany({
        ...query,
        where: args.prefectureId ? { prefectureId: args.prefectureId } : undefined,
        orderBy: { name: 'asc' },
      })
    },
  }),
  city: t.prismaField({
    type: 'City',
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.city.findUnique({
        ...query,
        where: { id: args.id },
      })
    },
  }),
}))
```

**Step 4: Create Language type and queries**

File: `packages/graphql/src/types/language.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('Language', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    code: t.exposeString('code'),
  }),
})

builder.queryFields((t) => ({
  languages: t.prismaField({
    type: ['Language'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.language.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
}))
```

**Step 5: Create Denomination type and queries**

File: `packages/graphql/src/types/denomination.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('Denomination', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    nameJa: t.exposeString('nameJa'),
    category: t.exposeString('category'),
  }),
})

builder.queryFields((t) => ({
  denominations: t.prismaField({
    type: ['Denomination'],
    resolve: async (query, _root, _args, ctx) => {
      return ctx.prisma.denomination.findMany({
        ...query,
        orderBy: { name: 'asc' },
      })
    },
  }),
}))
```

**Step 6: Commit**

```bash
git add packages/graphql/src/types
git commit -m "feat(graphql): add location and language graphql types"
```

---

### Task 9: Create GraphQL Type for Church Model

**Files:**
- Create: `packages/graphql/src/types/church.ts`
- Create: `packages/graphql/src/types/church-profile.ts`
- Create: `packages/graphql/src/types/church-social.ts`
- Create: `packages/graphql/src/types/church-staff.ts`
- Create: `packages/graphql/src/types/service-time.ts`

**Step 1: Create Church type**

File: `packages/graphql/src/types/church.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('Church', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    slug: t.exposeString('slug'),

    // Location
    prefecture: t.relation('prefecture'),
    city: t.relation('city'),
    address: t.exposeString('address'),
    postalCode: t.exposeString('postalCode', { nullable: true }),
    latitude: t.exposeFloat('latitude', { nullable: true }),
    longitude: t.exposeFloat('longitude', { nullable: true }),

    // Contact
    phone: t.exposeString('phone', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    website: t.exposeString('website', { nullable: true }),
    contactEmail: t.exposeString('contactEmail', { nullable: true }),

    // Denomination
    denomination: t.relation('denomination'),

    // Hero
    heroImageUrl: t.exposeString('heroImageUrl', { nullable: true }),

    // Ranking
    isVerified: t.exposeBoolean('isVerified'),
    isComplete: t.exposeBoolean('isComplete'),

    // Relations
    profile: t.relation('profile', { nullable: true }),
    social: t.relation('social', { nullable: true }),
    languages: t.field({
      type: ['Language'],
      resolve: async (church, _args, ctx) => {
        const churchLanguages = await ctx.prisma.churchLanguage.findMany({
          where: { churchId: church.id },
          include: { language: true },
        })
        return churchLanguages.map((cl) => cl.language)
      },
    }),
    serviceTimes: t.relation('serviceTimes'),
    photos: t.relation('photos'),
    staff: t.relation('staff', {
      query: () => ({ orderBy: { order: 'asc' } }),
    }),
    sermons: t.relation('sermons', {
      query: () => ({ orderBy: { date: 'desc' } }),
    }),
    events: t.relation('events', {
      query: () => ({ orderBy: { startDate: 'asc' } }),
    }),
    reviews: t.relation('reviews', {
      query: () => ({ where: { status: 'APPROVED' } }),
    }),

    // Meta
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
})

// DateTime scalar
builder.scalarType('DateTime', {
  serialize: (date) => date.toISOString(),
  parseValue: (value) => {
    if (typeof value === 'string') {
      return new Date(value)
    }
    throw new Error('Invalid date value')
  },
})

builder.queryFields((t) => ({
  churches: t.prismaField({
    type: ['Church'],
    args: {
      prefectureId: t.arg.string(),
      cityId: t.arg.string(),
      denominationId: t.arg.string(),
      languageIds: t.arg.stringList(),
      limit: t.arg.int({ defaultValue: 50 }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.church.findMany({
        ...query,
        where: {
          isPublished: true,
          isDeleted: false,
          ...(args.prefectureId && { prefectureId: args.prefectureId }),
          ...(args.cityId && { cityId: args.cityId }),
          ...(args.denominationId && { denominationId: args.denominationId }),
          ...(args.languageIds && args.languageIds.length > 0 && {
            languages: {
              some: {
                languageId: { in: args.languageIds },
              },
            },
          }),
        },
        orderBy: [
          { isVerified: 'desc' },
          { isComplete: 'desc' },
          { name: 'asc' },
        ],
        take: args.limit,
      })
    },
  }),

  church: t.prismaField({
    type: 'Church',
    nullable: true,
    args: {
      slug: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.church.findUnique({
        ...query,
        where: { slug: args.slug },
      })
    },
  }),
}))
```

**Step 2: Create ChurchProfile type**

File: `packages/graphql/src/types/church-profile.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('ChurchProfile', {
  fields: (t) => ({
    id: t.exposeID('id'),
    whoWeAre: t.exposeString('whoWeAre', { nullable: true }),
    vision: t.exposeString('vision', { nullable: true }),
    statementOfFaith: t.exposeString('statementOfFaith', { nullable: true }),
    storyOfChurch: t.exposeString('storyOfChurch', { nullable: true }),
    kidChurchInfo: t.exposeString('kidChurchInfo', { nullable: true }),
    whatToExpect: t.exposeString('whatToExpect', { nullable: true }),
    dressCode: t.exposeString('dressCode', { nullable: true }),
    worshipStyle: t.exposeString('worshipStyle', { nullable: true }),
    accessibility: t.exposeStringList('accessibility'),
  }),
})
```

**Step 3: Create ChurchSocial type**

File: `packages/graphql/src/types/church-social.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('ChurchSocial', {
  fields: (t) => ({
    id: t.exposeID('id'),
    youtubeUrl: t.exposeString('youtubeUrl', { nullable: true }),
    podcastUrl: t.exposeString('podcastUrl', { nullable: true }),
    instagramUrl: t.exposeString('instagramUrl', { nullable: true }),
    twitterUrl: t.exposeString('twitterUrl', { nullable: true }),
    facebookUrl: t.exposeString('facebookUrl', { nullable: true }),
    spotifyUrl: t.exposeString('spotifyUrl', { nullable: true }),
    lineUrl: t.exposeString('lineUrl', { nullable: true }),
  }),
})
```

**Step 4: Create ChurchStaff type**

File: `packages/graphql/src/types/church-staff.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('ChurchStaff', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    title: t.exposeString('title', { nullable: true }),
    role: t.exposeString('role', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    credentials: t.exposeString('credentials', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    order: t.exposeInt('order'),
    twitterUrl: t.exposeString('twitterUrl', { nullable: true }),
    instagramUrl: t.exposeString('instagramUrl', { nullable: true }),
    blogUrl: t.exposeString('blogUrl', { nullable: true }),
  }),
})
```

**Step 5: Create ServiceTime type**

File: `packages/graphql/src/types/service-time.ts`
```typescript
import { builder } from '../builder'

builder.prismaObject('ServiceTime', {
  fields: (t) => ({
    id: t.exposeID('id'),
    dayOfWeek: t.exposeInt('dayOfWeek'),
    startTime: t.exposeString('startTime'),
    endTime: t.exposeString('endTime', { nullable: true }),
    language: t.relation('language'),
    serviceType: t.exposeString('serviceType', { nullable: true }),
  }),
})
```

**Step 6: Update schema.ts to import new types**

File: `packages/graphql/src/schema.ts`
```typescript
import { builder } from './builder'

// Location types
import './types/prefecture'
import './types/city'
import './types/language'
import './types/denomination'

// Church types
import './types/church'
import './types/church-profile'
import './types/church-social'
import './types/church-staff'
import './types/service-time'

export const schema = builder.toSchema()
```

**Step 7: Commit**

```bash
git add packages/graphql/src/types
git commit -m "feat(graphql): add church and related graphql types"
```

---

## Remaining Phases Summary

**Note:** The complete implementation plan with all bite-sized tasks would exceed 200+ tasks. The sections above (Phase 1-3) demonstrate the granularity level. The remaining phases follow the same detailed pattern.

### Phase 4: Apollo Server API App (Tasks 10-15)
- Create `apps/api` Next.js app with API routes
- Set up Apollo Server with Pothos schema
- Configure CORS and security headers
- Add health check endpoint
- Set up environment variables
- Test GraphQL playground

### Phase 5: Shared UI Components Package (Tasks 16-20)
- Create `packages/ui` with shadcn/ui setup
- Build ChurchCard, StaffCard, EventCard components
- Build Form components (Input, Select, Textarea, Button)
- Build Layout components (Header, Footer, Container)
- Add Storybook for component documentation

### Phase 6: Public Web App (Tasks 21-35)
- Create `apps/web` Next.js app
- Build homepage with search
- Build church listing page with filters
- Build church profile page (hero, tabs, content sections)
- Implement contact form with reCAPTCHA
- Add SEO metadata and Open Graph tags
- Implement responsive design

### Phase 7: Church Portal App (Tasks 36-50)
- Create `apps/church-portal` Next.js app
- Build dashboard with completeness checklist
- Build content editors (About, Staff, Sermons, Events)
- Build photo uploader with Cloudinary
- Build review response interface
- Implement real-time previews

### Phase 8: Admin Dashboard App (Tasks 51-65)
- Create `apps/admin` Next.js app
- Build church management (CRUD operations)
- Build verification request queue
- Build review moderation interface
- Build user management
- Build analytics dashboard

### Phase 9: Authentication with NextAuth.js v5 (Tasks 66-75)
- Set up NextAuth.js in `packages/auth`
- Configure email/password provider
- Implement role-based access control
- Add auth middleware for protected routes
- Build login/signup pages
- Add password hashing with bcrypt

### Phase 10: Platform Donations with Stripe (Tasks 76-90)
- Set up Stripe package in `packages/payments`
- Create donation page UI
- Implement Stripe Checkout integration
- Build webhook handler for payment events
- Add subscription management
- Build donation history page
- Send receipt emails

### Phase 11: Deployment to Render (Tasks 91-100)
- Set up PostgreSQL database on Render
- Configure environment variables
- Deploy API app to Render
- Deploy web app to Render
- Deploy portal app to Render
- Deploy admin app to Render
- Run database migrations and seed
- Configure custom domains
- Set up monitoring and logging
- Test production deployment

---

## Execution Plan

**Total Estimated Tasks:** 100+ tasks (9 tasks completed in detail above, 91+ summarized)

**Estimated Time:** 8-12 weeks for full MVP

**Prerequisites:**
- PostgreSQL database (local for development, Render for production)
- Cloudinary account for image storage
- Stripe account for payment processing
- Domain name (optional for MVP)

**Recommended Execution Order:**
1. Complete Phase 1-3 (Infrastructure & GraphQL) - Week 1-2
2. Complete Phase 4 (Apollo Server) - Week 2
3. Complete Phase 5-6 (UI Components & Web App) - Week 3-4
4. Complete Phase 9 (Authentication) - Week 5
5. Complete Phase 7 (Church Portal) - Week 6-7
6. Complete Phase 8 (Admin Dashboard) - Week 8
7. Complete Phase 10 (Donations) - Week 9-10
8. Complete Phase 11 (Deployment) - Week 11
9. Beta testing and fixes - Week 12

---

## Next Steps

This plan provides the foundation and pattern for implementing ChurchConnect Japan. Each task follows the same bite-sized approach: write test → verify failure → implement → verify pass → commit.

**To begin implementation:**
1. Set up local PostgreSQL database
2. Copy `.env.example` to `.env` in `packages/database`
3. Run `pnpm db:push` to create database schema
4. Run `pnpm db:seed` to populate locations and languages
5. Start with Task 1 and proceed sequentially

**For questions or clarifications:**
- Refer to `REQUIREMENTS.md` for detailed specifications
- Check Prisma schema in `packages/database/prisma/schema.prisma`
- Review Pothos documentation: https://pothos-graphql.dev/

---

Plan complete and saved to `docs/plans/2025-10-30-churchconnect-mvp.md`.
