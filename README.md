# PRISMORA — AI Image Studio

A responsive Next.js image-generation studio powered by Cloudflare Workers AI and the FLUX.2 Klein 9B model. It is structured for GitHub and one-click Vercel deployment.

## Features

- Text-to-image generation through a server-side Cloudflare API route.
- Eight real output aspect ratios (the selected width and height are sent to the image model).
- 15 curated visual styles.
- Surprise Me prompt ideas with randomized style and aspect ratio.
- Local generation history stored in the browser's IndexedDB, including image files.
- Download generated images.
- Dark and light appearance modes, saved in the browser.
- Responsive desktop, tablet, and mobile layouts.
- Cloudflare credentials are read only on the server and are never sent to browser code.

## 1. Cloudflare setup

This project uses the Workers AI model:

`@cf/black-forest-labs/flux-2-klein-9b`

In Cloudflare:

1. Open **Workers AI** in your Cloudflare dashboard.
2. Choose **Use REST API** and create a Workers AI API token using Cloudflare's suggested token template.
3. Copy your **Account ID** and the generated **API Token**.
4. Keep the token private. Do not paste it into source code, a GitHub commit, or any variable beginning with `NEXT_PUBLIC_`.

For a custom token, grant the Workers AI permissions required to run models (Workers AI Read and Workers AI Edit/Write, as offered in your account's permission screen). The built-in Workers AI token template is the easiest option.

Cloudflare's model endpoint uses multipart form data and supports width and height values from 256 to 1920 pixels. This project sends the selected dimensions to that endpoint.

## 2. Deploy using GitHub + Vercel

1. Download and extract the PRISMORA ZIP.
2. Open GitHub and create a new empty repository (for example, `prismora-ai-studio`).
3. Upload the **contents** of the extracted `prismora` folder to the repository root. Do not upload the ZIP as a file inside the repository.
4. Commit the files to the `main` branch.
5. Open Vercel, choose **Add New → Project**, and import your GitHub repository.
6. Vercel should detect Next.js automatically. Keep the default build settings.
7. Before deploying, open **Environment Variables** and add these two exact names:

   | Name | Value |
   | --- | --- |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
   | `CLOUDFLARE_API_TOKEN` | Your Cloudflare Workers AI API Token |

8. Add them to Production and Preview (and Development if you need it), then click **Deploy**.
9. If you add or change environment variables after deployment, trigger a fresh redeployment. Existing deployments do not automatically receive changed environment variables.

## 3. Run locally (optional)

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in your Cloudflare values. Then run:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 4. Replace the starter logo

A temporary Prismora prism mark is included at `public/logo.svg` so the project works immediately. Your own logo was not attached to this chat, so it could not be inserted into the ZIP.

- Easiest option: replace `public/logo.svg` with your own SVG logo and keep the same filename.
- For a PNG logo, save it as `public/logo.png`, then change every `/logo.svg` reference in `app/page.tsx` to `/logo.png`. You can also replace `public/favicon.svg` with a matching favicon.

The theme's initial violet / indigo / cyan palette is centralized near the top of `app/globals.css` using CSS variables. Adjust those values to match your logo more closely once you have added it.

## 5. Generation history and storage

History is stored in IndexedDB inside the visitor's browser. It survives refreshes and browser restarts on that same browser/device, but it is **not** synchronized across devices and is removed if the visitor clears site data. A cloud database and user accounts are not included in this first version.

## 6. Important security and billing notes

- Never add Cloudflare secrets to frontend code or commit a real `.env.local` file to GitHub.
- The API route validates prompts, style names, and aspect ratios before calling Cloudflare.
- Anyone who can access a publicly deployed generator can submit generation requests. Review Cloudflare usage and billing, and consider adding sign-in, CAPTCHA, and server-side rate limiting before sharing it widely.
- Image generation uses your Cloudflare account. Charges or allowances depend on your Cloudflare account, model availability, and current pricing; check your Workers AI dashboard.

## Project structure

```text
prismora/
├── app/
│   ├── api/generate/route.ts   # Server-side Cloudflare API request
│   ├── globals.css             # Full responsive UI and theme variables
│   ├── layout.tsx              # App metadata and root layout
│   └── page.tsx                # Image generator UI
├── lib/history.ts              # IndexedDB history storage
├── public/
│   ├── favicon.svg
│   └── logo.svg                # Replace with your own logo
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```
