# VitaMind Psy

VitaMind Psy is the psychologist-facing web application in the VitaMind platform. It provides a focused workspace for managing patients, clinical sessions, assessments, notes, progress, reports, alerts, and practice-level insights.

The application is designed to support mental-health professionals with structured clinical workflows. It is a professional aid and does not replace clinical judgment, emergency services, or a formal diagnosis.

## Features

- Secure sign-in and sign-up screens
- Practice dashboard with overview metrics and clinical alerts
- Patient directory and patient profiles
- Session management and session details
- Clinical assessments with individual assessment views
- Structured clinical notes and patient journal workflows
- Progress tracking with charts and life-chart views
- Weekly reports and report details
- Coverage and clinical orientation views
- Notifications center
- Settings and psychologist profile actions
- Responsive sidebar navigation and mobile layouts
- Shared UI primitives based on Radix UI and shadcn/ui patterns
- Type-safe API helpers and feature-oriented application modules

## Technology

- Next.js 16 with the App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI and shadcn/ui components
- Framer Motion for selected motion interactions
- Recharts for clinical and progress visualizations
- React Hook Form and Zod for form handling and validation
- Lucide React for icons
- ESLint with the Next.js configuration

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Access to the VitaMind API when using live data

## Getting Started

From the `vitamind_psy` directory:

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:3005](http://localhost:3005).

To create an optimized production build and serve it locally:

```bash
npm run build
npm run start
```

The application uses the Next.js App Router and the source code is located in `src/`.

## Environment Variables

Create a local `.env.local` file when a custom API endpoint is required:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000` when it is not defined. Never commit `.env`, `.env.local`, credentials, access tokens, or other secrets.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server on port 3005 using Webpack |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Serves the production build |
| `npm run lint` | Runs ESLint |

## Project Structure

```text
src/
├── app/             Next.js routes, layouts, loading and error states
├── components/      Shared layout and UI components
├── features/        Feature modules grouped by clinical workflow
│   ├── assessments/
│   ├── auth/
│   ├── dashboard/
│   ├── patients/
│   ├── reports/
│   ├── sessions/
│   └── ...
├── hooks/           Reusable React hooks
├── lib/             API clients, domain types and shared utilities
├── providers/       Application-level context providers
└── types/           Shared TypeScript types
public/              Static assets such as the application logo
```

Feature modules generally keep their actions, components, hooks, and supporting logic close to the feature they serve. Server Components are preferred by default; client components are used where browser interactivity or hooks are required.

## Main Routes

- `/signin` - Authentication entry point
- `/signup` - Account creation
- `/dashboard` - Practice overview
- `/dashboard/patients` - Patient directory
- `/dashboard/patients/:id` - Patient profile and clinical workspace
- `/dashboard/sessions` - Session management
- `/dashboard/assessments` - Assessment list
- `/dashboard/reports` - Weekly reports
- `/dashboard/notes` - Clinical notes workspace
- `/dashboard/progress` - Progress tracking
- `/dashboard/alerts` - Clinical alerts
- `/dashboard/notifications` - Notifications
- `/dashboard/coverage` - Clinical coverage view
- `/dashboard/settings` - Application settings

## API Integration

The frontend API boundary is organized under `src/lib/api/`, with psychologist-facing operations implemented in `src/lib/api/psychologist.ts`. Feature actions and hooks consume this boundary instead of embedding request details in presentation components.

The backend URL is configured through `NEXT_PUBLIC_API_URL`. Make sure the API is running and that the configured origin accepts requests from the frontend during local development.

## Quality Checks

Before opening a pull request, run the checks relevant to your change:

```bash
npm run lint
npm run build
```

For UI changes, verify the affected route at both desktop and mobile widths. For API or data-flow changes, confirm loading, empty, error, and authenticated states.

## Clinical and Security Considerations

- VitaMind Psy is a clinical support interface, not an autonomous diagnostic system.
- Do not use real patient information in local development, screenshots, fixtures, or pull requests.
- Keep personally identifiable information and protected health information out of logs and client-side telemetry.
- Treat API responses as untrusted input and preserve the existing validation and error-handling boundaries.
- Report security or privacy concerns privately to the project maintainers rather than opening a public issue with sensitive details.

## Contribution Workflow

1. Create a focused branch from the current development branch.
2. Keep changes scoped to the relevant feature or shared boundary.
3. Run lint and build checks before requesting review.
4. Include a concise description of behavior changes and validation performed.
5. Do not commit local IDE settings, Claude configuration, environment files, secrets, or generated build output.

The intended integration target for this workspace is `origin/dev`. The prepared commit workflow is:

```bash
git add README.md .gitignore .claudeignore
git commit -m "docs: document VitaMind Psy and repository hygiene"
git push origin HEAD:dev
```

These commands are documentation only and have not been executed as part of this update.

## License

No public license has been declared for this project. Treat the codebase as proprietary unless the project owners state otherwise.
