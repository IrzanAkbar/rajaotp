# RajaOTP - Landing Page

Sebuah website landing page profesional untuk brand "RajaOTP" - Layanan OTP Cepat & Terpercaya.

## 🎯 Fitur Utama

- **Dark Theme Premium**: Desain gelap dengan aksen emas untuk kesan premium dan profesional
- **Fully Responsive**: Optimal di semua device (mobile, tablet, desktop)
- **Smooth Animations**: Menggunakan Framer Motion untuk micro-interactions yang halus
- **SEO Ready**: Metadata lengkap dengan Open Graph dan Twitter Card
- **Performance**: Build cepat dan optimized untuk production
- **Component-Based**: Struktur modular dan mudah dikembangkan

## 🛠️ Tech Stack

- **Next.js 16.1** - React framework dengan App Router
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion 11** - Library animasi React
- **TypeScript** - Type safety dan developer experience
- **Responsive Design** - Mobile-first approach

## 📁 Struktur Folder

```
app/
├── components/
│   ├── Navbar.tsx          # Navigation bar dengan mobile menu
│   └── sections/
│       ├── Hero.tsx         # Hero section dengan CTA utama
│       ├── About.tsx        # About RajaOTP
│       ├── Features.tsx     # Fitur-fitur utama
│       ├── HowItWorks.tsx   # Cara kerja layanan
│       ├── Trust.tsx        # Trust & credibility section
│       ├── CTA.tsx          # Call-to-action section
│       └── Footer.tsx       # Footer
├── layout.tsx              # Root layout dengan metadata
├── page.tsx                # Main page
└── globals.css             # Global styles & animations
```

## 📄 Halaman

### 1. **Hero Section**
- Headline: "RajaOTP – Layanan OTP Cepat & Terpercaya"
- Subheadline: "Solusi OTP instan dengan sistem otomatis dan stabil"
- Primary CTA: "Buka Bot Telegram"
- Secondary CTA: "Pelajari Lebih Lanjut"
- Trust indicators: Aman, Instan, Terpercaya

### 2. **About Section**
- Penjelasan layanan RajaOTP
- Key benefits: Kecepatan, Keamanan, Kemudahan
- Visual animasi floating element

### 3. **Features Section**
- 6 fitur utama dalam grid layout
- Icons emoji + deskripsi
- Hover effects dengan smooth animation
- Features:
  - Pemesanan OTP Otomatis
  - Proses Cepat & Stabil
  - Mendukung Berbagai Layanan
  - Sistem Aman & Transparan
  - Harga Terjangkau
  - Support 24/7

### 4. **How It Works**
- 3 langkah sederhana
- Step indicators dengan nomor
- Visual flow yang jelas

### 5. **Trust & Credibility**
- Trust points: Transparent, Performance, Security
- Stats: 99.9% Uptime, <1s Response, 24/7 Support
- Messaging yang membangun kepercayaan

### 6. **CTA Section**
- Headline yang kuat dan persuasif
- Call-to-action primary ke Bot Telegram
- Supporting text yang mendorong action

### 7. **Footer**
- Brand information
- Menu links
- Resources links
- Social links
- Legal links
- Disclaimer
- Copyright info

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm atau yarn

### Installation

1. Clone atau extract project:
```bash
cd rajaotpweb
```

2. Install dependencies:
```bash
npm install
# atau
yarn install
```

3. Run development server:
```bash
npm run dev
# atau
yarn dev
```

4. Buka http://localhost:3000 di browser

### Build untuk Production

```bash
npm run build
npm start
```

## 🎨 Customization

### Colors
Ubah warna emas/primary di file:
- `app/globals.css` - CSS variables
- `tailwind.config.ts` - Tailwind color config

### Content
Edit content di masing-masing component di folder `app/components/sections/`

### Metadata
Update SEO metadata di `app/layout.tsx`

## 📱 Responsive Design

Website responsif dan optimal untuk:
- Mobile: 375px - 480px
- Tablet: 768px - 1024px
- Desktop: 1440px+

## ⚡ Performance Tips

- Next.js automatic code splitting
- Image optimization siap untuk implementasi
- Font optimization dengan Geist font
- CSS purging otomatis dengan Tailwind

## 🔗 Deployment

### Deploy ke Vercel (Recommended)

1. Push repository ke GitHub
2. Login ke https://vercel.com
3. Import project dari GitHub
4. Vercel akan auto-detect Next.js config
5. Deploy dengan sekali klik

```bash
npm install -g vercel
vercel
```

### Deploy ke Platform Lain
Website ini bisa deploy ke:
- Netlify
- AWS Amplify
- DigitalOcean
- Railway
- Render

## 📊 SEO

Website sudah dikonfigurasi dengan:
- Meta title & description
- Open Graph tags untuk social sharing
- Twitter Card support
- Semantic HTML
- Responsive viewport
- Structured data ready

## 🔒 Security

- Content Security Policy ready
- No sensitive data exposure
- Form validation ready untuk future features
- HTTPS support untuk production

## 🎓 Project Structure Best Practices

- ✅ Component-based architecture
- ✅ Separation of concerns
- ✅ Reusable components
- ✅ Clear folder organization
- ✅ Scalable untuk pengembangan
- ✅ TypeScript untuk type safety
- ✅ Clean code practices

## 📝 License

Proprietary - RajaOTP Brand

## 📞 Support

Untuk soal teknis dan development, silakan contact team development.

---

**Dibuat dengan ❤️ untuk RajaOTP - Professional OTP Service**
