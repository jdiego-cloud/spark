# Spark

Spark is a web app where you type a curiosity and get a clear, simple scientific explanation.

## Getting started

```bash
git clone <your-repo-url>
cd spark
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your [Supabase project settings](https://supabase.com/dashboard) under **Project Settings → API**.
