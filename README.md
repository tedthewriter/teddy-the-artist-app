# Teddy the Artist

A private, phone-first therapeutic support app. The experience is designed to feel calm, warm, optional, and easy to return to.

## Current prototype

- Supabase email-and-password sign-in shell
- Daily affirmation card with listen and favorite controls
- A closable four-part suggested plan that can be reopened during the day
- Eight Home pathways: Skills, Art, Move, Reflect, Connect, Games, Affirmations, and Surprise Me
- No completion tracking, streaks, reminders, or pressure language

The current Home content is representative sample data. Approved content will move into Supabase after the content model and access policies are reviewed.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without local Supabase environment values, development mode opens the Home prototype directly. The initial public design-review build also uses an explicit preview flag. That flag will be removed before any personalized content is imported.

## Deployment

The included GitHub Actions workflow builds the Vite app and deploys it to GitHub Pages after changes reach `main`. Add the two Supabase values above as GitHub repository variables before enabling the private sign-in experience.

Never commit passwords, database credentials, service-role keys, secret keys, or private therapeutic source material.
