# Ccompany

A frontend-only, multi-company work management system built with React, Vite, and Tailwind CSS.

## Features

- Manage companies and company-specific employee employments
- Record daily attendance with a monthly calendar and duplicate-entry protection
- Calculate salary from attendance, paid leave, overtime, and company payroll settings
- Record salary payments, advances, deductions, and payment history
- Preserve and lock previous employment records when an employee switches companies
- View combined dashboards and export monthly and yearly reports
- Persist application data in browser LocalStorage with JSON backup and restore

## Getting started

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

All records are stored in the browser's LocalStorage. This project does not use a backend or external database.
