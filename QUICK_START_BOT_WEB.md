# ⚡ QUICK START - BOT ↔ WEB SETUP (5 MIN)

**Untuk langsung nyambung bot ke web di Vercel**

---

## 🚀 SETUP (COPY-PASTE)

### 1. VERCEL ENV VAR

```env
BOT_SECRET_KEY=aBcDeF1234567890xYzAbCdEf1234567890XyZ
```

**Generate random 32+ char string**:
- Use: https://www.random.org/strings/ atau
- Bash: `openssl rand -base64 32`

---

### 2. BOT CONFIG.JS

```javascript
// /botraja/config.js

module.exports = {
  // ... existing config ...

  webAdmin: {
    enabled: true,
    endpoint: 'https://your-app-name.vercel.app',  // CHANGE THIS!
    endpointPath: '/api/bot/event',
    secretKey: 'aBcDeF1234567890xYzAbCdEf1234567890XyZ',  // SAME AS VERCEL!
    timeout: 5000,
    retries: 2,
    retryDelay: 1000,
  },
};
```

**HARUS SAMA** `secretKey` di bot & Vercel! Copy exactly.

---

### 3. RESTART BOT

```bash
# Di Pterodactyl atau terminal bot
# Restart / reload bot process
```

---

## ✅ TEST (1 CURL)

```bash
curl -X POST https://your-app-name.vercel.app/api/bot/event \
  -H "Authorization: Bearer aBcDeF1234567890xYzAbCdEf1234567890XyZ" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_success",
    "data": {
      "orderId": "TEST-001",
      "userId": 12345,
      "amount": 50000
    }
  }'
```

**Response sukses**:
```json
{"success":true,"eventId":"evt_xxxxx","stats":{"totalEvents":1,"uniqueUsers":1}}
```

---

## 🔍 LIHAT HASILNYA

**Dashboard**: https://your-app-name.vercel.app/admin/dashboard

- Stat cards load? ✅
- Events tab tampil event test? ✅
- Badge warna emerald (success)? ✅

---

## 🐛 GITU GAK? CHECKLIST

| Problem | Cek |
|---|---|
| 401 Unauthorized | Secret key sama di bot & Vercel? |
| Connection refused | URL HTTPS? Domain benar? |
| Timeout | Vercel cold start? (tunggu 10 detik) |
| Event tidak tampil | Buka `/api/bot/events` di browser? |

---

## 📖 LENGKAP?

- Setup: `BOT_WEB_SETUP_GUIDE.md` (detail lengkap)
- Features: `FEATURE_IMPLEMENTATION_COMPLETE.md` (checklist)
- Dashboard: `ADMIN_DASHBOARD_DARK_ELEGANT.md` (UI guide)

---

**SIAP NYAMBUNG! 🔗**
