# VitaMind Psy

VitaMind Psy is the psychologist-facing workspace of the VitaMind platform. It is designed to help mental health professionals manage patient records, clinical assessments, session workflows, progress tracking, and practice operations in a secure and structured environment.

The application is built around a calm, focused clinical experience that supports care delivery while keeping the workflow clear and operationally efficient. It connects clinical workflows, patient information, psychological assessments, and AI-assisted insights within a unified professional environment.

> **VitaMind Psy is a clinical support platform. It does not replace psychologists, psychiatrists, emergency services, or formal clinical diagnosis.**

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

## What VitaMind Psy Provides

The application brings multiple clinical workflows together in one workspace.

### Patient Management

Psychologists can access:

- Patient directory
- Patient profiles
- Patient clinical information
- Patient history
- Patient-related activities and records

### Session Management

The platform provides tools for organizing and reviewing clinical sessions, including:

- Session management
- Session details
- Session-related information
- Clinical follow-up

### Clinical Notes

Psychologists can work with structured clinical notes and patient journal workflows to maintain organized records throughout the patient's follow-up.

### Assessments

The assessment workspace provides access to:

- Assessment lists
- Individual assessment views
- Structured assessment information
- Assessment-related patient data

### Progress Tracking

VitaMind Psy provides visual tools for following patient progress, including:

- Progress charts
- Life-chart views
- Longitudinal observations
- Patient development over time

### Reports

Psychologists can access:

- Weekly reports
- Report details
- Clinical summaries
- Practice-level insights

### Alerts & Notifications

The platform includes:

- Clinical alerts
- Notifications center
- Patient-related notifications
- Practice monitoring

### Practice-Level Insights

The dashboard provides an overview of the practice with metrics and clinical alerts designed to help psychologists monitor their overall activity.

## AI & VitaMind Psy

VitaMind Psy is designed to become the professional interface for VitaMind's AI-assisted mental-health ecosystem.

One of the core AI components being developed within VitaMind is **Mira**, an Arabic conversational assessment agent.

## Architecture

VitaMind Psy follows a feature-oriented Next.js architecture.

```text
                    ┌──────────────────────┐
                    │      Next.js App     │
                    │      App Router      │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
           UI Components    Features       Providers
                │              │
                │              ├── Patients
                │              ├── Sessions
                │              ├── Assessments
                │              ├── Reports
                │              ├── Dashboard
                │              └── Auth
                │
                └──────────────┬──────────────┘
                               │
                               ▼
                         API Boundary
                               │
                               ▼
                      VitaMind Backend API
```

The frontend API boundary is organized under:

```text
src/lib/api/
```

Psychologist-facing API operations are implemented through:

```text
src/lib/api/psychologist.ts
```

Feature actions and hooks consume this API boundary rather than embedding request details directly inside presentation components.

## Technology Stack

| Technology          | Purpose                              |
| ------------------- | ------------------------------------ |
| **Next.js 16**      | Full-stack React framework           |
| **React 19**        | User interface                       |
| **TypeScript 5**    | Type-safe development                |
| **Tailwind CSS 4**  | Styling                              |
| **Radix UI**        | Accessible UI primitives             |
| **shadcn/ui**       | Reusable interface patterns          |
| **Framer Motion**   | Motion interactions                  |
| **Recharts**        | Clinical and progress visualizations |
| **React Hook Form** | Form management                      |
| **Zod**             | Validation                           |
| **Lucide React**    | Icons                                |
| **ESLint**          | Code quality                         |

## Project structure

```text
vitamind_psy/
│
├── src/
│   ├── app/                 # Route structure and layout framework
│   ├── components/          # Shared UI and interface components
│   ├── features/            # Feature-specific modules and workflows
│   │   ├── assessments/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── reports/
│   │   ├── sessions/
│   │   └── ...
│   ├── hooks/               # Reusable logic and data hooks
│   ├── lib/                 # Shared utilities and API layers
│   │   ├── api/
│   │   ├── domain types/
│   │   └── shared utilities/
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

Feature modules generally keep their actions, components, hooks, and supporting logic close to the feature they serve.

**Server Components are preferred by default**, while Client Components are used where browser interactivity or React hooks are required.

## Prerequisites

Before running VitaMind Psy locally, make sure you have:

- **Node.js 20+**
- **npm 10+**
- Access to the **VitaMind API** when working with live data

## Getting Started

Clone the repository:

```bash
git clone https://github.com/VitaMind-Labs/vitamind_psy.git
cd vitamind_psy
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application runs on:

```text
http://localhost:3005
```

For a production build:

```bash
npm run build
```

Serve the production build:

```bash
npm run start
```

## Environment Variables

Create a `.env.local` file in the project root when a custom API endpoint is required:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

If `NEXT_PUBLIC_API_URL` is not defined, the application defaults to:

```text
http://localhost:5000
```

### Security

Never commit:

```text
.env
.env.local
credentials
API keys
access tokens
private certificates
patient information
```

to the repository.

## Available Scripts

| Command         | Description                                  |
| --------------- | -------------------------------------------- |
| `npm run dev`   | Starts the development server on port `3005` |
| `npm run build` | Creates an optimized production build        |
| `npm run start` | Serves the production build                  |
| `npm run lint`  | Runs ESLint                                  |

## Main Routes

| Route                      | Purpose                    |
| -------------------------- | -------------------------- |
| `/signin`                  | Authentication             |
| `/signup`                  | Account creation           |
| `/dashboard`               | Practice overview          |
| `/dashboard/patients`      | Patient directory          |
| `/dashboard/patients/:id`  | Patient clinical workspace |
| `/dashboard/sessions`      | Session management         |
| `/dashboard/assessments`   | Assessment management      |
| `/dashboard/reports`       | Weekly reports             |
| `/dashboard/notes`         | Clinical notes             |
| `/dashboard/progress`      | Progress tracking          |
| `/dashboard/alerts`        | Clinical alerts            |
| `/dashboard/notifications` | Notifications              |
| `/dashboard/coverage`      | Clinical coverage          |
| `/dashboard/settings`      | Application settings       |

## API Integration

The frontend communicates with the VitaMind backend through a dedicated API boundary.

```text
src/lib/api/
```

Psychologist-specific operations are organized in:

```text
src/lib/api/psychologist.ts
```

The API URL is configured through:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

This separation keeps backend communication independent from the presentation layer and allows feature modules to consume typed API operations.

## Clinical & Security Considerations

VitaMind Psy handles workflows related to sensitive mental-health information.

Therefore:

- VitaMind Psy is a **clinical support interface**, not an autonomous diagnostic system.
- Clinical decisions remain under the responsibility of qualified professionals.
- Do not use real patient information in local development.
- Do not include patient information in screenshots, fixtures, tests, or pull requests.
- Keep personally identifiable information and protected health information out of logs and client-side telemetry.
- Treat API responses as untrusted input.
- Preserve existing validation and error-handling boundaries.
- Do not expose credentials or private API keys.
- Security and privacy vulnerabilities should be reported privately to project maintainers.

## Quality & Development Workflow

Before opening a pull request:

```bash
npm run lint
npm run build
```

For UI changes:

- Test the affected route.
- Verify desktop layouts.
- Verify mobile layouts.
- Check loading states.
- Check empty states.
- Check error states.
- Check authenticated states.

For API or data-flow changes:

- Verify request handling.
- Verify loading behavior.
- Verify error handling.
- Verify empty responses.
- Verify authentication boundaries.

## Contribution Workflow

1. Create a focused branch from the current development branch.
2. Keep changes scoped to the relevant feature or shared boundary.
3. Follow the existing feature-oriented architecture.
4. Run lint and build checks before requesting review.
5. Describe behavior changes clearly.
6. Include validation performed.
7. Never commit secrets, credentials, patient information, or generated build output.

The intended integration target for this workspace is:

```text
origin/dev
```

Example commit workflow:

```bash
git add README.md .gitignore .claudeignore
git commit -m "docs: update VitaMind Psy documentation"
git push origin HEAD:dev
```

These commands are examples and should only be executed after reviewing the changes locally.

## Future Direction

VitaMind Psy is being developed as part of a larger AI-assisted mental-health ecosystem.

Future capabilities may include:

### AI-Assisted Clinical Insights

AI systems could help organize information collected throughout the VitaMind platform and present structured insights to professionals.

### Psychological Assessment Integration

Assessment data can be organized into the psychologist's clinical workspace to facilitate professional review.

### Longitudinal Patient Monitoring

Patient progress, assessments, sessions, and observations can be brought together to provide a longitudinal view.

### Patient–Psychologist Continuity

Information gathered through VitaMind's patient-facing experiences can support the professional workflow while keeping clinical decisions with the psychologist.

### Arabic Mental-Health AI

VitaMind's AI layer, including **Mira**, is being developed with Arabic-language interaction as an important component of the platform.

## Project Status

**VitaMind Psy is under active development.**

The current application provides the psychologist-facing foundation of the VitaMind ecosystem, while AI-assisted assessment and other intelligent capabilities are being developed as part of the broader platform.

## License

No public license has currently been declared for this project.

Unless the project owners explicitly state otherwise, treat the source code as **proprietary** and do not assume permission to reproduce, distribute, or commercially use it.

## VitaMind Labs

**Building human-centered AI for mental health.**

**VitaMind Psy** — *Connecting psychological care, intelligent technology, and professional insight.*