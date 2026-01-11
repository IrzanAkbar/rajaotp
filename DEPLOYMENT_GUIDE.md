# 🚀 Deployment Guide - RajaOTP Landing Page

## Quick Start - Deploy ke Vercel (Recommended)

### Metode 1: Via GitHub (Recommended)

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RajaOTP landing page"
   git remote add origin https://github.com/yourusername/rajaotpweb.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy ke Vercel**
   - Login ke https://vercel.com
   - Click "New Project"
   - Import GitHub repository
   - Vercel akan auto-detect Next.js config
   - Click Deploy
   - Selesai! Website live dalam hitungan menit

### Metode 2: Via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd c:\Users\ASUS\Downloads\rajaotpweb
   vercel
   ```

3. **Follow instructions**
   - Link ke Vercel account
   - Select project name
   - Auto-deploy setup
   - Custom domain (optional)

---

## Build & Test Locally

### Production Build
```bash
npm run build
npm start
```

Build output:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collected page data
✓ Generated static pages
```

### Development Server
```bash
npm run dev
```

Access: http://localhost:3000

---

## Domain Setup (Post-Deployment)

### Setup Custom Domain di Vercel

1. Go to Project Settings → Domains
2. Add custom domain (e.g., rajaotpweb.com)
3. Update DNS records:
   ```
   A Record: 76.76.19.165
   CNAME: cname.vercel-dns.com
   ```
4. Verify domain (auto dalam 24-48 jam)

### SSL/HTTPS
- ✅ Otomatis via Vercel (free)
- ✅ Auto-renew certificates
- ✅ Redirect http → https automatic

---

## Environment Variables (Optional)

Jika perlu analytics atau external services:

1. Create `.env.local` di root folder
2. Add variables:
   ```env
   NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X
   NEXT_PUBLIC_API_URL=https://api.example.com
   ```
3. Deploy ulang untuk apply changes

---

## Monitoring & Analytics

### Vercel Analytics (Free)
```bash
npm install @vercel/analytics @vercel/speed-insights
```

Add ke `layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Google Analytics (Optional)
```bash
npm install next-gtag
```

---

## Performance Optimization

### Image Optimization (Future Enhancement)
```tsx
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

### Font Optimization
✅ Already configured dengan Geist fonts

### CSS Optimization
✅ Tailwind CSS auto-purges unused styles

---

## Backup & Version Control

### Git Setup
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git add .
git commit -m "RajaOTP landing page - production ready"
git push
```

### Backup
- Auto-backed up di GitHub
- Vercel keeps deployment history
- Easy rollback if needed

---

## Troubleshooting

### Build Fails
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Port Already in Use (Port 3000)
```bash
npm run dev -- -p 3001
```

### Clear Vercel Cache
- Go to Vercel dashboard
- Project settings → Advanced → Purge Cache

---

## Post-Deployment Checklist

- [ ] Website accessible via custom domain
- [ ] Mobile responsive ✓
- [ ] All links working
- [ ] Telegram bot link functional
- [ ] SEO meta tags visible
- [ ] Images loading fast
- [ ] Animations smooth on all devices
- [ ] Analytics configured (optional)
- [ ] SSL/HTTPS enabled ✓
- [ ] Sitemap configured (auto)

---

## Performance Metrics Target

- **Lighthouse Score**: 90+
- **Page Speed**: <3 seconds
- **Core Web Vitals**: All green
- **Mobile Score**: 85+

### Check Performance
```bash
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

---

## Continuous Deployment

### Auto-Deploy on Push
✅ Vercel automatically deploys when you push to main branch

```bash
git add .
git commit -m "Update content"
git push
# Website automatically updated!
```

### Preview Deployments
- Every PR gets automatic preview URL
- Test before merging to main
- Easy team collaboration

---

## Security

### Security Headers (Auto via Vercel)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy

### HTTPS
- ✅ Auto-enabled
- ✅ Certificate auto-renewed
- ✅ HTTP → HTTPS redirect

### Rate Limiting
- ✅ Enabled by default
- ✅ DDoS protection
- ✅ Bot protection

---

## Scaling (Future)

Ketika traffic naik:

### Vercel Scaling
- ✅ Automatic scaling
- ✅ Global CDN
- ✅ Edge functions ready
- ✅ No manual configuration needed

### Database (Jika diperlukan)
Rekomendasi untuk future:
- Vercel Postgres
- Prisma ORM
- Supabase

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion

---

## Cost Estimation

### Vercel Pricing
- **Hobby Plan**: Free ✓
  - 1 deployment per commit
  - 6TB data transfer/month
  - Perfect untuk landing page
  
- **Pro Plan**: $20/month
  - Unlimited deployments
  - 50GB data transfer/month
  - Advanced analytics

### Domain Cost
- Domain: ~$10-15/year
- SSL: Free via Vercel
- Email: Free via Vercel mail forwarding

---

## Next: Going Live!

1. Push to GitHub ✓
2. Connect to Vercel
3. Deploy ✓
4. Setup custom domain
5. Share with world! 🎉

---

**Your RajaOTP landing page is ready to launch! 🚀**

Estimated deployment time: 5-10 minutes
Live time after deployment: Instant

Good luck! 💪
