# ✅ BOT ↔ WEB CONNECTION - FINAL CHECKLIST

**Print this and check off as you go!**

---

## 📋 PRE-SETUP VERIFICATION

- [ ] Bot running on Pterodactyl
- [ ] Web deployed to Vercel
- [ ] Both have internet connection
- [ ] HTTPS domain on Vercel (not HTTP)
- [ ] You have admin access to Vercel project settings
- [ ] You have bot config.js access

---

## 🔧 SETUP PHASE (5 MIN)

### A. Vercel Environment Variable

- [ ] Go to Vercel Project → Settings → Environment Variables
- [ ] Create new variable: `BOT_SECRET_KEY`
- [ ] Value: `aBcDeF1234567890xYzAbCdEf1234567890XyZ` (or generate your own 32+ chars)
- [ ] Save & redeploy
- [ ] Generated secret key noted: ___________________________________

### B. Bot Config

- [ ] Open `/botraja/config.js`
- [ ] Find or add section:
  ```javascript
  webAdmin: {
    enabled: true,
    endpoint: 'https://your-vercel-app.vercel.app',
    endpointPath: '/api/bot/event',
    secretKey: '<SAME SECRET KEY>',
    timeout: 5000,
    retries: 2,
    retryDelay: 1000,
  }
  ```
- [ ] Replace `your-vercel-app` with actual Vercel URL
- [ ] Replace `<SAME SECRET KEY>` with exact value from Vercel env
- [ ] Verify NO typos in endpoint URL
- [ ] Verify secret key is **EXACTLY SAME** in both places
- [ ] Save config file
- [ ] Restart bot

### C. Verify Bot Restart

- [ ] Bot process restarted (Pterodactyl console shows restart)
- [ ] No error messages in bot logs
- [ ] Bot running normally

---

## 🧪 TEST PHASE (5 MIN)

### A. Basic Connectivity Test

```bash
# Test if endpoint is reachable
curl -I https://your-vercel-app.vercel.app/api/bot/event
```

- [ ] Response includes `HTTP/2 405` or similar (not 404)
- [ ] No connection errors

### B. Webhook Test (First Event)

```bash
# Send test order_success event
curl -X POST https://your-vercel-app.vercel.app/api/bot/event \
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

- [ ] Response contains `"success":true`
- [ ] Response contains `"eventId"` with value
- [ ] No 401/403 error (if yes → secret key mismatch)
- [ ] No 500 error (if yes → check web logs)

### C. Event Storage Verification

- [ ] File `/data/bot-events.json` exists on web (check Vercel)
- [ ] File contains JSON array with event
- [ ] Event has fields: `id`, `eventType`, `data`, `timestamp`

### D. Dashboard Verification

- [ ] Open: `https://your-vercel-app.vercel.app/admin/events`
- [ ] Page loads without 500 error
- [ ] Event list shows test event
- [ ] Event badge color is **EMERALD** (order_success = green)
- [ ] Event details show Order ID "TEST-001"
- [ ] Timestamp is readable

---

## ✅ FEATURE VERIFICATION

### A. Event Types (Test All 5)

**Test order_refund**:
- [ ] Send refund event via curl
- [ ] Badge color is **RED**
- [ ] Shows in dashboard

**Test saldo_update**:
- [ ] Send saldo event via curl
- [ ] Badge color is **BLUE**
- [ ] Shows in dashboard

**Test deposit_success**:
- [ ] Send deposit event via curl
- [ ] Badge color is **EMERALD** (green)
- [ ] Shows in dashboard

**Test bot_error**:
- [ ] Send error event via curl
- [ ] Badge color is **RED**
- [ ] Shows in dashboard

### B. Dashboard Features

- [ ] **Filter pills work**: Click "Success", "Refund", "Update", "Errors" → list filters
- [ ] **Auto-refresh**: 5 sec auto-refresh (events list updates)
- [ ] **Manual refresh**: Click refresh button → updates immediately
- [ ] **Empty state**: Delete events → "No events yet" message shows
- [ ] **Loading state**: Page loading skeleton appears
- [ ] **Timestamps**: Readable format (Today, Yesterday, or date)
- [ ] **Responsive**: Works on mobile (sidebar collapses)

### C. API Endpoints

**GET all events**:
```bash
curl https://your-vercel-app.vercel.app/api/bot/events?limit=50
```
- [ ] Returns JSON with events array
- [ ] Includes stats (totalEvents, uniqueUsers, byType)

**GET filtered events**:
```bash
curl https://your-vercel-app.vercel.app/api/bot/events?type=order_success&limit=50
```
- [ ] Returns only order_success events

---

## 🐛 IF SOMETHING FAILS

### Authorization Failed (401)

- [ ] Check: Secret key **exactly matches** in bot & Vercel
- [ ] Check: No extra spaces, quotes, or typos
- [ ] Check: Authorization header format is `Bearer <key>` (not `Basic`)
- [ ] Copy secret key again, character by character

### Connection Refused / Timeout

- [ ] Check: Vercel URL is HTTPS (not HTTP)
- [ ] Check: Domain name is correct (not localhost)
- [ ] Check: No firewall blocking outbound connections
- [ ] Check: Bot network can reach Vercel (test with `ping` or `curl`)
- [ ] Wait 5-10 seconds (Vercel cold start)

### Event Not Showing in Dashboard

- [ ] Check: Event was actually sent (curl returns success)
- [ ] Check: `/data/bot-events.json` has content
- [ ] Check: Browser cache (Ctrl+Shift+Delete, hard refresh)
- [ ] Check: Filter pill set to "All" (not filtering out event)
- [ ] Check: Page auto-refresh is on (toggle if off)

### Badge Color Wrong

- [ ] Check: Event `eventType` matches exactly (case-sensitive)
- [ ] Check: Database has correct eventType (view JSON file)
- [ ] Mapping: order_success & deposit_success = green, refund & error = red, saldo_update = blue

### Bot Not Sending Events

- [ ] Check: Bot config.js `webAdmin.enabled = true`
- [ ] Check: Bot restarted after config change
- [ ] Check: Bot calling webhook function `webhook.sendOrderSuccess()`
- [ ] Check: Bot logs show webhook attempts
- [ ] Check: No timeout errors in bot logs

---

## 🎯 FINAL SIGN-OFF

### Verify Complete Setup

- [ ] Vercel env var set ✓
- [ ] Bot config.js updated ✓
- [ ] Bot restarted ✓
- [ ] Curl test returns success ✓
- [ ] Event shows in dashboard ✓
- [ ] All 5 event types tested ✓
- [ ] Filter pills work ✓
- [ ] Auto-refresh works ✓
- [ ] Dashboard responsive ✓
- [ ] No 401/500 errors ✓

### Ready for Production?

- [ ] Dashboard displays events correctly
- [ ] Bot actively sending events
- [ ] No connection issues
- [ ] All features working

✅ **READY FOR PRODUCTION!**

---

## 📖 NEED HELP?

| Issue | Read |
|---|---|
| Forgot setup steps | `QUICK_START_BOT_WEB.md` |
| Debugging connection | `BOT_WEB_SETUP_GUIDE.md` (Section 4) |
| Feature check | `FEATURE_IMPLEMENTATION_COMPLETE.md` |
| UI questions | `ADMIN_DASHBOARD_DARK_ELEGANT.md` |

---

## ✅ SUCCESS CRITERIA

- ✅ Bot & web connected (webhook working)
- ✅ Events appearing in dashboard
- ✅ All 5 event types supported
- ✅ Color-coded badges correct
- ✅ Auto-refresh working
- ✅ Dashboard responsive
- ✅ No errors in console
- ✅ Ready for production use

---

**Date Completed**: ________________

**Your Vercel URL**: _______________________________________________

**Status**: ✅ PRODUCTION READY

🎉 **BOT ↔ WEB CONNECTION COMPLETE!**
