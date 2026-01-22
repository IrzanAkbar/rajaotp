# 🔗 BOT ↔ WEB CONNECTION SETUP & VERIFICATION

**Status**: Ready to Connect | All Features Implemented

---

## 1️⃣ SETUP KONEKSI (Step-by-Step Ringkas)

### A. ENV VARIABLES DI VERCEL

Set di Vercel Project → Settings → Environment Variables:

```env
BOT_SECRET_KEY=your_secure_secret_key_here_min_32_chars
BOT_WEBHOOK_ENDPOINT=http://your-bot-server:3000  # (optional, untuk reverse webhook)
```

**Catatan**: Gunakan string random 32+ characters. Contoh:
```
BOT_SECRET_KEY=aBcDeF1234567890xYzAbCdEf1234567890XyZ
```

---

### B. CONFIG.JS DI BOT

File: `/botraja/config.js`

Cari / tambahkan section `webAdmin`:

```javascript
module.exports = {
  // ... config lainnya ...
  
  webAdmin: {
    enabled: true,                              // WAJIB true
    endpoint: 'https://yourapp.vercel.app',     // URL Vercel web (HTTPS!)
    endpointPath: '/api/bot/event',             // Path endpoint
    secretKey: 'aBcDeF1234567890xYzAbCdEf1234567890XyZ',  // SAMA dengan Vercel
    timeout: 5000,                              // 5 detik
    retries: 2,                                 // Retry 2x jika gagal
    retryDelay: 1000,                           // 1 detik tunggu
  },
};
```

**PENTING**: `secretKey` HARUS **SAMA PERSIS** di bot & Vercel env!

---

### C. CHECKLIST SETUP

- [ ] Vercel env var `BOT_SECRET_KEY` sudah set
- [ ] Bot config.js `webAdmin.enabled = true`
- [ ] Bot config.js `secretKey` = Vercel `BOT_SECRET_KEY` (SAMA!)
- [ ] Bot config.js `endpoint` = URL Vercel (HTTPS, no trailing slash)
- [ ] Bot sudah restart / reload config

---

---

## 2️⃣ TEST KONEKSI (1 Event Test)

### A. KIRIM TEST EVENT DARI BOT

Di **bot console** atau **script test**, jalankan:

```javascript
const webhook = require('./lib/webhook');

// Test dengan order_success
webhook.sendOrderSuccess({
  orderId: 'TEST-001',
  userId: 12345,
  amount: 50000,
  description: 'Test Order',
});

// Atau test error
webhook.sendBotError({
  userId: 12345,
  message: 'Test Error Event',
  code: 'TEST_ERROR',
});
```

**Atau pakai curl** (dari bot server):

```bash
curl -X POST https://yourapp.vercel.app/api/bot/event \
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

---

### B. RESPONSE SUKSES YANG HARUS MUNCUL

**Bot log** harus tampil:
```
[WEBHOOK] ✓ Event sent: order_success (200 OK)
[WEBHOOK] Response: {"success":true,"eventId":"evt_xxxxx","stats":{"totalEvents":1,"uniqueUsers":1}}
```

**Curl response** harus:
```json
{
  "success": true,
  "eventId": "evt_xxxxxxxxxxxx",
  "stats": {
    "totalEvents": 1,
    "uniqueUsers": 1
  }
}
```

---

### C. TANDA SUKSES DI 3 TEMPAT

| Tempat | Tanda Sukses |
|---|---|
| **Bot Log** | `✓ Event sent: order_success (200 OK)` |
| **Webhook Response** | `"success": true` + `eventId` muncul |
| **Dashboard Web** | Event muncul di `/admin/events` dengan badge warna |

---

---

## 3️⃣ CHECKLIST VERIFIKASI FITUR

### 🔹 WEB ADMIN SETUP

- [ ] **Endpoint** `/api/bot/event` aktif (POST)
- [ ] **Auth** Bearer token validation active
- [ ] **Storage** `/data/bot-events.json` terbuat otomatis
- [ ] **Dashboard** load di `/admin/dashboard` tanpa 500 error
- [ ] **Events Page** tampil di `/admin/events`

### 🔹 BOT SETUP

- [ ] **config.js** valid syntax, no error on require
- [ ] **Webhook client** loaded (`/lib/webhook.js`)
- [ ] **webAdmin.enabled** = true
- [ ] **Retry logic** aktif (2x retry + 1 sec delay)
- [ ] **Bot tidak crash** saat webhook gagal

### 🔹 EVENT TYPES - SEMUA HARUS SUPPORT

| Event Type | Badge Color | Test Command |
|---|---|---|
| `order_success` | 🟢 Emerald | `webhook.sendOrderSuccess({...})` |
| `order_refund` | 🔴 Red | `webhook.sendOrderRefund({...})` |
| `saldo_update` | 🔵 Blue | `webhook.sendSaldoUpdate({...})` |
| `deposit_success` | 🟢 Emerald | `webhook.sendDepositSuccess({...})` |
| `bot_error` | 🔴 Red | `webhook.sendBotError({...})` |

**Verifikasi**: Setiap event muncul di dashboard dengan badge warna **BENAR**.

### 🔹 DASHBOARD FEATURES

- [ ] **Stat Cards** load (Total Users, Total Saldo, Active Users, Success Rate)
- [ ] **Recent Activity** section tampil
- [ ] **Filter Pills** (All, Success, Refund, Update, Errors) berfungsi
- [ ] **Event List** scrollable, max-height 600px
- [ ] **Auto-refresh** toggle ON → polling tiap 5 detik
- [ ] **Empty State** tampil jika 0 events (clock icon + message)
- [ ] **Loading State** skeleton muncul saat fetch
- [ ] **Timestamps** readable (Today, Yesterday, atau date)
- [ ] **User ID** tertampil dengan correct format
- [ ] **Amounts** format Rp. X,XXX.XXX

### 🔹 STORAGE & PERSISTENCE

- [ ] **File** `/data/bot-events.json` terbuat
- [ ] **Max Events** 1000 (FIFO: oldest removed saat exceed)
- [ ] **Event Structure** lengkap:
  ```json
  {
    "id": "evt_xxxxx",
    "eventType": "order_success",
    "data": {...},
    "timestamp": "2026-01-22T...",
    "receivedAt": "2026-01-22T...",
    "processed": true
  }
  ```

---

---

## 4️⃣ DEBUG CEPAT (TROUBLESHOOTING)

### ❌ Event Tidak Masuk

| Gejala | Cek |
|---|---|
| Bot log: `Error: Connection refused` | 1. Vercel URL benar? 2. HTTPs? 3. Domain resolve? |
| Bot log: `401 Unauthorized` | 1. `secretKey` sama? 2. Bearer token format? |
| Bot log: `Empty response from server` | 1. `/api/bot/event` endpoint exist? 2. CORS issue? |
| Bot log: `Timeout after 5000ms` | 1. Vercel slow / down? 2. Timeout terlalu kecil? |
| Event masuk (log OK) tapi tidak di storage | 1. `/data` folder exist? 2. Write permission? 3. JSON format? |

---

### ❌ 401 / Forbidden

| Gejala | Solusi |
|---|---|
| `401 Unauthorized - No Bearer token` | Header harus: `Authorization: Bearer <secretKey>` |
| `401 Unauthorized - Invalid token` | `secretKey` di bot !== Vercel env var |
| `403 Forbidden - Token mismatch` | Copy-paste ulang secretKey (perhatian whitespace) |

---

### ❌ Timeout / Slow

| Gejala | Solusi |
|---|---|
| Timeout setiap request | 1. Tingkatkan `timeout: 10000` di config.js 2. Check Vercel cold start |
| First event timeout, sisanya OK | Normal (Vercel cold start) |
| Consistently timeout | 1. Check internet bot → Vercel 2. Firewall? |

---

### ❌ Event Masuk tapi Tidak Tampil

| Gejala | Cek |
|---|---|
| `/api/bot/events?limit=50` return kosong | 1. POST event dulu! 2. `/data/bot-events.json` ada isi? |
| Event tampil di debug tapi dashboard blank | 1. Dashboard load `/api/bot/events`? 2. Filter active? 3. Browser cache? |
| Hanya beberapa event tampil | 1. Limit filtering? 2. Check `byType` count |
| Badge warna salah | 1. Event type typo? 2. `getEventBadgeVariant()` return benar? |

---

### ✅ VERIFY STEP-BY-STEP

```bash
# 1. Check bot config syntax
node -c /path/to/config.js

# 2. Test endpoint exists (from bot server)
curl -H "Authorization: Bearer YOUR_SECRET_KEY" \
     https://yourapp.vercel.app/api/bot/event

# 3. Send test event
node -e "
  const webhook = require('./lib/webhook');
  webhook.sendOrderSuccess({orderId: 'TEST', userId: 123, amount: 50000});
"

# 4. Check storage file
cat /data/bot-events.json | jq '.[] | {eventType, timestamp}' | head -5

# 5. Check dashboard API
curl https://yourapp.vercel.app/api/bot/events?limit=10 | jq '.events | length'
```

---

---

## 5️⃣ QUICK REFERENCE

### ENV VAR CHECKLIST

```env
# Vercel
BOT_SECRET_KEY=<32+ char random string>

# Bot config.js
webAdmin: {
  enabled: true,
  endpoint: 'https://app.vercel.app',      // HTTPS!
  endpointPath: '/api/bot/event',
  secretKey: '<SAME AS BOT_SECRET_KEY>',
  timeout: 5000,
  retries: 2,
  retryDelay: 1000,
}
```

### API ENDPOINTS

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/bot/event` | Send event from bot |
| GET | `/api/bot/events` | Query events (filter, limit, etc) |

### EVENT STRUCTURE

```javascript
{
  eventType: 'order_success|order_refund|saldo_update|deposit_success|bot_error',
  data: {
    userId: number,
    orderId?: string,
    amount?: number,
    refundAmount?: number,
    changeAmount?: number,
    depositAmount?: number,
    channel?: string,
    reason?: string,
    message?: string,
  }
}
```

### FILTER QUERY

```
GET /api/bot/events?type=order_success&limit=50&userId=123
GET /api/bot/events?type=bot_error&limit=20
GET /api/bot/events?limit=100&stats=true
```

---

---

## 🎯 SUMMARY

**Setup = 3 steps:**
1. Set `BOT_SECRET_KEY` di Vercel
2. Isi `webAdmin` di bot config.js (SAME secretKey)
3. Restart bot

**Test = 1 curl:**
```bash
curl -X POST https://app.vercel.app/api/bot/event \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -d '{"eventType":"order_success","data":{"userId":123,"amount":50000}}'
```

**Verify = Check 3 places:**
- Bot log: `✓ Event sent`
- Response: `"success": true`
- Dashboard: Event muncul dengan badge warna

**Troubleshoot = Check:**
- Secret key sama?
- HTTPS URL?
- `/api/bot/event` endpoint exist?
- Storage file writable?

**SIAP NYAMBUNG!**
