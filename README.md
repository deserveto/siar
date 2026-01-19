<p align="center">
  <h1 align="center">SIAR Dashboard</h1>
  <p align="center">
    <strong>Sistem Informasi Asuransi Ramayana</strong>
  </p>
  <p align="center">
    Portal Karyawan untuk Manajemen Operasional Internal
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Secure login & registration with NextAuth.js |
| **Dashboard** | Overview of all activities with statistics |
| **Maintenance** | Track and manage IT maintenance requests |
| **Projects** | Manage project requests and submissions |
| **Calendar** | Event scheduling and deadline tracking |
| **Chat** | Internal messaging between IT and staff |
| **Activity Logs** | Track all user activities (IT Admin only) |
| **Profile Management** | Update profile and upload profile pictures |
| **Theme System** | Dark/Light mode with accent color picker |
| **Notifications** | Real-time notification system |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [MySQL](https://www.mysql.com/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query](https://tanstack.com/query)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher — [Download](https://nodejs.org/)
- **MySQL** 8.0 or higher — [Download](https://dev.mysql.com/downloads/)
- **npm** (comes with Node.js) or **pnpm**/**yarn**

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/deserveto/siar.git
cd siar
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and update with your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env` with your database configuration:

```env
# MySQL Database URL
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/siar_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** Generate a secure secret with: `npx auth secret`

### 4. Create MySQL Database

Create the database in MySQL:

```sql
CREATE DATABASE siar_db;
```

### 5. Setup Database Schema

Generate Prisma client and push the schema to your database:

```bash
npm run db:generate
npm run db:push
```

### 6. Seed the Database

Populate the database with initial data including admin accounts:

```bash
npm run db:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Accounts

After running the seed command, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| **IT Admin** | `admin@ramayana.co.id` | `password123` |
| **Staff** | `staff@ramayana.co.id` | `password123` |

> **Important:** Change these passwords in production!

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## Project Structure

```
siar-dashboard/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed script
├── public/
│   ├── images/           # Static images
│   └── uploads/          # User uploads
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── auth/         # Auth pages (login, register)
│   │   ├── dashboard/    # Dashboard pages
│   │   └── ...
│   ├── components/
│   │   └── ui/           # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── stores/           # Zustand stores
├── .env.example          # Environment variables template
├── package.json
└── README.md
```

---

## User Roles

### IT Admin
- Full access to all features
- Manage maintenance requests
- View all projects and update status
- Access activity logs
- User management

### Non-IT Staff
- Submit maintenance requests
- Create project requests
- View personal calendar
- Chat with IT department
- View personal notifications

---
