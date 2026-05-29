# Spark

Spark is a web app that lets you type any question and get a clear, simple scientific explanation. Designed for the curious — no jargon, no fluff.

## Tech stack

- **[Next.js 16](https://nextjs.org)** — App Router, file-based routing, server components
- **[React 19](https://react.dev)** — UI library
- **[Tailwind CSS v4](https://tailwindcss.com)** — utility-first styling
- **[TypeScript](https://www.typescriptlang.org)** — type safety throughout
- **[Supabase](https://supabase.com)** _(coming soon)_ — database and auth

## Getting started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd spark
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment variables](#environment-variables) below for where to find each value.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

| Variable                      | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`    | Your Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project's public anon key    |

Find both values in your [Supabase dashboard](https://supabase.com/dashboard) under **Project Settings → API**.

Variables prefixed with `NEXT_PUBLIC_` are safe to expose in the browser. Never commit `.env.local` to version control.

## Available scripts

| Script          | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the local development server |
| `npm run build` | Create a production build          |
| `npm run start` | Serve the production build locally |
| `npm run lint`  | Run ESLint                         |
