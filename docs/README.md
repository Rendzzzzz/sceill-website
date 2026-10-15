# SCEILL documentation

SCEILL is an online store for luxury perfume. These pages explain how the project works, how to run it, and how to change it.

## Where to start

| If you want to... | Read |
|---|---|
| Understand what this project is, and how web concepts map to mobile ones | [1. Overview](01-overview.md) |
| Run it on your computer | [2. Getting started](02-getting-started.md) |
| Find your way around the code | [3. Architecture](03-architecture.md) |
| Know what is stored in the database | [4. Database](04-database.md) |
| Call or change an endpoint | [5. API reference](05-api-reference.md) |
| Understand the shop's rules (shipping, stock, order steps) | [6. Features and business rules](06-features.md) |
| Put it online | [7. Deployment](07-deployment.md) |
| Check what is protected and what is not | [8. Security](08-security.md) |
| Fix an error | [9. Troubleshooting](09-troubleshooting.md) |
| Build a mobile app on top of this backend | [10. Using it from a mobile app](10-mobile-app.md) |

The short setup guide is also in the project's main [README](../README.md).

## The project in one picture

```
   Browser (customer or admin)
        |
        |  pages and JSON requests
        v
 +-------------------------------+
 |  Next.js app  (this project)  |   one codebase, both website and backend
 |   - pages (what you see)      |
 |   - API routes (/api/...)     |
 |   - proxy.ts (login guard)    |
 +---------------+---------------+
                 |  SQL
                 v
          PostgreSQL database
   (customers, products, orders, ...)
```

## Facts at a glance

| | |
|---|---|
| Language | TypeScript |
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL, accessed with Drizzle ORM |
| Login | NextAuth 4: email + password, Google, Apple |
| Hosting plan | Vercel (website) + Aiven free PostgreSQL (database) |
| Language of the shop | English text, Indonesian Rupiah, Indonesian addresses |

## About this documentation

It describes the code as it is now. When you change behaviour, update the matching page so it stays true. The numbers and rules quoted here (shipping fee, 24-hour payment window, password rules) come from the code; the file that defines each one is named next to it.
