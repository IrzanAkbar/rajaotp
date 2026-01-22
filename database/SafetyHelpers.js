/**
 * 🛡️ SAFETY HELPERS - RajaOTP Hardening
 * 
 * Utility functions untuk:
 * - Order state safety & validation
 * - Callback safety & consistency
 * - Saldo operations (guard & idempotent)
 * - JSON file safety
 * - Error handling & logging
 * - Rate limiting
 */

const fs = require("fs");
const path = require("path");

// ========================
// 1️⃣ ORDER STATE SAFETY
// ========================

const VALID_ORDER_STATES = ["CREATED", "SUCCESS", "FAILED", "CANCELED", "EXPIRED"];

/**
 * Validasi status order
 * @param {string} status - Status yang akan divalidasi
 * @returns {boolean} True jika status valid
 */
function isValidOrderStatus(status) {
  return VALID_ORDER_STATES.includes(status?.toUpperCase());
}

/**
 * Pastikan order memiliki status yang valid
 * @param {object} order - Data order
 * @param {string} defaultStatus - Status default jika undefined (default: "CREATED")
 * @returns {object} Order dengan status yang valid
 */
function ensureOrderStatus(order, defaultStatus = "CREATED") {
  if (!order) return null;
  
  if (!order.status || !isValidOrderStatus(order.status)) {
    console.warn(`⚠️ Order ${order.id || order.orderId} memiliki status invalid: ${order.status}, menggunakan default: ${defaultStatus}`);
    order.status = defaultStatus;
  }
  return order;
}

/**
 * Cek apakah order sudah final (tidak boleh dirubah)
 * @param {string} status - Status order
 * @returns {boolean} True jika order final
 */
function isOrderFinal(status) {
  const finalStates = ["SUCCESS", "FAILED", "CANCELED", "EXPIRED"];
  return finalStates.includes(status?.toUpperCase());
}

// ========================
// 2️⃣ CALLBACK SAFETY
// ========================

/**
 * Wrapper aman untuk callback_query handler
 * Memastikan semua callback dijawab
 * @param {object} query - Callback query object
 * @param {string} message - Pesan untuk user
 * @param {boolean} alert - Tampilkan sebagai alert
 * @param {object} bot - Bot instance
 * @returns {Promise}
 */
async function safeAnswerCallbackQuery(bot, query, message = "", alert = false) {
  try {
    if (!query || !query.id) {
      console.error("❌ Invalid callback query object");
      return;
    }

    await bot.answerCallbackQuery(query.id, {
      text: message || "✅ Diproses",
      show_alert: alert
    });
  } catch (err) {
    console.error(`❌ Gagal answer callback [${query?.id}]:`, err.message);
  }
}

/**
 * Cek apakah callback query valid
 * @param {object} query - Callback query object
 * @returns {boolean}
 */
function isValidCallbackQuery(query) {
  return (
    query &&
    query.id &&
    query.from &&
    query.from.id &&
    query.message &&
    (query.message.chat?.id || query.message?.message_id)
  );
}

// ========================
// 3️⃣ SALDO SAFETY
// ========================

// User locks untuk mencegah concurrent saldo changes
const userSaldoLocks = new Map();

/**
 * Acquire lock untuk user saldo operation
 * @param {string} userId - User ID
 * @param {number} timeout - Timeout dalam ms (default: 10000)
 * @returns {Promise<Function>} Release function
 */
async function acquireSaldoLock(userId, timeout = 10000) {
  const lockKey = `saldo_${userId}`;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkLock = setInterval(() => {
      if (!userSaldoLocks.has(lockKey)) {
        userSaldoLocks.set(lockKey, true);
        clearInterval(checkLock);
        
        // Auto-release setelah timeout
        const timer = setTimeout(() => {
          userSaldoLocks.delete(lockKey);
        }, timeout);

        // Return release function
        resolve(() => {
          clearTimeout(timer);
          userSaldoLocks.delete(lockKey);
        });
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkLock);
        reject(new Error(`Saldo lock timeout untuk user ${userId}`));
      }
    }, 10);
  });
}

/**
 * Operasi saldo dengan guard (idempotent)
 * @param {string} userId - User ID
 * @param {number} amount - Jumlah perubahan saldo
 * @param {object} options - { filePath, operation: 'add'|'subtract', orderId, metadata }
 * @returns {Promise<{success: boolean, newSaldo: number, error?: string}>}
 */
async function safeModifySaldo(userId, amount, options = {}) {
  const {
    filePath = "./database/saldoOtp.json",
    operation = "subtract", // 'add' atau 'subtract'
    orderId = null,
    metadata = {}
  } = options;

  let releaseLock;
  try {
    // Acquire lock
    releaseLock = await acquireSaldoLock(userId, 5000);

    // Baca file JSON dengan try/catch
    let saldoData = {};
    try {
      if (fs.existsSync(filePath)) {
        saldoData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (err) {
      console.error(`⚠️ Error baca saldo file: ${err.message}, inisialisasi baru`);
      saldoData = {};
    }

    const currentSaldo = Number(saldoData[userId]) || 0;
    let newSaldo = currentSaldo;

    // Validasi operation
    if (operation === "subtract") {
      if (currentSaldo < amount) {
        return {
          success: false,
          newSaldo: currentSaldo,
          error: `Saldo tidak cukup (${currentSaldo} < ${amount})`
        };
      }
      newSaldo = currentSaldo - amount;
    } else if (operation === "add") {
      newSaldo = currentSaldo + amount;
    } else {
      return {
        success: false,
        newSaldo: currentSaldo,
        error: `Operation tidak valid: ${operation}`
      };
    }

    // Tulis file atomically (rename tmp)
    const tmpPath = `${filePath}.tmp`;
    const dataToWrite = JSON.stringify(saldoData, null, 2);
    
    try {
      fs.writeFileSync(tmpPath, dataToWrite, "utf-8");
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      console.error(`❌ Error menulis saldo file: ${err.message}`);
      return {
        success: false,
        newSaldo: currentSaldo,
        error: `Gagal menyimpan ke file: ${err.message}`
      };
    }

    console.log(`✅ Saldo user ${userId} berubah: ${currentSaldo} → ${newSaldo} (${operation}) [Order: ${orderId}]`);

    return {
      success: true,
      newSaldo,
      previousSaldo: currentSaldo
    };
  } catch (err) {
    console.error(`❌ Error safeModifySaldo: ${err.message}`);
    return {
      success: false,
      newSaldo: null,
      error: err.message
    };
  } finally {
    // Always release lock
    if (releaseLock) {
      try {
        releaseLock();
      } catch (e) {
        console.error(`⚠️ Error releasing lock: ${e.message}`);
      }
    }
  }
}

// ========================
// 4️⃣ JSON FILE SAFETY
// ========================

/**
 * Baca JSON file dengan auto-recovery jika corrupt
 * @param {string} filePath - Path ke file
 * @param {*} defaultValue - Nilai default jika file tidak ada/corrupt
 * @returns {*}
 */
function safeReadJSON(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File tidak ada: ${filePath}, menggunakan default value`);
      return defaultValue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Error baca JSON [${filePath}]: ${err.message}, recovery dengan default`);
    
    // Coba backup file corrupt
    try {
      const backupPath = `${filePath}.corrupt.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`💾 Backup file corrupt ke: ${backupPath}`);
    } catch (e) {
      console.error(`⚠️ Gagal backup corrupt file: ${e.message}`);
    }

    return defaultValue;
  }
}

/**
 * Tulis JSON file secara atomic
 * @param {string} filePath - Path ke file
 * @param {*} data - Data yang akan ditulis
 * @returns {boolean} True jika sukses
 */
function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);

    fs.writeFileSync(tmpPath, jsonString, "utf-8");
    fs.renameSync(tmpPath, filePath);

    return true;
  } catch (err) {
    console.error(`❌ Error tulis JSON [${filePath}]: ${err.message}`);
    return false;
  }
}

// ========================
// 5️⃣ API TIMEOUT & ERROR HANDLING
// ========================

/**
 * Wrapper untuk API call dengan timeout
 * @param {Promise} apiPromise - Promise dari API call
 * @param {number} timeoutMs - Timeout dalam milliseconds (default: 25000)
 * @param {string} apiName - Nama API (untuk logging)
 * @returns {Promise}
 */
async function apiCallWithTimeout(apiPromise, timeoutMs = 25000, apiName = "API") {
  return Promise.race([
    apiPromise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${apiName} timeout (${timeoutMs}ms)`)),
        timeoutMs
      )
    )
  ]);
}

/**
 * Wrapper untuk API dengan retry dan exponential backoff
 * @param {Function} apiFunc - Fungsi yang menjalankan API call
 * @param {object} options - { maxRetries: 3, timeout: 25000, backoffMultiplier: 1.5 }
 * @returns {Promise}
 */
async function apiCallWithRetry(apiFunc, options = {}) {
  const {
    maxRetries = 3,
    timeout = 25000,
    backoffMultiplier = 1.5,
    apiName = "API"
  } = options;

  let lastError;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCallWithTimeout(
        apiFunc(),
        timeout,
        `${apiName} (attempt ${attempt}/${maxRetries})`
      );
      return { success: true, data: result, attempt };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ ${apiName} attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    attempt: maxRetries
  };
}

// ========================
// 6️⃣ RATE LIMITING
// ========================

const rateLimitStore = new Map();

/**
 * Check rate limit untuk user
 * @param {string} userId - User ID
 * @param {string} action - Action name (e.g., 'order', 'callback')
 * @param {object} options - { maxAttempts: 5, windowMs: 60000 }
 * @returns {boolean} True jika masih dalam limit
 */
function checkRateLimit(userId, action, options = {}) {
  const {
    maxAttempts = 5,
    windowMs = 60000 // 1 minute
  } = options;

  const key = `ratelimit_${userId}_${action}`;
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { count: 1, firstAttempt: now };
    rateLimitStore.set(key, record);
    return true;
  }

  // Reset window jika sudah expired
  if (now - record.firstAttempt > windowMs) {
    record.count = 1;
    record.firstAttempt = now;
    return true;
  }

  // Check jika melebihi limit
  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Reset rate limit untuk user
 * @param {string} userId - User ID
 * @param {string} action - Action name
 */
function resetRateLimit(userId, action) {
  const key = `ratelimit_${userId}_${action}`;
  rateLimitStore.delete(key);
}

// ========================
// 7️⃣ ERROR LOGGING
// ========================

/**
 * Log error dengan context lengkap
 * @param {Error} error - Error object
 * @param {object} context - Context tambahan
 */
function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error?.message || String(error),
    stack: error?.stack,
    ...context
  };

  console.error(`❌ ERROR [${errorLog.timestamp}]:`, errorLog);

  // Simpan ke file jika perlu (opsional)
  try {
    const logFile = path.join(__dirname, "../logs/error.log");
    const logDir = path.dirname(logFile);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = JSON.stringify(errorLog) + "\n";
    fs.appendFileSync(logFile, logEntry, "utf-8");
  } catch (e) {
    console.error(`⚠️ Gagal write error log: ${e.message}`);
  }
}

/**
 * Safe try-catch wrapper
 * @param {Function} fn - Fungsi yang akan dijalankan
 * @param {object} options - { context, fallback, logError: true }
 * @returns {Promise}
 */
async function safeTry(fn, options = {}) {
  const {
    context = {},
    fallback = null,
    logError: shouldLog = true
  } = options;

  try {
    return await fn();
  } catch (err) {
    if (shouldLog) {
      logError(err, context);
    }
    return fallback;
  }
}

// ========================
// 8️⃣ MESSAGE EDIT SAFETY
// ========================

/**
 * Edit message dengan auto-deteksi caption vs text
 * @param {object} bot - Bot instance
 * @param {object} options - { chatId, messageId, caption, text, parseMode, replyMarkup }
 * @returns {Promise}
 */
async function safeEditMessage(bot, options = {}) {
  const {
    chatId,
    messageId,
    caption,
    text,
    parseMode = "HTML",
    replyMarkup = null
  } = options;

  try {
    if (!chatId || !messageId) {
      console.error("❌ Invalid chatId or messageId");
      return null;
    }

    // Jika ada caption, gunakan editMessageCaption
    if (caption) {
      return await bot.editMessageCaption(caption, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: parseMode,
        reply_markup: replyMarkup
      });
    }

    // Jika ada text, gunakan editMessageText
    if (text) {
      return await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: parseMode,
        reply_markup: replyMarkup
      });
    }

    console.warn("⚠️ Tidak ada caption atau text untuk edit message");
    return null;
  } catch (err) {
    console.error(`❌ Error edit message: ${err.message}`);
    return null;
  }
}

// ========================
// 9️⃣ KEYBOARD CONSISTENCY
// ========================

/**
 * Validasi inline keyboard structure
 * @param {Array} inlineKeyboard - Array of keyboard buttons
 * @returns {boolean}
 */
function isValidInlineKeyboard(inlineKeyboard) {
  if (!Array.isArray(inlineKeyboard)) return false;

  return inlineKeyboard.every(row => {
    if (!Array.isArray(row)) return false;
    return row.every(btn => {
      return btn.text && (btn.callback_data || btn.url || btn.switch_inline_query);
    });
  });
}

/**
 * Build safe inline keyboard
 * @param {Array} buttons - Array of { text, callback_data }
 * @returns {Array}
 */
function buildInlineKeyboard(buttons = []) {
  if (!Array.isArray(buttons)) return [];

  return buttons
    .filter(btn => btn && btn.text && btn.callback_data)
    .map(btn => [{ text: btn.text, callback_data: btn.callback_data }]);
}

// ========================
// 🔟 EXPORTS
// ========================

module.exports = {
  // Order state
  VALID_ORDER_STATES,
  isValidOrderStatus,
  ensureOrderStatus,
  isOrderFinal,

  // Callback
  safeAnswerCallbackQuery,
  isValidCallbackQuery,

  // Saldo
  acquireSaldoLock,
  safeModifySaldo,

  // JSON
  safeReadJSON,
  safeWriteJSON,

  // API
  apiCallWithTimeout,
  apiCallWithRetry,

  // Rate limit
  checkRateLimit,
  resetRateLimit,

  // Logging
  logError,
  safeTry,

  // Message edit
  safeEditMessage,

  // Keyboard
  isValidInlineKeyboard,
  buildInlineKeyboard
};
