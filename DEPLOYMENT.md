# QuizWind Deployment Guide

## Cloudflare Pages Deployment

### Prerequisites
- Cloudflare account (free tier works)
- GitHub repository (or direct upload)

### Method 1: GitHub Integration (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: QuizWind app"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)

3. Click "Create a project" → "Connect to Git"

4. Select your repository

5. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Environment variables**: None needed

6. Click "Save and Deploy"

7. Wait 2-3 minutes for build to complete

8. Your site will be available at: `https://quizwind-<random>.pages.dev`

### Method 2: Direct Upload (Wrangler CLI)

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy:
   ```bash
   wrangler pages deploy dist --project-name=quizwind
   ```

### Custom Domain (Optional)

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to "Custom domains"
3. Add your domain (e.g., `quizwind.yourdomain.com`)
4. Follow DNS configuration instructions

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Visit http://localhost:3000
```

## Testing Before Deployment

```bash
# Run all tests
npm test

# Build and preview production version
npm run build
npm run preview
```

## Troubleshooting

### Build Fails
- Ensure Node.js version >= 18
- Delete `node_modules` and run `npm install` again
- Check `npm run type-check` for TypeScript errors

### Site Loads but Doesn't Work
- Check browser console for errors
- Verify all questions loaded from `questions.json`
- Test localStorage is enabled in browser

### Questions Not Appearing
- Verify `src/data/questions.json` has valid JSON
- Check browser console for import errors
- Ensure questions array has at least one valid question

## Performance Notes

- Production bundle: ~156KB (gzipped: ~52KB)
- Initial load time: <2s on 3G
- Chart.js loads on-demand for Progress view
- All data is static (no API calls)
- localStorage persists across sessions
