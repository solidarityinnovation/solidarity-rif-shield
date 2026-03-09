# AFGE RIF Shield - Deployment Guide

## Option 1: Render.com (Recommended - Free)

### Step 1: Push to GitHub
```bash
cd /path/to/afge_rif_shield_demo
git init
git add .
git commit -m "AFGE RIF Shield PWA"
git remote add origin https://github.com/YOUR_USERNAME/afge-rif-shield.git
git push -u origin main
```

### Step 2: Render.com
1. https://render.com > Sign in
2. **New +** > **Static Site** > Connect GitHub repo
3. Name: `afge-rif-shield` | Branch: `main` | Build Command: *(empty)* | Publish Dir: `.`
4. **Create Static Site** - live in ~2 min
5. URL: `https://afge-rif-shield.onrender.com`

## Option 2: Netlify
netlify.com > Add new site > Import from Git > Publish Dir: `.`
URL: `https://afge-rif-shield.netlify.app`

## Option 3: GitHub Pages
Repo Settings > Pages > Source: main branch / root
URL: `https://YOUR_USERNAME.github.io/afge-rif-shield`

## Notes
- No build step required - pure static files
- HTTPS automatic and free on all platforms
- PWA install works immediately after deploy
- All data stored in localStorage - no backend needed
