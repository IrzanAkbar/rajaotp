/**
 * 🔒 REFUND OPERATIONS IDEMPOTENCY LOCKER
 * 
 * SOURCE OF TRUTH: PERSISTENT JSON STORAGE (BUKAN OrderManager)
 * Memastikan refund HANYA terjadi SEKALI per order
 * 
 * Usage:
 * const result = await RefundLocker.refundOrder(orderId, userId, amount, reason);
 */

const OrderOperations = require("./OrderOperations");
const fs = require("fs");
const path = require("path");

// 🔐 HELPER: Load order dari persistent storage
function loadOrderFromStorage(orderId) {
  try {
    const nokosPath = path.join(__dirname, "./nokosData.json");
    if (!fs.existsSync(nokosPath)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(nokosPath, "utf-8"));
    if (!Array.isArray(data)) return null;

    return data.find(o => o.order_id === orderId);
  } catch (err) {
    console.error(`[REFUND_LOCKER] Error loading order from storage:`, err.message);
    return null;
  }
}

// 🔐 HELPER: Save order ke persistent storage
function saveOrderToStorage(orderId, updatedOrder) {
  try {
    const nokosPath = path.join(__dirname, "./nokosData.json");
    if (!fs.existsSync(nokosPath)) {
      fs.writeFileSync(nokosPath, JSON.stringify([], null, 2));
    }

    let data = JSON.parse(fs.readFileSync(nokosPath, "utf-8"));
    if (!Array.isArray(data)) data = [];

    const idx = data.findIndex(o => o.order_id === orderId);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...updatedOrder };
    } else {
      data.push(updatedOrder);
    }

    fs.writeFileSync(nokosPath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`[REFUND_LOCKER] Error saving order to storage:`, err.message);
    return false;
  }
}

class RefundLocker {
  constructor() {
    // Per-order refund locks (in-memory, untuk prevent concurrent)
    this.refundLocks = new Map();
    this.refundTimeout = 10000; // 10s timeout per refund
  }

  /**
   * CENTRAL REFUND GATEWAY (HANYA GUNAKAN INI)
   * Idempotent refund dengan triple check DARI STORAGE
   * 
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID
   * @param {number} amount - Amount to refund
   * @param {string} reason - Reason (expired|cancelled|failed|manual)
   * @returns {Promise<{success, skipped, alreadyRefunded, error}>}
   */
  async refundOrder(orderId, userId, amount, reason) {
    try {
      // ===== CHECK 1: LOAD ORDER DARI STORAGE (SOURCE OF TRUTH) =====
      const order = loadOrderFromStorage(orderId);
      if (!order) {
        console.warn(`[REFUND] Order ${orderId} tidak ditemukan di storage`);
        return { success: false, skipped: true, error: "order_not_found_storage" };
      }

      console.log(`[REFUND] Order loaded from storage: ${orderId}`);

      // ===== CHECK 2: SUDAH DI-REFUND? =====
      if (order.refundStatus === "REFUNDED" || order.refund_status === "refunded") {
        console.warn(`[REFUND] Order ${orderId} sudah di-refund sebelumnya`);
        return { success: true, skipped: true, alreadyRefunded: true };
      }

      // ===== CHECK 3: ADA BUKTI DEBIT? =====
      // ⚠️ ATURAN EMAS: Refund HANYA berdasarkan debit, BUKAN status
      // Refund HANYA boleh jika saldo sudah terpotong:
      // 1. order.deducted === true, ATAU
      // 2. order.debit_txn_id ada
      const wasDebited = order.deducted === true || Boolean(order.debit_txn_id);
      if (!wasDebited) {
        console.warn(`[REFUND] Order ${orderId} tidak ada bukti debit (deducted=${order.deducted})`);
        return { success: false, skipped: true, error: "no_debit_detected" };
      }

      console.log(`[REFUND] Order ${orderId}: deducted=true, refundStatus=NONE → dapat di-refund (status=${order.status})`);

      // ===== CHECK 4: IN-MEMORY LOCK (prevent concurrent) =====
      if (this.refundLocks.has(orderId)) {
        console.warn(`[REFUND] Order ${orderId} refund sedang diproses`);
        return { success: false, skipped: true, error: "refund_in_progress" };
      }

      // Set lock
      this.refundLocks.set(orderId, true);
      const lockTimer = setTimeout(() => {
        this.refundLocks.delete(orderId);
        console.warn(`[REFUND] Lock released (timeout) untuk order ${orderId}`);
      }, this.refundTimeout);

      try {
        // ===== EXECUTE REFUND =====
        const refundResult = await OrderOperations.safeRefundOrder(
          orderId,
          userId,
          amount,
          reason
        );

        if (refundResult.success || refundResult.alreadyRefunded) {
          // Mark as refunded in storage
          const updated = saveOrderToStorage(orderId, {
            refundStatus: "REFUNDED",
            refund_status: "refunded",
            status: "cancelled",
            refund_timestamp: new Date().toISOString(),
            refund_reason: reason
          });

          if (!updated) {
            console.error(`[REFUND] Gagal update status di storage`);
            return { success: false, skipped: false, error: "storage_update_failed" };
          }

          console.log(`[REFUND] ✅ Refund SUCCESS: ${orderId} → ${userId} +Rp${amount}`);

          return {
            success: true,
            skipped: false,
            alreadyRefunded: refundResult.alreadyRefunded
          };
        } else {
          console.error(`[REFUND] ❌ Refund FAILED: ${refundResult.error}`);
          return {
            success: false,
            skipped: false,
            error: refundResult.error
          };
        }
      } finally {
        // Always release lock
        clearTimeout(lockTimer);
        this.refundLocks.delete(orderId);
      }

    } catch (err) {
      console.error(`[REFUND] Exception: ${err.message}`);
      return {
        success: false,
        skipped: false,
        error: err.message
      };
    }
  }

  /**
   * Check if order bisa di-refund (tanpa execute)
   */
  canRefund(orderId) {
    const order = loadOrderFromStorage(orderId);
    if (!order) return false;

    // Must not already refunded
    if (order.refundStatus === "REFUNDED" || order.refund_status === "refunded") return false;

    // Must have debit proof (ONLY requirement)
    const wasDebited = order.deducted === true || Boolean(order.debit_txn_id);
    if (!wasDebited) return false;

    // Must not be locked
    if (this.refundLocks.has(orderId)) return false;

    return true;
  }

  /**
   * Get refund status (untuk debugging/UI)
   */
  getRefundStatus(orderId) {
    const order = loadOrderFromStorage(orderId);
    if (!order) return null;

    return {
      orderId,
      refundStatus: order.refundStatus || order.refund_status,
      status: order.status,
      isLocked: this.refundLocks.has(orderId),
      canRefund: this.canRefund(orderId)
    };
  }
}

// Singleton instance
const refundLocker = new RefundLocker();

module.exports = refundLocker;
