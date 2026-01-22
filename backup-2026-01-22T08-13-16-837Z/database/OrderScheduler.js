/**
 * 🔄 SCHEDULER - ORDER MAINTENANCE & EXPIRY HANDLING
 * 
 * Menggantikan setTimeout panjang dengan sistem scheduler yang:
 * - Tahan restart (scan dari order database)
 * - Periodic check untuk order expired
 * - Auto-refund untuk order expired/cancelled/failed
 * - Non-blocking & reliable
 */

const OrderManager = require("./OrderManager");
const OrderOperations = require("./OrderOperations");
const RefundLocker = require("./RefundLocker");

class OrderScheduler {
  constructor(bot, options = {}) {
    this.bot = bot;
    this.owner = options.owner;
    this.channelLog = options.channelLog;
    
    // Scan interval (default 60 detik = tahan production)
    this.scanIntervalMs = options.scanIntervalMs || 60 * 1000;
    
    // Lock untuk mencegah concurrent scan
    this.scanning = false;
    this.scanTimer = null;
    
    console.log("[SCHEDULER] Initialized with interval:", this.scanIntervalMs + "ms");
  }

  /**
   * Start scheduler
   * Akan scan order expired & refund otomatis
   */
  start() {
    if (this.scanTimer) {
      console.warn("[SCHEDULER] Already running");
      return;
    }

    console.log("[SCHEDULER] Starting order maintenance scheduler...");
    
    // Run once immediately
    this._runMaintenance();

    // Then schedule periodic runs
    this.scanTimer = setInterval(() => {
      this._runMaintenance();
    }, this.scanIntervalMs);
  }

  /**
   * Stop scheduler
   */
  stop() {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
      console.log("[SCHEDULER] Stopped");
    }
  }

  /**
   * Run maintenance cycle
   * SAFE: Non-blocking, handles errors gracefully
   */
  async _runMaintenance() {
    // Prevent concurrent execution
    if (this.scanning) {
      console.warn("[SCHEDULER] Scan already in progress, skipping");
      return;
    }

    this.scanning = true;

    try {
      // Step 1: Scan expired orders
      const expiredCount = OrderManager.scanExpiredOrders();
      
      if (expiredCount > 0) {
        console.log(`[SCHEDULER] Found ${expiredCount} expired orders`);
      }

      // Step 2: Process expired, failed, cancelled orders
      await this._processRefundable();

      // Step 3: Log maintenance completion
      console.log("[SCHEDULER] Maintenance cycle completed");

    } catch (err) {
      console.error("[SCHEDULER_ERROR]", err.message);
      
      // Notify owner of critical errors
      if (this.owner && this.bot) {
        this._notifyOwnerError(err);
      }
    } finally {
      this.scanning = false;
    }
  }

  /**
   * Process refund untuk order yang perlu refund
   */
  async _processRefundable() {
    try {
      const orders = OrderManager.loadOrders();
      const refundable = Object.values(orders).filter(order => {
        return OrderManager.canRefund(order.id);
      });

      if (refundable.length === 0) return;

      console.log(`[SCHEDULER] Processing ${refundable.length} refundable orders...`);

      for (const order of refundable) {
        await this._refundOrder(order);
        
        // Delay between refunds untuk menghindari rate limiting
        await new Promise(r => setTimeout(r, 100));
      }

    } catch (err) {
      console.error("[SCHEDULER_REFUND_ERROR]", err.message);
    }
  }

  /**
   * Refund single order
   */
  async _refundOrder(order) {
    try {
      const { id, userId, amount, status } = order;
      
      console.log(`[SCHEDULER_REFUND] Processing order ${id} (status: ${status})`);

      // 🔒 CHECK DEDUCTED BEFORE REFUND (never-deducted guard)
      const orderData = OrderManager.getOrder(id);
      if (!orderData || !orderData.deducted) {
        console.warn(`[SCHEDULER_REFUND_SKIP] Order ${id} never deducted, skip refund`);
        return; // Never deducted = nothing to refund
      }

      // 🔒 USE REFUND LOCKER (idempotent, single source of truth, prevents double refund)
      const refundResult = await RefundLocker.refundOrder(
        id,
        userId,
        amount,
        `Auto-refund (${status})`
      );

      if (refundResult.skipped && refundResult.alreadyRefunded) {
        console.log(`[SCHEDULER_REFUND_DUP] Order ${id} already refunded (skip)`);
        return;
      }

      if (!refundResult.success && !refundResult.skipped) {
        console.error(`[SCHEDULER_REFUND_FAILED] Order ${id}: ${refundResult.error}`);

        // Audit critical error
        OrderManager.auditLog("auto_refund_failed", {
          orderId: id,
          userId,
          amount,
          error: refundResult.error
        });

        // Notify owner about failure
        this._notifyOwnerFailedRefund(id, userId, amount, refundResult.error);

        return; // Will retry on next scheduler cycle
      }

      // Refund succeeded
      console.log(`[SCHEDULER_REFUND_SUCCESS] Order ${id}: +Rp${amount.toLocaleString("id-ID")}`);

      // Notify user of refund
      this._notifyUserRefund(userId, id, amount, status);

      // Audit
      OrderManager.auditLog("auto_refund_success", {
        orderId: id,
        userId,
        amount,
        reason: status
      });

        // Notify owner of failed refund
        this._notifyOwnerFailedRefund(id, userId, amount, refundResult.error);
      }

    } catch (err) {
      console.error(`[SCHEDULER_REFUND_EXCEPTION] ${err.message}`);
      OrderManager.auditLog("auto_refund_exception", {
        orderId: order.id,
        error: err.message
      });
    }
  }

  /**
   * Notify user tentang auto-refund
   */
  async _notifyUserRefund(userId, orderId, amount, reason) {
    try {
      if (!this.bot) return;

      const text = `✅ <b>Refund Otomatis Diproses</b>

Order ID: <code>${orderId}</code>
Status: <b>${reason}</b>

💰 <b>Refund:</b> +Rp${amount.toLocaleString("id-ID")}

Saldo Anda sudah dipulihkan. Terima kasih telah menggunakan RajaOTP!`;

      await this.bot.sendMessage(userId, text, { parse_mode: "HTML" }).catch(() => {});
    } catch (err) {
      console.error("[NOTIFY_USER_REFUND_ERROR]", err.message);
    }
  }

  /**
   * Notify owner tentang error refund
   */
  async _notifyOwnerFailedRefund(orderId, userId, amount, error) {
    try {
      if (!this.bot || !this.owner) return;

      const text = `🚨 <b>REFUND GAGAL - ACTION DIPERLUKAN</b>

Order ID: <code>${orderId}</code>
User ID: <code>${userId}</code>
Amount: Rp${amount.toLocaleString("id-ID")}

❌ Error: <code>${error}</code>

Tolong review & refund manual jika diperlukan.`;

      await this.bot.sendMessage(this.owner, text, { parse_mode: "HTML" }).catch(() => {});
    } catch (err) {
      console.error("[NOTIFY_OWNER_FAILED_REFUND_ERROR]", err.message);
    }
  }

  /**
   * Notify owner tentang critical error
   */
  async _notifyOwnerError(err) {
    try {
      if (!this.bot || !this.owner) return;

      const text = `🚨 <b>SCHEDULER ERROR - CRITICAL</b>

Error: <code>${err.message}</code>
Stack: <code>${err.stack?.slice(0, 200) || "No stack"}</code>

Silakan check logs untuk detail lebih lanjut.`;

      await this.bot.sendMessage(this.owner, text, { parse_mode: "HTML" }).catch(() => {});
    } catch (err) {
      console.error("[NOTIFY_OWNER_ERROR]", err.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: !!this.scanTimer,
      scanning: this.scanning,
      intervalMs: this.scanIntervalMs
    };
  }

  /**
   * Force run maintenance now
   */
  async runNow() {
    console.log("[SCHEDULER] Force run initiated by admin");
    await this._runMaintenance();
  }
}

module.exports = OrderScheduler;
