/**
 * 🛡️ ORDER MANAGER - HARDENED
 * 
 * Source of truth untuk semua order data.
 * - Persistensi order ke file JSON
 * - Idempotensi deduction & refund
 * - Order lifecycle management
 * - Audit logging
 */

const fs = require("fs");
const path = require("path");
const SafetyHelpers = require("./SafetyHelpers");

const ORDER_DB_PATH = path.join(__dirname, "orders.json");
const AUDIT_LOG_PATH = path.join(__dirname, "order_audit.json");

// ========================================
// 1️⃣ ORDER SCHEMA VALIDATION
// ========================================

const VALID_ORDER_STATUSES = [
  "created",
  "pending", 
  "success",
  "failed",
  "expired",
  "cancelled"
];

const VALID_REFUND_STATUSES = ["none", "refunded"];

/**
 * Validasi struktur order
 */
function validateOrder(order) {
  if (!order) return false;
  
  const required = ["id", "userId", "amount", "status", "created_at"];
  const allHave = required.every(f => f in order);
  
  if (!allHave) return false;
  
  // Status harus valid
  if (!VALID_ORDER_STATUSES.includes(order.status?.toLowerCase())) {
    return false;
  }
  
  // Refund status harus valid
  if (order.refund_status && !VALID_REFUND_STATUSES.includes(order.refund_status)) {
    return false;
  }
  
  return true;
}

/**
 * Buat order baru dengan struktur lengkap
 */
function createOrder(orderId, userId, amount, options = {}) {
  const {
    service = "Unknown",
    country = "Unknown",
    operator = "Unknown",
    phoneNumber = "Unknown",
    providerServer = "Unknown"
  } = options;

  return {
    id: String(orderId),
    userId: String(userId),
    amount: Number(amount),
    status: "created",
    deducted: false,                    // ⚠️ GUARD: Saldo belum dipotong
    refund_status: "none",              // none | refunded
    refundLock: false,                  // Untuk mencegah race condition
    service,
    country,
    operator,
    phoneNumber,
    providerServer,
    created_at: new Date().toISOString(),
    expired_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),  // 15 menit
    success_at: null,
    cancelled_at: null,
    refunded_at: null,
    refund_reason: null
  };
}

// ========================================
// 2️⃣ ORDER PERSISTENCE
// ========================================

/**
 * Load semua order dari file
 */
function loadOrders() {
  try {
    if (fs.existsSync(ORDER_DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(ORDER_DB_PATH, "utf-8"));
      return Array.isArray(data) ? data : {};
    }
  } catch (err) {
    console.error(`[ORDER_LOAD_ERROR] ${err.message}`);
  }
  return {};
}

/**
 * Simpan semua order ke file
 */
function saveOrders(orders) {
  try {
    // Validasi sebelum simpan
    Object.values(orders).forEach(order => {
      if (!validateOrder(order)) {
        console.warn(`[ORDER_VALIDATION_FAIL] Invalid order: ${order.id}`);
      }
    });

    // Atomic write dengan tmp file
    const tmpPath = `${ORDER_DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(orders, null, 2), "utf-8");
    
    // Rename atomic
    if (fs.existsSync(ORDER_DB_PATH)) {
      fs.unlinkSync(ORDER_DB_PATH);
    }
    fs.renameSync(tmpPath, ORDER_DB_PATH);
    
    return true;
  } catch (err) {
    console.error(`[ORDER_SAVE_ERROR] ${err.message}`);
    return false;
  }
}

/**
 * Ambil order by ID
 */
function getOrder(orderId) {
  const orders = loadOrders();
  return orders[String(orderId)] || null;
}

/**
 * Update order field
 */
function updateOrder(orderId, updates) {
  try {
    const orders = loadOrders();
    const order = orders[String(orderId)];
    
    if (!order) {
      console.warn(`[ORDER_UPDATE_FAIL] Order ${orderId} not found`);
      return false;
    }

    // 🛡️ Validasi update
    Object.assign(order, updates);
    
    if (!validateOrder(order)) {
      console.error(`[ORDER_UPDATE_INVALID] Order ${orderId} validation failed`);
      return false;
    }

    orders[String(orderId)] = order;
    return saveOrders(orders);
  } catch (err) {
    console.error(`[ORDER_UPDATE_ERROR] ${err.message}`);
    return false;
  }
}

/**
 * Create & save order baru
 */
function createAndSaveOrder(orderId, userId, amount, options = {}) {
  try {
    const orders = loadOrders();
    
    // Cek duplikasi
    if (orders[String(orderId)]) {
      console.warn(`[ORDER_DUPLICATE] Order ${orderId} already exists`);
      return orders[String(orderId)];
    }

    const newOrder = createOrder(orderId, userId, amount, options);
    orders[String(orderId)] = newOrder;

    if (saveOrders(orders)) {
      auditLog("order_created", {
        orderId,
        userId,
        amount,
        service: options.service
      });
      return newOrder;
    }

    return null;
  } catch (err) {
    console.error(`[ORDER_CREATE_ERROR] ${err.message}`);
    return null;
  }
}

/**
 * Ambil semua order user
 */
function getUserOrders(userId) {
  const orders = loadOrders();
  return Object.values(orders)
    .filter(o => String(o.userId) === String(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ========================================
// 3️⃣ DEDUCTION SAFETY
// ========================================

/**
 * Mark order sebagai "deducted" (idempotensi)
 * HANYA boleh dipanggil SEKALI per order
 */
function markOrderAsDeducted(orderId) {
  const order = getOrder(orderId);
  
  if (!order) {
    console.warn(`[DEDUCT_MARK_FAIL] Order ${orderId} not found`);
    return false;
  }

  // 🔒 GUARD: Sudah dipotong sebelumnya?
  if (order.deducted === true) {
    console.warn(`[DEDUCT_SKIP] Order ${orderId} already deducted`);
    return true; // Idempotent: return true (sudah aman)
  }

  // Update ke file
  return updateOrder(orderId, {
    deducted: true,
    deducted_at: new Date().toISOString()
  });
}

/**
 * Check apakah order sudah di-deduct
 */
function isOrderDeducted(orderId) {
  const order = getOrder(orderId);
  return order ? order.deducted === true : false;
}

// ========================================
// 4️⃣ REFUND SAFETY
// ========================================

/**
 * Check apakah order bisa direfund
 */
function canRefund(orderId) {
  const order = getOrder(orderId);
  
  if (!order) return false;
  
  // Hanya status ini yang boleh direfund
  const refundable = ["failed", "expired", "cancelled"];
  const isRefundable = refundable.includes(order.status?.toLowerCase());
  
  // Belum direfund sebelumnya
  const notRefunded = order.refund_status !== "refunded";
  
  return isRefundable && notRefunded;
}

/**
 * Mark order sebagai "refunded"
 * HANYA boleh dipanggil SEKALI per order
 */
function markOrderAsRefunded(orderId, reason = "Unknown") {
  const order = getOrder(orderId);
  
  if (!order) {
    console.warn(`[REFUND_MARK_FAIL] Order ${orderId} not found`);
    return false;
  }

  // 🔒 GUARD: Sudah direfund sebelumnya?
  if (order.refund_status === "refunded") {
    console.warn(`[REFUND_SKIP] Order ${orderId} already refunded`);
    return true; // Idempotent
  }

  // Update
  return updateOrder(orderId, {
    refund_status: "refunded",
    refunded_at: new Date().toISOString(),
    refund_reason: reason
  });
}

/**
 * Check apakah order sudah direfund
 */
function isOrderRefunded(orderId) {
  const order = getOrder(orderId);
  return order ? order.refund_status === "refunded" : false;
}

// ========================================
// 5️⃣ ORDER STATUS UPDATE
// ========================================

/**
 * Update order status dengan validasi
 */
function updateOrderStatus(orderId, newStatus, metadata = {}) {
  const order = getOrder(orderId);
  
  if (!order) {
    console.warn(`[STATUS_UPDATE_FAIL] Order ${orderId} not found`);
    return false;
  }

  const status = newStatus?.toLowerCase();
  
  if (!VALID_ORDER_STATUSES.includes(status)) {
    console.warn(`[STATUS_INVALID] ${status} is not valid`);
    return false;
  }

  const updates = { status };

  // Auto-set timestamps untuk status tertentu
  if (status === "success") {
    updates.success_at = new Date().toISOString();
  } else if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
  }

  Object.assign(updates, metadata);

  return updateOrder(orderId, updates);
}

// ========================================
// 6️⃣ AUDIT LOGGING
// ========================================

/**
 * Log semua perubahan order penting
 */
function auditLog(event, data) {
  try {
    let logs = [];
    
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      logs = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, "utf-8"));
      if (!Array.isArray(logs)) logs = [];
    }

    logs.push({
      timestamp: new Date().toISOString(),
      event,
      data
    });

    // Keep only last 10000 logs
    if (logs.length > 10000) {
      logs = logs.slice(-10000);
    }

    fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error(`[AUDIT_LOG_ERROR] ${err.message}`);
  }
}

// ========================================
// 7️⃣ EXPIRED ORDER CLEANUP
// ========================================

/**
 * Scan order expired dan mark status
 * TIDAK auto-refund, hanya mark expired
 * Refund dilakukan oleh scheduler terpisah
 */
function scanExpiredOrders() {
  try {
    const orders = loadOrders();
    const now = new Date();
    let updated = 0;

    Object.values(orders).forEach(order => {
      // Hanya order yang masih pending/created
      if (!["created", "pending"].includes(order.status?.toLowerCase())) {
        return;
      }

      // Check if expired
      const expiredAt = new Date(order.expired_at);
      if (now > expiredAt) {
        console.log(`[EXPIRE_SCAN] Order ${order.id} expired, marking...`);
        
        updateOrder(order.id, {
          status: "expired",
          expired_marked_at: new Date().toISOString()
        });

        auditLog("order_expired", {
          orderId: order.id,
          userId: order.userId,
          amount: order.amount
        });

        updated++;
      }
    });

    if (updated > 0) {
      console.log(`[EXPIRE_SCAN] Marked ${updated} orders as expired`);
    }

    return updated;
  } catch (err) {
    console.error(`[EXPIRE_SCAN_ERROR] ${err.message}`);
    return 0;
  }
}

// ========================================
// 8️⃣ INITIALIZATION
// ========================================

/**
 * Initialize order database jika belum ada
 */
function initialize() {
  try {
    if (!fs.existsSync(ORDER_DB_PATH)) {
      fs.writeFileSync(ORDER_DB_PATH, JSON.stringify({}, null, 2));
      console.log("[ORDER_DB] Initialized orders.json");
    }

    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify([], null, 2));
      console.log("[ORDER_DB] Initialized order_audit.json");
    }
  } catch (err) {
    console.error(`[ORDER_DB_INIT_ERROR] ${err.message}`);
  }
}

// Auto-init saat load module
initialize();

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Validation
  validateOrder,
  
  // CRUD
  createOrder,
  createAndSaveOrder,
  getOrder,
  getUserOrders,
  updateOrder,
  updateOrderStatus,
  loadOrders,
  saveOrders,
  
  // Deduction
  markOrderAsDeducted,
  isOrderDeducted,
  
  // Refund
  canRefund,
  markOrderAsRefunded,
  isOrderRefunded,
  
  // Maintenance
  scanExpiredOrders,
  auditLog,
  
  // Constants
  VALID_ORDER_STATUSES,
  VALID_REFUND_STATUSES,
  ORDER_DB_PATH,
  AUDIT_LOG_PATH
};
