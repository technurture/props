# Deployment Guide - Life Point Medical Centre EMR

## Current Build Issue

The production build fails due to memory constraints:
- **Replit Container Limit**: 3.1GB RAM
- **Leapcell Deployment Limit**: ~2GB RAM  
- **Build Requirement**: ~4-6GB RAM

The application is too large to build within these constraints due to:
- 419 TypeScript files
- 200+ App Router routes
- Heavy UI libraries (antd, FullCalendar, ApexCharts, Quill, Leaflet, etc.)
- 15MB of styles

## Solution Options

### Option 1: Build Locally, Deploy Artifacts (RECOMMENDED)

1. **Build on a machine with sufficient RAM** (at least 6GB free):
   ```bash
   npm run build:prod
   ```

2. **Deploy the built artifacts** to Leapcell:
   - Upload the entire `.next` folder
   - Upload `public` folder
   - Upload `package.json` and `package-lock.json`
   - Set the start command to: `npm start`

3. **Environment Variables** needed on Leapcell:
   - Set all your environment variables (DATABASE_URL, API keys, etc.)
   - Ensure NODE_ENV=production

### Option 2: Use a CI/CD Pipeline

Set up GitHub Actions, GitLab CI, or similar with a build step:

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:prod
      - name: Deploy to Leapcell
        # Use Leapcell CLI or upload artifacts
```

### Option 3: Optimize the Application (Long-term)

Implement lazy loading for heavy components to reduce build memory:

1. **Lazy load heavy libraries** with `next/dynamic`:
   ```typescript
   import dynamic from 'next/dynamic';
   
   const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
   const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
   const QuillEditor = dynamic(() => import('react-quill-new'), { ssr: false });
   ```

2. **Code split by route** - move heavy imports to route level instead of global

3. **Remove unused dependencies** - audit and remove libraries not being used

### Option 4: Alternative Deployment Platforms

Consider platforms with higher build resources:
- **Vercel** (Next.js native, higher build limits)
- **Netlify** (good Next.js support)
- **Railway** (configurable resources)
- **Render** (higher memory tiers)

## Current Configuration

Already optimized:
- ✅ Removed Turbopack from production builds
- ✅ Removed `transpilePackages` that forced heavy library transpilation  
- ✅ Set `NEXT_PRIVATE_WORKER_THREADS=1` to limit parallelism
- ✅ Fixed `devIndicators` config warning
- ✅ Using webpack with memory optimizations

## Quick Start for Local Build

```bash
# 1. Clean previous builds
rm -rf .next

# 2. Build for production
NODE_ENV=production NODE_OPTIONS='--max-old-space-size=6144' npm run build

# 3. Test locally
npm start

# 4. Deploy .next folder to Leapcell
```

## Notes

- The development server (`npm run dev`) works fine because it uses Turbopack and doesn't need to create the full production bundle
- The `standalone` output mode in next.config.ts creates a self-contained deployment ready for production
- Building requires significantly more memory than running the built application
