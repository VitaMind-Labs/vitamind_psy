# VitaMind Psy - Project Guidelines & Token Optimization

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS v4 + Radix UI / Shadcn UI + Framer Motion
- **Charts**: Recharts v3
- **Forms & Validation**: React Hook Form + Zod
- **API & Data Layer**: `src/lib/api/psychologist.ts`

## Token & Execution Rules
1. **Targeted Inspections**: Only read files directly related to the current feature or page being updated.
2. **No Full Directory Dumps**: Never print or read giant files (e.g., `package-lock.json`).
3. **UI/UX Skill**: Utilize the installed skill at `.claude/skills/ui-ux-pro-max` for design system rules and styling tokens.
4. **Code Edits**: Write concise, modular, production-ready TypeScript code. Avoid repetitive boilerplate or placeholder comments.
5. **Component Boundary**: Keep Server Components as default; mark `'use client'` only when interactive state, hooks, or Recharts are required.