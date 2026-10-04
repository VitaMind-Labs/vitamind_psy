# VitaMind Psy

VitaMind Psy is the psychologist-facing workspace of the VitaMind platform. It is designed to help mental health professionals manage patient records, clinical assessments, session workflows, progress tracking, and practice operations in a secure and structured environment.

The application is built around a calm, focused clinical experience that supports care delivery while keeping the workflow clear and operationally efficient.

## Why this product exists

VitaMind Psy is intended for clinicians, psychologists, and care teams who need a dedicated digital space to:

- Manage patient information and clinical records
- Review patient history and progress over time
- Run assessments and track outcomes
- Document notes and journal entries
- Monitor sessions, alerts, and coverage
- Produce structured reports and progress summaries

This platform supports clinical workflows while preserving professional judgment and human oversight.

## Core features

- Secure sign-in and sign-up flow
- Practice overview dashboard
- Patient directory and patient profile management
- Session and assessment workflows
- Clinical notes and journaling tools
- Progress dashboards and life-chart visualization
- Weekly report generation and report review
- Notifications and alerts
- Coverage and scheduling visibility
- Responsive dashboard navigation for desktop and mobile use

## Technology stack

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI and shadcn/ui
- Framer Motion
- Recharts
- React Hook Form + Zod
- ESLint

## Project structure

```text
vitamind_psy/
├── src/
│   ├── app/                 # Route structure and layout framework
│   ├── components/          # Shared UI and interface components
│   ├── features/            # Feature-specific modules and workflows
│   ├── hooks/               # Reusable logic and data hooks
│   ├── lib/                 # Shared utilities and API layers
│   ├── providers/           # Context and global app providers
│   ├── types/               # Shared TypeScript models
│   └── proxy.ts             # Proxy helper or API bridge
├── public/                  # Static files and branding assets
├── package.json             # Scripts and dependencies
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── README.md                # Project documentation
├── CLAUDE.md                # Local engineering documentation
├── .gitignore               # Git ignore rules
└── .env.local               # Local environment overrides (not committed)
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- Access to the VitaMind API for live data

## Quick start

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

The app is available at:

- http://localhost:3005

Build for production:

```bash
npm run build
```

Serve the production build:

```bash
npm run start
```

## Environment variables

Create a `.env.local` file if you need a custom backend target:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If this value is not provided, the app will default to the local VitaMind API URL.

## Main user flows

- `/signin` — clinician authentication
- `/signup` — account creation
- `/dashboard` — practice overview
- `/dashboard/patients` — patient directory
- `/dashboard/patients/:id` — patient clinical profile
- `/dashboard/sessions` — session workspace
- `/dashboard/assessments` — evaluation workflows
- `/dashboard/reports` — weekly reporting
- `/dashboard/notifications` — alert and message center
- `/dashboard/coverage` — clinical coverage view
- `/dashboard/settings` — profile and configuration

## API integration

The client app communicates with the VitaMind backend through a centralized API boundary in the `src/lib` and feature directories. This keeps network requests, validation, and front-end state behavior organized and easier to maintain.

## Clinical and privacy considerations

This application is designed to support care delivery. It should be used responsibly and with professional oversight.

Important expectations:

- Do not use personal or sensitive patient data in public repositories or screenshots.
- Treat all incoming data as untrusted and validate it before rendering or acting on it.
- Keep secrets, tokens, and real patient records out of logs and local development files.
- This is a clinical support tool, not a replacement for medical judgment or emergency care.

## Quality checks

Before submitting changes, run:

```bash
npm run lint
npm run build
```

For UI updates, also validate the affected flows in both desktop and mobile layouts.

## Contribution guidance

1. Start from a well-scoped branch.
2. Keep feature additions contained to the relevant module.
3. Validate both code quality and user workflow behavior.
4. Avoid committing secrets, generated files, or local environment config.

## License

No public license has been declared for this project. Treat the code as proprietary unless the project owners state otherwise.
