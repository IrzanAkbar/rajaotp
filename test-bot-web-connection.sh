#!/bin/bash
# BOT ↔ WEB INTEGRATION - VERIFICATION TEST SCRIPT
# Run this after setup to verify everything works

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🔗 BOT ↔ WEB INTEGRATION TEST"
echo "=========================================="
echo ""

# Configuration
read -p "Enter your Vercel app URL (e.g., https://app.vercel.app): " WEB_URL
read -p "Enter your Bot Secret Key: " SECRET_KEY

# Validate inputs
if [ -z "$WEB_URL" ] || [ -z "$SECRET_KEY" ]; then
    echo -e "${RED}❌ Error: URL and Secret Key required${NC}"
    exit 1
fi

# Add trailing slash if needed
WEB_URL="${WEB_URL%/}"

echo ""
echo "📋 TEST CONFIGURATION"
echo "├─ Web URL: $WEB_URL"
echo "├─ Secret Key: ${SECRET_KEY:0:10}...${SECRET_KEY: -5}"
echo "└─ Endpoint: $WEB_URL/api/bot/event"
echo ""

# TEST 1: Check if endpoint exists
echo -n "1️⃣  Testing endpoint availability... "
if curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$WEB_URL/api/bot/event" > /dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Check: URL correct? Vercel deployment done?"
fi

echo ""

# TEST 2: Send test event (order_success)
echo -n "2️⃣  Sending test event (order_success)... "
RESPONSE=$(curl -s -X POST "$WEB_URL/api/bot/event" \
  -H "Authorization: Bearer $SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_success",
    "data": {
      "orderId": "TEST-001",
      "userId": 12345,
      "amount": 50000
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    EVENT_ID=$(echo "$RESPONSE" | grep -o '"eventId":"[^"]*"' | cut -d'"' -f4)
    echo "   Event ID: $EVENT_ID"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $RESPONSE"
    echo "   Check: Secret key correct? Token valid?"
fi

echo ""

# TEST 3: Query API - list events
echo -n "3️⃣  Querying events (GET /api/bot/events)... "
EVENTS=$(curl -s "$WEB_URL/api/bot/events?limit=10")

if echo "$EVENTS" | grep -q '"success":true'; then
    EVENT_COUNT=$(echo "$EVENTS" | grep -o '"totalEvents":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Total events in storage: $EVENT_COUNT"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $EVENTS"
fi

echo ""

# TEST 4: Send refund event
echo -n "4️⃣  Sending test event (order_refund)... "
RESPONSE=$(curl -s -X POST "$WEB_URL/api/bot/event" \
  -H "Authorization: Bearer $SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_refund",
    "data": {
      "orderId": "TEST-002",
      "userId": 12345,
      "refundAmount": 25000,
      "reason": "Customer request"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# TEST 5: Send error event
echo -n "5️⃣  Sending test event (bot_error)... "
RESPONSE=$(curl -s -X POST "$WEB_URL/api/bot/event" \
  -H "Authorization: Bearer $SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "bot_error",
    "data": {
      "userId": 12345,
      "message": "Test error event",
      "code": "TEST_ERROR"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# TEST 6: Filter by type
echo -n "6️⃣  Testing event filter (type=order_success)... "
FILTERED=$(curl -s "$WEB_URL/api/bot/events?type=order_success&limit=10")

if echo "$FILTERED" | grep -q '"eventType":"order_success"'; then
    COUNT=$(echo "$FILTERED" | grep -o '"eventType":"order_success"' | wc -l)
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Found $COUNT order_success events"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# TEST 7: Check unauthorized access
echo -n "7️⃣  Testing authorization (invalid token)... "
RESPONSE=$(curl -s -X POST "$WEB_URL/api/bot/event" \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"order_success","data":{}}')

if echo "$RESPONSE" | grep -q -E '(401|Unauthorized|forbidden)'; then
    echo -e "${GREEN}✓ PASS${NC} (correctly rejected)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} (should reject invalid tokens)"
fi

echo ""
echo "=========================================="
echo "✅ TEST COMPLETE"
echo "=========================================="
echo ""
echo "📊 NEXT STEPS:"
echo "1. Check dashboard: $WEB_URL/admin/events"
echo "2. Look for test events with badges"
echo "3. Verify filter pills work"
echo "4. Check timestamps are readable"
echo ""
echo "📖 For more details, see:"
echo "   - BOT_WEB_SETUP_GUIDE.md (section 4: debugging)"
echo "   - FEATURE_IMPLEMENTATION_COMPLETE.md (checklist)"
echo ""
