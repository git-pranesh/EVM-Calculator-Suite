# EVM Calculator Suite

A free, browser-based Earned Value Management calculator for project managers and cost engineers.

**Live site:** [evmcalculatorapp.com](https://evmcalculatorapp.com)

---

## What it does

You enter four numbers — BAC, PV, EV, and AC — and get back every standard EVM metric instantly. No sign-up, no spreadsheet, no manual formula lookup.

Metrics calculated:

- **CV** — Cost Variance
- **SV** — Schedule Variance
- **CPI** — Cost Performance Index
- **SPI** — Schedule Performance Index
- **EAC** — Estimate at Completion (three methods)
- **ETC** — Estimate to Complete
- **VAC** — Variance at Completion
- **TCPI** — To-Complete Performance Index

## Features

- All calculations update in real time as you type
- PMP Exam Mode — turns the calculator into a study reference with formula breakdowns
- Export to PDF — one-click report for stakeholder updates or exam prep
- Dedicated sub-calculators for CPI and EAC with additional context
- Glossary and cheat sheet covering all nine PMP EVM formulas
- SEO-optimized landing pages for each metric

## Tech stack

- TypeScript
- React
- Vercel (deployment)
- Built on Replit

## Project structure

```
artifacts/        Static content and SEO pages
attached_assets/  Supplementary assets
lib/              Core calculation logic
scripts/          Build and utility scripts
```

## Running locally

```bash
npm install
npm run dev
```

---

Built and maintained by [Pranesh Padmanabhan](https://www.pressense.co)
