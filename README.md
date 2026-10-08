# SynQ Psy

The psychologist-facing workspace of the SynQ platform: a secure, focused environment to manage patients, assessments, sessions, notes, reports and practice operations.

![Next.js](https://img.shields.io/badge/Next.js-16-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

> **SynQ Psy is a clinical support interface.** It does not replace psychologists, psychiatrists, emergency services or formal clinical diagnosis. Clinical decisions remain under the responsibility of qualified professionals.

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Getting started](#getting-started)
5. [Configuration](#configuration)
6. [Routes](#routes)
7. [Architecture](#architecture)
8. [Project structure](#project-structure)
9. [Scripts](#scripts)
10. [Clinical and security considerations](#clinical-and-security-considerations)
11. [Contributing](#contributing)
12. [Project status](#project-status)

## Overview

SynQ Psy gives clinicians and care teams one place to follow a patient over time: records, assessments, sessions, notes, longitudinal progress and alerts, together with the information gathered through SynQ's patient-facing experiences. It supports clinical workflows while preserving professional judgment and human oversight.

## Features

| Area | Capabilities |
|---|---|
| Access | Secure sign-in, sign-up, password reset and two-factor authentication |
| Practice overview | Dashboard with practice metrics and clinical alerts |
| Patients | Directory, profiles, clinical information and history |
| Sessions | Scheduling, session details and clinical follow-up |
| Assessments | Assessment lists and individual assessment views |
| Notes | Structured clinical notes and patient journal workflows |
| Progress | Charts, life-chart views and longitudinal observations |
| Reports | Weekly and monthly reports, review and annotation |
| Requests | Patient assignment requests |
| Alerts and notifications | Clinical alerts and a notifications centre |
| Coverage | Clinical coverage and staffing visibility |

## Technology stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework (App Router) |
| React 19 | User interface |
| TypeScript 5 | Type safety |
| Tailwind CSS 4 | Styling |
| Radix UI and shadcn/ui | Accessible UI primitives and patterns |
| Framer Motion | Motion |
| Recharts | Clinical and progress visualisations |
| React Hook Form and Zod | Forms and validation |
| Lucide React | Icons |
| ESLint | Code quality |

## Getting started

**Prerequisites:** Node.js 20+, npm 10+, and access to a running SynQ API for live data.

```bash
cd vitamind_psy
npm install
npm run dev
```

The app runs on `http://localhost:3005`.

For a production build:

```bash
npm run build
npm run start
```

## Configuration

Create a `.env.local` file in the project root when the API is not on the default address.

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Base URL of the SynQ API, without a trailing slash |

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

On the API side, add this app's origin (`http://localhost:3005`) to `CORS_ORIGINS`. Never commit `.env`, `.env.local`, credentials, API keys, access tokens, private certificates or patient information.

## Routes

| Route | Purpose |
|---|---|
| `/signin`, `/signup` | Authentication and account creation |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/dashboard` | Practice overview |
| `/dashboard/patients`, `/dashboard/patients/:id` | Patient directory and clinical workspace |
| `/dashboard/sessions`, `/dashboard/sessions/:id` | Session management |
| `/dashboard/assessments`, `/dashboard/assessments/:id` | Assessments |
| `/dashboard/notes` | Clinical notes |
| `/dashboard/reports`, `/dashboard/reports/:id` | Weekly reports |
| `/dashboard/monthly` | Monthly reports |
| `/dashboard/requests` | Assignment requests |
| `/dashboard/alerts` | Clinical alerts |
| `/dashboard/notifications` | Notifications |
| `/dashboard/coverage` | Clinical coverage |
| `/dashboard/settings` | Application settings |

## Architecture

SynQ Psy is a feature-oriented Next.js application. Feature actions and hooks use a single API boundary, so presentation components never embed request details.

```text
Next.js App Router
   ├── UI components
   ├── Features (patients, sessions, assessments, reports, notes, dashboard, auth, ...)
   └── Providers
              │
              ▼
   API boundary  (src/lib/api/, psychologist operations in src/lib/api/psychologist.ts)
              │
              ▼
        SynQ API
```

Server Components are preferred by default; Client Components are used where browser interactivity or React hooks are required. Feature modules keep their actions, components, hooks and supporting logic together.

## Project structure

```text
vitamind_psy/
├── src/
│   ├── app/            Routes and layouts: (auth), (dashboard), access-denied
│   ├── components/     Shared UI components
│   ├── features/       assessments, auth, clinical, dashboard, journal, monthly, notes,
│   │                   notifications, patients, reports, requests, risks, sessions, settings
│   ├── hooks/          Reusable logic and data hooks
│   ├── lib/            API layer (src/lib/api), domain types and utilities
│   ├── providers/      Context and global providers
│   ├── types/          Shared TypeScript models
│   └── proxy.ts        Request proxy helper
├── public/             Static assets
├── next.config.ts
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port `3005` |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Clinical and security considerations

SynQ Psy handles sensitive mental-health information.

- It is a clinical support interface, not an autonomous diagnostic system.
- Do not use real patient information in local development, screenshots, fixtures, tests or pull requests.
- Keep personally identifiable and protected health information out of logs and client-side telemetry.
- Treat API responses as untrusted input and preserve the existing validation and error-handling boundaries.
- Do not expose credentials or private API keys.
- Report security and privacy vulnerabilities privately to the maintainers.

## Contributing

1. Create a focused branch from the current development branch.
2. Keep changes scoped to the relevant feature or shared boundary and follow the feature-oriented structure.
3. Run `npm run lint` and `npm run build` before requesting review.
4. For UI changes, check the affected route on desktop and mobile, and its loading, empty, error and authenticated states.
5. For data-flow changes, check request handling, loading behaviour, error handling, empty responses and authentication boundaries.
6. Describe behaviour changes and the validation performed in the pull request. Never commit secrets, patient information or generated build output.

## Project status

SynQ Psy is under active development. It currently provides the psychologist-facing foundation of the SynQ ecosystem; AI-assisted capabilities, such as insights built on the Mira orientation data and longitudinal monitoring, are being developed as part of the broader platform.

## License

Proprietary. No public license is declared; do not reproduce, distribute or commercially use the code without the owners' permission.

## SynQ Labs

*Human-centered AI for mental health.*
