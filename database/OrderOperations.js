/**
 * 🛡️ ORDER OPERATIONS HARDENED
 * 
 * Safe wrappers untuk order operations
 * - Saldo deduction (idempotent, guarded)
 * - Order confirmation
 * - Auto-cancel & refund
 * - Integration with OrderManager (persistence)
 */

const fs = require("fs");
const path = require("path");
const SafetyHelpers = require("./SafetyHelpers");
const OrderManager = require("./OrderManager");

/**
 * Safe saldo deduction dengan guard & OrderManager integration
 * Pastikan tidak ada double deduction dengan flag orderId.deducted
 * @param {string} userId - User ID
 * @param {number} amount - Jumlah yang dipotong
 * @param {object} options - { filePath, orderId, service, country }
 * @returns {Promise<{success: boolean, previousSaldo: number, newSaldo: number, error?: string}>}
 */
async function safeSaloDeduction(userId, amount, options = {}) {
  const {
    filePath = "./database/saldoOtp.json",
    orderId = "UNKNOWN",
    service = "Unknown Service",
    country = "Unknown"
  } = options;

  try {
    // 🔒 IDEMPOTENSI: Check if already deducted
    if (orderId && orderId !== "UNKNOWN") {
      if (OrderManager.isOrderDeducted(orderId)) {
        console.warn(`[DEDUCT_SKIP] Order ${orderId} already deducted`);
        // Return success tetapi jangan deduct lagi
        const saldoData = SafetyHelpers.safeReadJSON(filePath, {});
        return {
          success: true,
          previousSaldo: Number(saldoData[userId]) || 0,
          newSaldo: Number(saldoData[userId]) || 0,
          alreadyDeducted: true
        };
      }
    }

    // 🛡️ Validate amount
    const validAmount = Number(amount);
    if (isNaN(validAmount) || validAmount <= 0) {
      return {
        success: false,
        error: `Invalid amount: ${amount}`
      };
    }

    // 🛡️ Read current saldo
    let saldoData = SafetyHelpers.safeReadJSON(filePath, {});
    const currentSaldo = Number(saldoData[userId]) || 0;

    // 🛡️ Check if enough balance
    if (currentSaldo < validAmount) {
      return {
        success: false,
        previousSaldo: currentSaldo,
        newSaldo: currentSaldo,
        error: `Insufficient balance: ${currentSaldo} < ${validAmount}`
      };
    }

    // 🛡️ Calculate new saldo
    const newSaldo = currentSaldo - validAmount;

    // 🛡️ Atomic write
    saldoData[userId] = newSaldo;
    const writeSuccess = SafetyHelpers.safeWriteJSON(filePath, saldoData);

    if (!writeSuccess) {
      return {
        success: false,
        previousSaldo: currentSaldo,
        newSaldo: currentSaldo,
        error: "Failed to write saldo file"
      };
    }

    // ✅ Mark order as deducted in OrderManager
    if (orderId && orderId !== "UNKNOWN") {
      const markSuccess = OrderManager.markOrderAsDeducted(orderId);
      if (!markSuccess) {
        console.error(`[DEDUCT_MARK_FAILED] Could not mark order ${orderId} as deducted`);
      }
    }

    console.log(`✅ Saldo deducted: ${userId} -> ${currentSaldo} to ${newSaldo} [Order: ${orderId}]`);

    return {
      success: true,
      previousSaldo: currentSaldo,
      newSaldo: newSaldo
    };
  } catch (err) {
    SafetyHelpers.logError(err, {
      context: "safeSaloDeduction",
      userId,
      amount,
      orderId
    });

    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Safe saldo refund dengan atomic write
 * @param {string} userId - User ID
 * @param {number} amount - Jumlah yang dikembalikan
 * @param {object} options - { filePath, orderId, reason }
 * @returns {Promise<{success: boolean, newSaldo: number, error?: string}>}
 */
async function safeSaloRefund(userId, amount, options = {}) {
  const {
    filePath = "./database/saldoOtp.json",
    orderId = "UNKNOWN",
    reason = "Refund"
  } = options;

  try {
    const validAmount = Number(amount);
    if (isNaN(validAmount) || validAmount < 0) {
      return {
        success: false,
        error: `Invalid amount: ${amount}`
      };
    }

    // 🛡️ Read current saldo
    let saldoData = SafetyHelpers.safeReadJSON(filePath, {});
    const currentSaldo = Number(saldoData[userId]) || 0;
    const newSaldo = currentSaldo + validAmount;

    // 🛡️ Atomic write
    saldoData[userId] = newSaldo;
    const writeSuccess = SafetyHelpers.safeWriteJSON(filePath, saldoData);

    if (!writeSuccess) {
      return {
        success: false,
        newSaldo: currentSaldo,
        error: "Failed to write saldo file"
      };
    }

    console.log(`✅ Saldo refunded: ${userId} <- +${validAmount} [Reason: ${reason}] [Order: ${orderId}]`);

    return {
      success: true,
      newSaldo: newSaldo
    };
  } catch (err) {
    SafetyHelpers.logError(err, {
      context: "safeSaloRefund",
      userId,
      amount,
      orderId,
      reason
    });

    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Save transaction untuk history
 * @param {object} txData - Transaction data
 * @param {string} filePath - Path ke transaksi.json
 * @returns {boolean}
 */
function saveOrderTransaction(txData, filePath = "./database/transaksi.json") {
  try {
    const transactions = SafetyHelpers.safeReadJSON(filePath, []);

    // 🛡️ Validate transaction data
    if (!txData.userId || !txData.service || txData.price === undefined) {
      console.warn("⚠️ Invalid transaction data, skipping");
      return false;
    }

    // 🛡️ Add required fields
    const tx = {
      txid: txData.txid || `TXN-${Date.now()}`,
      userId: String(txData.userId),
      service: txData.service || "Unknown",
      country: txData.country || "Unknown",
      price: Number(txData.price) || 0,
      status: txData.status || "pending",
      orderId: txData.orderId,
      operator: txData.operator,
      created_at: txData.created_at || new Date().toISOString()
    };

    if (!Array.isArray(transactions)) {
      console.warn("⚠️ Transaction file corrupt, resetting to array");
      transactions = [];
    }

    transactions.push(tx);
    return SafetyHelpers.safeWriteJSON(filePath, transactions);
  } catch (err) {
    SafetyHelpers.logError(err, {
      context: "saveOrderTransaction",
      txData
    });

    return false;
  }
}

/**
 * Save order ke margin database (untuk profit tracking)
 * @param {object} orderData - Order data lengkap
 * @param {string} marginPath - Path ke margin database
 * @returns {boolean}
 */
function saveOrderMargin(orderData, marginPath = "./database/data_marginNOKOS.json") {
  try {
    const marginData = SafetyHelpers.safeReadJSON(marginPath, []);

    // 🛡️ Validate critical fields
    if (!orderData.userId || !orderData.orderId || orderData.hargaJual === undefined) {
      console.warn("⚠️ Invalid margin data, skipping");
      return false;
    }

    // 🛡️ Calculate & validate margin
    const hargaJual = Number(orderData.hargaJual) || 0;
    const hargaProvider = Number(orderData.hargaProvider) || 0;
    const margin = Math.max(0, hargaJual - hargaProvider);

    const marginRecord = {
      type: "buy_nokos",
      trx_id: orderData.orderId,
      user: {
        id: String(orderData.userId),
        name: orderData.userName || "Unknown",
        username: orderData.username || "Unknown"
      },
      service: orderData.service || "Unknown",
      country: orderData.country || "Unknown",
      operator: orderData.operator || "Unknown",
      phone_number: orderData.phoneNumber || "Unknown",
      otp: orderData.otp || "-",
      amount_user: hargaJual,
      amount_provider: hargaProvider,
      margin: margin,
      method: "SALDO",
      provider: "RumahOTP",
      status: orderData.status || "pending",
      created_at: orderData.created_at || new Date().toISOString(),
      success_at: orderData.success_at,
      source: "buy",
      meta: {
        note: orderData.note || "Order processed",
        bot: orderData.bot || "@RajaOTP"
      }
    };

    if (!Array.isArray(marginData)) {
      console.warn("⚠️ Margin file corrupt, resetting to array");
      marginData = [];
    }

    marginData.push(marginRecord);
    return SafetyHelpers.safeWriteJSON(marginPath, marginData);
  } catch (err) {
    SafetyHelpers.logError(err, {
      context: "saveOrderMargin",
      orderData
    });

    return false;
  }
}

/**
 * Check & prevent double order dalam timeframe tertentu
 * @param {string} userId - User ID
 * @param {number} timeWindowMs - Time window dalam ms (default: 5000)
 * @returns {boolean} True jika double order terdeteksi
 */
function isDoubleOrder(userId, timeWindowMs = 5000) {
  if (!global.orderTimestamps) {
    global.orderTimestamps = {};
  }

  const now = Date.now();
  const lastOrder = global.orderTimestamps[userId] || 0;

  if (now - lastOrder < timeWindowMs) {
    console.warn(`⚠️ Double order detected for user ${userId}`);
    return true;
  }

  global.orderTimestamps[userId] = now;
  return false;
}

/**
 * 🔒 SAFE REFUND DENGAN IDEMPOTENSI (REFUND HANYA 1X)
 * Mencegah double refund dengan refund_status explicit
 * Integration dengan OrderManager untuk persistence
 * 
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {number} amount - Jumlah refund
 * @param {string} reason - Alasan refund (failed|cancelled|expired)
 * @returns {Promise<{success: boolean, alreadyRefunded?: boolean, error?: string}>}
 */
async function safeRefundOrder(orderId, userId, amount, reason = "Unknown") {
  try {
    // 🔒 Check if order exists in OrderManager
    const order = OrderManager.getOrder(orderId);
    
    if (!order) {
      // Fallback: check activeOrders (backward compatibility)
      if (!global.activeOrders?.[orderId]) {
        console.warn(`[REFUND_SKIP] Order ${orderId} not found in any database`);
        return { success: false, error: "Order not found" };
      }
    }

    // 🔒 CHECK REFUND STATUS (IDEMPOTENSI)
    if (order && OrderManager.isOrderRefunded(orderId)) {
      console.warn(`[REFUND_IDEMPOTENSI] Order ${orderId} already refunded (OrderManager)`);
      return { success: true, alreadyRefunded: true };
    }

    // Fallback: check activeOrders
    const activeOrder = global.activeOrders?.[orderId];
    if (activeOrder?.refund_status === "refunded") {
      console.warn(`[REFUND_IDEMPOTENSI] Order ${orderId} already refunded (activeOrders)`);
      return { success: true, alreadyRefunded: true };
    }

    // 🔐 LOCK PER ORDER (cegah race condition)
    if (activeOrder?.refundLock) {
      console.warn(`[REFUND_LOCK] Order ${orderId} sedang diproses refund`);
      return { success: false, error: "Refund in progress" };
    }

    try {
      // Set lock
      if (activeOrder) {
        activeOrder.refundLock = true;
      }

      // 🛡️ EXECUTE REFUND
      const refundResult = await safeSaloRefund(userId, amount, {
        orderId,
        reason: `${reason} (Safe Refund Idempotensi)`
      });

      if (!refundResult.success) {
        console.error(`[REFUND_FAILED] Order ${orderId}:`, refundResult.error);
        return { success: false, error: refundResult.error };
      }

      // ✅ MARK REFUND COMPLETE (OrderManager)
      if (order) {
        OrderManager.markOrderAsRefunded(orderId, reason);
      }

      // ✅ MARK REFUND COMPLETE (activeOrders fallback)
      if (activeOrder) {
        activeOrder.refund_status = "refunded";
        activeOrder.refunded_at = Date.now();
        activeOrder.refund_reason = reason;
      }

      OrderManager.auditLog("refund_success", {
        orderId,
        userId,
        amount,
        reason
      });

      console.warn(
        `[REFUND_SUCCESS] order=${orderId} status=${order?.status || activeOrder?.status} refund_status=refunded amount=${amount} reason=${reason}`
      );

      return { success: true, alreadyRefunded: false };

    } finally {
      // Release lock
      if (activeOrder) {
        activeOrder.refundLock = false;
      }
    }

  } catch (err) {
    SafetyHelpers.logError(err, {
      context: "safeRefundOrder",
      orderId,
      userId,
      amount,
      reason
    });

    OrderManager.auditLog("refund_exception", {
      orderId,
      userId,
      error: err.message
    });

    return { success: false, error: err.message };
  }
}

/**
 * Store active order untuk tracking & UI (TIDAK sumber utama)
 * OrderManager adalah sumber utama
 * @param {object} orderInfo - Order information
 * @returns {string} Order ID
 */
function storeActiveOrder(orderInfo) {
  if (!global.activeOrders) {
    global.activeOrders = {};
  }

  const orderId = orderInfo.orderId || `ORDER-${Date.now()}`;

  // 🛡️ Validate required fields
  if (!orderInfo.userId || !orderInfo.messageId) {
    console.error("❌ Missing required fields for active order");
    return null;
  }

  global.activeOrders[orderId] = {
    userId: String(orderInfo.userId),
    messageId: Number(orderInfo.messageId),
    chatId: Number(orderInfo.chatId),
    hargaTotal: Number(orderInfo.hargaTotal) || 0,
    createdAt: orderInfo.createdAt || Date.now(),
    operator: orderInfo.operator || "Unknown",
    service: orderInfo.service || "Unknown",
    country: orderInfo.country || "Unknown",
    phoneNumber: orderInfo.phoneNumber || "Unknown",
    expiresAt: orderInfo.expiresAt || Date.now() + (15 * 60 * 1000), // Default 15 min
    // 🔒 STATUS REFUND EKSPLISIT
    status: "pending",
    refund_status: "none",  // "none" | "refunded"
    refundLock: false
  };

  console.log(`✅ Active order stored: ${orderId}`);
  return orderId;
}

/**
 * Get active order info
 * @param {string} orderId - Order ID
 * @returns {object|null}
 */
function getActiveOrder(orderId) {
  return global.activeOrders?.[orderId] || null;
}

/**
 * Remove active order
 * @param {string} orderId - Order ID
 * @returns {boolean}
 */
function removeActiveOrder(orderId) {
  if (global.activeOrders && global.activeOrders[orderId]) {
    delete global.activeOrders[orderId];
    console.log(`✅ Active order removed: ${orderId}`);
    return true;
  }

  return false;
}

// ========================
// EXPORTS
// ========================

// ========================
// EXPORTS
// ========================

module.exports = {
  safeSaloDeduction,
  safeSaloRefund,
  safeRefundOrder,
  saveOrderTransaction,
  saveOrderMargin,
  isDoubleOrder,
  storeActiveOrder,
  getActiveOrder,
  removeActiveOrder,
  // 🆕 OrderManager exports (persistence)
  OrderManager,
  // OrderManager methods aliases
  createAndSaveOrder: OrderManager.createAndSaveOrder,
  getOrder: OrderManager.getOrder,
  getUserOrders: OrderManager.getUserOrders,
  updateOrderStatus: OrderManager.updateOrderStatus,
  markOrderAsDeducted: OrderManager.markOrderAsDeducted,
  isOrderDeducted: OrderManager.isOrderDeducted,
  canRefund: OrderManager.canRefund,
  markOrderAsRefunded: OrderManager.markOrderAsRefunded,
  isOrderRefunded: OrderManager.isOrderRefunded,
  scanExpiredOrders: OrderManager.scanExpiredOrders,
  auditLog: OrderManager.auditLog
};
