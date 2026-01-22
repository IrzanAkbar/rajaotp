# 🔗 RajaOTP Bot ↔ Web Integration

**Bot & Web Connected Dashboard**

Webhook-based event streaming from Pterodactyl bot to Vercel web admin.

---

## 🚀 QUICK START (5 MIN)

👉 **START HERE**: [QUICK_START_BOT_WEB.md](QUICK_START_BOT_WEB.md)

Copy-paste 3 steps to get connected:
1. Set Vercel env var `BOT_SECRET_KEY`
2. Update bot `config.js` webAdmin section
3. Test with 1 curl command

**Setup time**: 5 minutes
**Restart needed**: Yes (bot only)
**Downtime**: None

---

## 📚 DOCUMENTATION

| Document | Purpose | Time |
|---|---|---|
| [QUICK_START_BOT_WEB.md](QUICK_START_BOT_WEB.md) | Copy-paste setup | 5 min |
| [BOT_WEB_SETUP_GUIDE.md](BOT_WEB_SETUP_GUIDE.md) | Detailed + debugging | 15 min |
| [SETUP_CHECKLIST_PRINTABLE.md](SETUP_CHECKLIST_PRINTABLE.md) | Step-by-step checklist | Print |
| [FEATURE_IMPLEMENTATION_COMPLETE.md](FEATURE_IMPLEMENTATION_COMPLETE.md) | What's implemented | 10 min |
| [ADMIN_DASHBOARD_DARK_ELEGANT.md](ADMIN_DASHBOARD_DARK_ELEGANT.md) | UI/UX guide | 5 min |
| [BOT_WEB_DOCS_INDEX.md](BOT_WEB_DOCS_INDEX.md) | Master index | 2 min |
| [SETUP_COMPLETE_SUMMARY.md](SETUP_COMPLETE_SUMMARY.md) | Overview | 3 min |

---

## ✅ WHAT'S IMPLEMENTED

### Backend
- ✅ POST `/api/bot/event` (webhook receiver with Bearer token)
- ✅ GET `/api/bot/events` (query API with filters)
- ✅ Event storage (FIFO, max 1000 events, JSON file)
- ✅ Automatic stats calculation (totalEvents, byType, uniqueUsers)

### Frontend
- ✅ Dashboard (4 stat cards + recent activity)
- ✅ Events page (filter pills + color-coded badges + scrollable list)
- ✅ Logs page (system events display)
- ✅ Settings page (configuration interface)
- ✅ Users page (management list)
- ✅ Auto-refresh (5 sec) + manual refresh
- ✅ Loading skeletons + empty states
- ✅ Dark elegan SaaS design
- ✅ Responsive (mobile, tablet, desktop)

### Bot Integration
- ✅ config.js support (webAdmin section)
- ✅ webhook.js client (5 functions)
- ✅ Retry logic (2x retry, 1 sec delay)
- ✅ Error logging + recovery
- ✅ Won't crash bot if webhook fails

### Event Types (All 5)
- ✅ `order_success` (Emerald badge)
- ✅ `order_refund` (Red badge)
- ✅ `saldo_update` (Blue badge)
- ✅ `deposit_success` (Emerald badge)
- ✅ `bot_error` (Red badge)

---

## 🔗 ARCHITECTURE

```
BOT (Pterodactyl)
  ↓ webhook.sendOrderSuccess()
  ↓ POST /api/bot/event + Bearer token
  ↓
WEB (Vercel)
  ↓ /api/bot/event (validate + store)
  ↓ /data/bot-events.json (FIFO)
  ↓
DASHBOARD
  ↓ GET /api/bot/events
  ↓ BotEventsFeed (display + refresh)
  ↓ Color-coded badges ✅
```

---

## 🎯 SETUP IN 3 STEPS

### 1. Vercel Env Var
```env
BOT_SECRET_KEY=aBcDeF1234567890xYzAbCdEf1234567890XyZ
```

### 2. Bot config.js
```javascript
webAdmin: {
  enabled: true,
  endpoint: 'https://your-app.vercel.app',
  endpointPath: '/api/bot/event',
  secretKey: 'aBcDeF1234567890xYzAbCdEf1234567890XyZ',  // SAME!
  timeout: 5000,
  retries: 2,
  retryDelay: 1000,
}
```

### 3. Test
```bash
curl -X POST https://your-app.vercel.app/api/bot/event \
  -H "Authorization: Bearer aBcDeF1234567890xYzAbCdEf1234567890XyZ" \
  -d '{"eventType":"order_success","data":{"userId":123,"amount":50000}}'
```

**Response**: `{"success":true,"eventId":"evt_xxx"}`

---

## ✅ VERIFICATION CHECKLIST

- [ ] Bot running on Pterodactyl
- [ ] Web deployed to Vercel
- [ ] `BOT_SECRET_KEY` set in Vercel env
- [ ] Bot `config.js` updated
- [ ] Secret key **SAME** in both places
- [ ] Bot restarted
- [ ] Test curl returns `{"success":true}`
- [ ] Event appears in `/admin/events`
- [ ] Badge color correct (emerald for success)
- [ ] Auto-refresh working (5 sec)

👉 **Full checklist**: [SETUP_CHECKLIST_PRINTABLE.md](SETUP_CHECKLIST_PRINTABLE.md)

---

## 🐛 TROUBLESHOOTING

| Error | Check |
|---|---|
| 401 Unauthorized | Secret key match in bot & Vercel? |
| Connection refused | URL HTTPS? Domain correct? |
| Event not showing | Check `/data/bot-events.json` exists? |
| Badge wrong color | Event type correct (case-sensitive)? |

👉 **Full debugging**: [BOT_WEB_SETUP_GUIDE.md](BOT_WEB_SETUP_GUIDE.md) (Section 4)

---

## 📂 PROJECT FILES

```
Core Documentation
├── QUICK_START_BOT_WEB.md
├── BOT_WEB_SETUP_GUIDE.md
├── SETUP_CHECKLIST_PRINTABLE.md
├── SETUP_COMPLETE_SUMMARY.md
├── BOT_WEB_DOCS_INDEX.md
├── FEATURE_IMPLEMENTATION_COMPLETE.md
├── ADMIN_DASHBOARD_DARK_ELEGANT.md
└── test-bot-web-connection.sh

Backend (Bot)
├── /botraja/config.js (webAdmin config)
└── /botraja/lib/webhook.js (webhook client)

API (Web)
├── /app/api/bot/event/route.ts (POST receiver)
├── /app/api/bot/events/route.ts (GET query)
└── /app/lib/bot-event-storage.ts (storage system)

Frontend (Dashboard)
├── /app/admin/layout.tsx (sidebar + header)
├── /app/admin/dashboard/page.tsx (stats + activity)
├── /app/admin/events/page.tsx (event list)
├── /app/admin/logs/page.tsx (system logs)
├── /app/admin/settings/page.tsx (settings)
└── /app/admin/users/page.tsx (user list)

Components
├── /app/admin/components/Card.tsx
├── /app/admin/components/Badge.tsx
├── /app/admin/components/Skeleton.tsx
└── /app/admin/components/BotEventsFeed.tsx
```

---

## 🎨 DESIGN

- **Theme**: Dark elegan SaaS professional
- **Colors**: slate-950 (bg), slate-900 (cards), blue-purple gradient (accent)
- **Layout**: Fixed sidebar + responsive grid
- **Components**: Card, Badge, Skeleton, BotEventsFeed (reusable)
- **Responsive**: Mobile, tablet, desktop optimized

---

## 📊 TECH STACK

**Frontend**: Next.js 16.1.1 (App Router), TypeScript, Tailwind CSS 4, Lucide React
**Backend**: Next.js API Routes, Node.js
**Storage**: JSON file (FIFO, max 1000 events)
**Authentication**: Bearer token
**Deployment**: Vercel (web), Pterodactyl (bot)

---

## 🔐 SECURITY

- ✅ Bearer token authentication (32+ chars)
- ✅ HTTPS only (Vercel enforces)
- ✅ Input validation (eventType, data)
- ✅ Error responses (no data leaks)
- ✅ CORS configured

---

## 📈 PERFORMANCE

- ✅ FIFO storage (max 1000 events keeps light)
- ✅ Pagination support (limit, offset)
- ✅ 5 sec auto-refresh (efficient polling)
- ✅ Retry logic (2x with backoff)
- ✅ Async handling (non-blocking)

---

## ✅ STATUS

- ✅ Build: PASS (all pages compiled)
- ✅ Features: COMPLETE (all 5 event types)
- ✅ Documentation: COMPLETE
- ✅ Security: IMPLEMENTED
- ✅ Ready: PRODUCTION ✅

---

## 🚀 NEXT STEPS

1. Read [QUICK_START_BOT_WEB.md](QUICK_START_BOT_WEB.md)
2. Set Vercel env var
3. Update bot config.js
4. Test with curl
5. Verify dashboard
6. Deploy & monitor

**Goal**: Bot & Web connected in 5 minutes!

---

**For detailed setup**: See [BOT_WEB_DOCS_INDEX.md](BOT_WEB_DOCS_INDEX.md) (master index)
