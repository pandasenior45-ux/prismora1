# PRISMORA — GitHub aur Vercel Deployment Guide

Is guide ko step by step follow karo. ZIP extract karne ke baad project GitHub par upload hoga aur Vercel par deploy hoga.

## Step 1 — ZIP extract karo

1. `PRISMORA-AI-IMAGE-STUDIO.zip` download karo.
2. Windows par ZIP par right-click karke **Extract All** select karo.
3. Extract hone ke baad `prismora` folder open karo. Is folder ke andar `app`, `lib`, `public`, `package.json` aur `README.md` nazar aayenge.

## Step 2 — GitHub par upload karo

1. GitHub par jao aur **New repository** banao.
2. Repository ka naam `prismora-ai-studio` rakh sakte ho.
3. Repository create karo.
4. Repository ke **Add file → Upload files** option par jao.
5. `prismora` folder ke andar ki tamam files aur folders upload karo. Sirf ZIP file upload mat karna.
6. **Commit changes** par click karo.

Repository ke root par `package.json`, `app` aur `public` folders dikhne chahiye.

## Step 3 — Vercel par project deploy karo

1. Vercel dashboard kholo.
2. **Add New → Project** par click karo.
3. Apna `prismora-ai-studio` GitHub repository import karo.
4. Framework **Next.js** auto-detect hona chahiye. Build settings ko default rehne do.
5. Abhi **Deploy** par click karne se pehle neeche wale Environment Variables add karo.

## Step 4 — Cloudflare ki values add karo

Vercel ke **Environment Variables** section mein ye 2 variables banao:

| Name (bilkul isi tarah) | Value mein kya paste karna hai |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard se apna Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers AI ka API Token |

Dono variables ko Production aur Preview environments mein enable karo. Values ke start/end mein quotes mat lagana.

**Important:** Token ko `NEXT_PUBLIC_CLOUDFLARE_API_TOKEN` naam mat dena. `NEXT_PUBLIC_` wali value browser mein expose ho sakti hai. Is project mein token server-side hi use hota hai.

## Step 5 — Cloudflare token permission

Cloudflare dashboard mein **Workers AI → Use REST API** kholo. Wahan se Workers AI API Token create karo aur Account ID copy kar lo. Cloudflare ka suggested Workers AI token template use karna sabse asaan hai. Custom token banao to model run karne ke liye Workers AI ki required Read aur Edit/Write permissions do.

## Step 6 — Deploy aur test

1. Environment Variables add karne ke baad **Deploy** par click karo.
2. Deployment complete hone par Vercel URL kholo.
3. Prompt likho, style aur aspect ratio select karo, phir **Generate image** dabao.
4. Image banne ke baad **Download** button use karo.
5. Sidebar mein **Generation history** kholo; purani generated images wahan milengi.

Agar environment variables pehle deploy ke baad add kiye thay to Vercel mein latest deployment ko **Redeploy** karna zaroori hai.

## Apna logo lagana

Abhi `public/logo.svg` mein temporary PRISMORA prism mark hai, kyun ke tumhara actual logo chat mein attach nahi hua. Apna logo SVG format mein `public/logo.svg` ke naam se replace kar do. Agar logo PNG hai to usay `public/logo.png` naam do aur `app/page.tsx` mein `/logo.svg` ko `/logo.png` se replace karo. Favicon ke liye `public/favicon.svg` bhi replace kar sakte ho.

## Do zaroori notes

- Generation history isi browser/device mein save hoti hai. Dusre mobile ya computer ke saath sync nahi hoti.
- Public website par koi bhi visitor image generate kar sakta hai. Apna link public share karne se pehle login/CAPTCHA aur rate limit lagwana behtar hai, warna generation tumhare Cloudflare account se ho sakti hai.
