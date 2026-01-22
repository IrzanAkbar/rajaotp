let isMonitoring = false;

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ANTI CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
  isMonitoring = false;
});

process.on("uncaughtException", (err) => console.log("[ANTI CRASH] Uncaught Exception:", err));
process.on("uncaughtExceptionMonitor", (err) => console.log("[ANTI CRASH MONITOR]:", err));

const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const moment = require('moment-timezone');
const { Client } = require('ssh2');
const { exec } = require('child_process');
const FormData = require('form-data');
const fetch = require('node-fetch');
const axios = require('axios');
const figlet = require("figlet");
const crypto = require("crypto");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const chalk = require("chalk");
const P = require("pino");
const path = require("path");
const archiver = require("archiver");
const { execSync } = require('child_process'); 
const { InlineKeyboardButton } = require('telegraf');

// 🛡️ IMPORT SAFETY HELPERS
const SafetyHelpers = require("./database/SafetyHelpers.js");
const OrderOperations = require("./database/OrderOperations.js");
const RefundLocker = require("./database/RefundLocker.js");

let subdomainSelectionContext = {}; // { userId: { host, ip, created, msgId } }
const { cloudflareDomains } = require("./config.js");
const qs = require('qs');
const QRCode = require('qrcode');
const bot = new TelegramBot(config.TOKEN, { polling: true });
const owner = config.OWNER_ID.toString();
const urladmin = config.urladmin;
const urlchannel = config.urlchannel;
const channellog = config.idchannel;
console.log("✅ RajaOTP • Secure OTP Automation — Bot berjalan!");

// ====================================================
// 🧱 FILE DATABASE
// ====================================================
// ================== IMPORT MODULE ==================
const BackupManager = require("./database/backupManager.js");

const backupFile = "./database/lastBackup.json";
const backupManager = new BackupManager(bot, owner, backupFile);

backupManager.startAutoBackup();

//##################################//

const DailyMaintenanceManager = require("./database/dailyMaintenance");
const dailyMaintenance = new DailyMaintenanceManager(bot, "./database/maintenanceDB.json", owner, channellog);
dailyMaintenance.start();

//##################################//

const marginNokosPath = "./database/data_marginNOKOS.json";

// init file margin kalau belum ada
if (!fs.existsSync(marginNokosPath)) {
  fs.writeFileSync(marginNokosPath, JSON.stringify([], null, 2));
}
//##################################//

const blacklistFile = path.join(__dirname, "./database/blacklist.json");
if (!fs.existsSync(blacklistFile)) fs.writeFileSync(blacklistFile, JSON.stringify([], null, 2));

const maintenanceFile = path.join(__dirname, "./database/maintenance.json");
if (!fs.existsSync(maintenanceFile)) fs.writeFileSync(maintenanceFile, JSON.stringify({ status: false }));

const groupOnlyFile = path.join(__dirname, "./database/grouponly.json");
if (!fs.existsSync(groupOnlyFile)) fs.writeFileSync(groupOnlyFile, JSON.stringify({ status: false }));

const modeFile = path.join(__dirname, "./database/mode.json");
if (!fs.existsSync(modeFile)) fs.writeFileSync(modeFile, JSON.stringify({ self: false }));

const joinChFile = path.join(__dirname, "./database/joinchannel.json");
if (!fs.existsSync(joinChFile)) {
  fs.writeFileSync(joinChFile, JSON.stringify({ status: false }, null, 2));
}

const saldoPath = path.join(__dirname, "./database/saldoOtp.json");
const trxPath = path.join(__dirname, "./database/transaksi.json");
const maintenanceImage = path.join(__dirname, "assets/images/ProsesMaintenance.jpg");

const { 
  getRuntime,
  getTotalUsers,
  getUserSaldo,
  setUserSaldo,
  toIDR,
  toRupiah,
  toIDRSimple,
  formatRupiah,
  generateRandomNumber,
  randomHex,
  generateRandomPassword,
  getWaktuIndonesia,
  dateTime
} = require("./database/Function");

// ====================================================
// 🔧 UTIL
// ====================================================

function logError(err, where = "Unknown") {
  const time = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const text = `[${time}] [${where}]\n${err.stack || err}\n\n`;
  console.error(text);
  fs.appendFileSync("error.log", text);
}

function nowWIB() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Jakarta"
  }).replace("T", " ");
}

function escapeMarkdown(text = "") {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/`/g, "\\`")
    .replace(//g, "\\[")
    .replace(/]/g, "\")
    .replace(//g, "\\(")
    .replace(//g, "\\)");
}

function loadJsonSafe(path, defaultVal = []) {
  const fs = require("fs");
  try {
    if (!fs.existsSync(path)) return defaultVal;
    return JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch {
    return defaultVal;
  }
}

/**
 * Escape HTML special characters for safe HTML parsing in Telegram
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSameDay(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isSameMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

const getUserState = (userId) => {
  if (!global.userState) global.userState = {};
  if (!global.userState[userId]) {
    global.userState[userId] = {
      lastServicePhoto: null,
      lastCountryPhoto: null,
      lastBuyData: null
    };
  }
  return global.userState[userId];
};

// ====================================================
// 🛡️ SAFE CAPTION EDIT HELPER (GUARD MISSING MESSAGEID)
// ====================================================
async function safeEditCaption(bot, chatId, messageId, caption, markup = null) {
  if (!messageId || !chatId) {
    console.warn("[SAFE_CAPTION_EDIT] Missing messageId or chatId, skipping edit");
    return null;
  }
  
  try {
    return await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: markup
    });
  } catch (err) {
    console.error("[SAFE_CAPTION_EDIT] Error:", err.message);
    return null;
  }
}

// ====================================================
// �️ SAFE MESSAGE EDIT HELPER (ANTI CRASH)
// ====================================================

/**
 * Safely edit a message by checking if it has text or caption
 * Falls back to sendMessage if message cannot be edited
 * @param {TelegramBot} bot - Bot instance
 * @param {Object} msg - The message object from callback_query
 * @param {Object} options - Edit options { text, parse_mode, reply_markup }
 * @returns {Promise} Edit or send result
 */
async function safeEditMessage(bot, msg, options) {
  // VALIDATE: Pastikan message dan messageId tersedia
  if (!msg || !msg.message_id) {
    console.warn("[SAFE_EDIT] Message atau message_id tidak tersedia, skip edit");
    return null;
  }

  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // GUARD: Pastikan chatId ada
  if (!chatId) {
    console.warn("[SAFE_EDIT] Chat ID tidak tersedia, skip edit");
    return null;
  }

  try {
    // Check if message has TEXT (regular message)
    if (msg.text) {
      return await bot.editMessageText(options.text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: options.parse_mode,
        reply_markup: options.reply_markup
      });
    }

    // Check if message has CAPTION (photo/video/document with caption)
    if (msg.caption) {
      return await bot.editMessageCaption(options.text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: options.parse_mode,
        reply_markup: options.reply_markup
      });
    }

    // FALLBACK: Message has no text or caption (can't edit)
    // Send new message instead to avoid "no text to edit" error
    return await bot.sendMessage(chatId, options.text, {
      parse_mode: options.parse_mode,
      reply_markup: options.reply_markup
    });

  } catch (err) {
    console.error("[SAFE_EDIT_MESSAGE ERROR]", err.message);

    // FINAL FALLBACK: If edit fails for any reason, send new message
    try {
      return await bot.sendMessage(chatId, options.text, {
        parse_mode: options.parse_mode,
        reply_markup: options.reply_markup
      });
    } catch (sendErr) {
      console.error("[SAFE_EDIT_MESSAGE FINAL FALLBACK ERROR]", sendErr.message);
      return null;
    }
  }
}

// ✅ SAFE EDIT MEDIA AND TEXT HELPERS
async function safeEditMedia(bot, chatId, messageId, media, options = {}) {
  if (!messageId || !chatId) return null;
  try { return await bot.editMessageMedia(media, { chat_id: chatId, message_id: messageId, ...options }); }
  catch (err) { 
    console.warn("[SAFE_MEDIA_EDIT] Edit failed, fallback:", err.message);
    try {
      if (media.type === "photo") return await bot.sendPhoto(chatId, media.media, options);
      else if (media.type === "video") return await bot.sendVideo(chatId, media.media, options);
    } catch (e) { return null; }
  }
}

async function safeEditText(bot, chatId, messageId, text, markup = null) {
  if (!messageId || !chatId) return null;
  try { return await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "HTML", reply_markup: markup }); }
  catch (err) { 
    console.warn("[SAFE_TEXT_EDIT] Edit failed, fallback:", err.message);
    try { return await bot.sendMessage(chatId, text, { parse_mode: "HTML", reply_markup: markup }); }
    catch (e) { return null; }
  }
}

// ====================================================
// �📜 HISTORY TRANSAKSI HELPER FUNCTIONS
// ====================================================

/**
 * Generate unique TXID dengan format: ROTP-YYYYMMDD-XXXX
 */
function generateTXID() {
  const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" });
  const datePart = now.split(" ")[0].replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ROTP-${datePart}-${randomPart}`;
}

/**
 * Simpan transaksi ke transaksi.json dengan guard duplikat
 * @param {Object} transactionData - Data transaksi
 * @returns {string} TXID yang disimpan
 */
function saveTransaction(transactionData) {
  try {
    const trxPath = "./database/transaksi.json";
    let transactions = [];

    // Load existing transactions
    if (fs.existsSync(trxPath)) {
      try {
        transactions = JSON.parse(fs.readFileSync(trxPath, "utf-8"));
      } catch {
        transactions = [];
      }
    }

    // Guard: Check if TXID already exists (prevent duplicate)
    if (transactionData.txid) {
      const isDuplicate = transactions.some(t => t.txid === transactionData.txid);
      if (isDuplicate) {
        console.log(`⚠️ TXID ${transactionData.txid} sudah ada, skip duplikat`);
        return transactionData.txid;
      }
    } else {
      // Generate TXID jika belum ada
      let txid = generateTXID();
      // Ensure unique
      while (transactions.some(t => t.txid === txid)) {
        txid = generateTXID();
      }
      transactionData.txid = txid;
    }

    // Ensure required fields
    transactionData.created_at = transactionData.created_at || new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ");
    transactionData.status = (transactionData.status || "unknown").toLowerCase();

    transactions.push(transactionData);
    fs.writeFileSync(trxPath, JSON.stringify(transactions, null, 2));

    console.log(`✅ Transaksi disimpan: ${transactionData.txid}`);
    return transactionData.txid;
  } catch (err) {
    console.error(`❌ Gagal simpan transaksi:`, err.message);
    return null;
  }
}

/**
 * Ambil history transaksi user (max 5 terakhir)
 * @param {string} userId - ID user
 * @returns {Array} Array transaksi user (max 5)
 */
function getTransactionHistory(userId) {
  try {
    const trxPath = "./database/transaksi.json";
    if (!fs.existsSync(trxPath)) {
      return [];
    }

    const transactions = JSON.parse(fs.readFileSync(trxPath, "utf-8"));
    const userTransactions = transactions.filter(
      t => String(t.userId) === String(userId) || String(t.customerId) === String(userId)
    );

    // Return max 5 terakhir (terbaru duluan)
    return userTransactions.slice(-5).reverse();
  } catch (err) {
    console.error(`❌ Gagal ambil history:`, err.message);
    return [];
  }
}

/**
 * Format tanggal untuk display history
 */
function formatTransactionDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

function buildRekap(nokosData, depositData) {
  const successNokos = nokosData.filter(x => x.status === "success");
  const successDeposit = depositData.filter(x => x.status === "success");

  const sum = (arr, key) =>
    arr.reduce((a, b) => a + Number(b[key] || 0), 0);

  return {
    nokos: {
      total_trx: successNokos.length,
      omzet: sum(successNokos, "amount_user"),
      modal: sum(successNokos, "amount_provider"),
      margin: sum(successNokos, "margin"),
      today_margin: sum(
        successNokos.filter(x => isSameDay(x.success_at)),
        "margin"
      ),
      month_margin: sum(
        successNokos.filter(x => isSameMonth(x.success_at)),
        "margin"
      )
    },
    deposit: {
      total_trx: successDeposit.length,
      omzet: sum(successDeposit, "amount_paid"),
      margin: sum(successDeposit, "margin"),
      today_margin: sum(
        successDeposit.filter(x => isSameDay(x.success_at)),
        "margin"
      ),
      month_margin: sum(
        successDeposit.filter(x => isSameMonth(x.success_at)),
        "margin"
      )
    }
  };
}

function updateConfig(key, value) {
  const configPath = path.join(__dirname, "./config.js");
  
  try {
    let fileData = fs.readFileSync(configPath, "utf8");

    // boolean harus tanpa kutip
    const val = typeof value === "boolean" ? value : value;

    const regex = new RegExp(`${key}:\\s*(.*?),`);
    fileData = fileData.replace(regex, `${key}: ${val},`);

    fs.writeFileSync(configPath, fileData);

    // CLEAR CACHE DAN RELOAD
    delete require.cache[require.resolve("./config.js")];
    config = require("./config.js");
  } catch (err) {
    console.error("❌ Error updateConfig:", err.message);
  }
}

function saveUser(userId) {
  const fs = require("fs");
  const file = "./users.json";
  let db = [];

  if (fs.existsSync(file)) {
    db = JSON.parse(fs.readFileSync(file));
  }

  if (!db.includes(userId)) {
    db.push(userId);
    fs.writeFileSync(file, JSON.stringify(db, null, 2));
    return true; // menandakan user baru
  }
  return false; // user sudah ada
}

function userHasStarted(userId) {
  const fs = require("fs");
  const file = "./users.json";

  if (!fs.existsSync(file)) return false;

  const db = JSON.parse(fs.readFileSync(file));
  return db.includes(userId);
}

function checkJoinChannel() {
  try {
    return JSON.parse(fs.readFileSync(joinChFile)).status;
  } catch {
    return false;
  }
}

function checkMaintenance() {  
  try {  
    return JSON.parse(fs.readFileSync(maintenanceFile)).status;  
  } catch {  
    return false;  
  }  
}  

function checkGroupOnly() {  
  try {  
    return JSON.parse(fs.readFileSync(groupOnlyFile)).status;  
  } catch {  
    return false;  
  }  
}  

function checkSelfMode() {  
  try {  
    return JSON.parse(fs.readFileSync(modeFile)).self;  
  } catch {  
    return false;  
  }  
}  

// ====================== 🧱 GUARD UTAMA (BLOKIR GLOBAL + COOLDOWN) ======================
async function guardAll(x) {
  const isCallback = x.data !== undefined;
  const userId = isCallback ? x.from.id.toString() : x.from.id.toString();
  const chatId = isCallback ? x.message.chat.id : x.chat.id;
  const isPrivate = isCallback ? x.message.chat.type === "private" : x.chat.type === "private";
  const answer = (text, alert = true) => {
    if (isCallback) {
      return bot.answerCallbackQuery(x.id, { text, show_alert: alert });
    } else {
      return bot.sendMessage(chatId, text, { parse_mode: "HTML" });
    }
  };

  const channelUsername = config.urlchannel.replace("https://t.me/", "").replace("@", "");
  const isOwner = userId === config.OWNER_ID.toString();

  // === ⚙️ CEK WAJIB JOIN CHANNEL ===
  if (checkJoinChannel() && isPrivate && !isOwner) {
    try {
      const member = await bot.getChatMember(`@${channelUsername}`, userId);
      const isJoined = ["member", "administrator", "creator"].includes(member.status);

if (!isJoined) {
  if (!isCallback) {
    await bot.sendMessage(
      chatId,
      `
<b>🚫 Akses Ditolak!</b>
Kamu harus bergabung ke <b>channel resmi</b> terlebih dahulu untuk menggunakan bot ini.

🔗 <a href="${config.urlchannel}">Join Channel</a>

Setelah bergabung, tekan tombol di bawah ini.
      `,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Sudah Join", callback_data: "cek_join_guard" }],
            [{ text: "🔗 Join Channel", url: config.urlchannel }]
          ]
        }
      }
    );
        } else {
          await answer("❌ Kamu belum join channel.", true);
        }
        return true;
      }
    } catch (e) {
      console.log("⚠️ Gagal cek channel:", e.message);
    }
  }

// === 🔒 Blacklist ===
try {
  const blacklist = JSON.parse(fs.readFileSync(blacklistFile, "utf8"));
  const isBlacklisted = blacklist.find((u) => u.id === userId);

  if (isBlacklisted && !isOwner) {
    await answer(
      `
<b>🚫 Akses Ditolak!</b>
Kamu telah diblacklist dari penggunaan bot.

📋 <b>Alasan:</b> ${isBlacklisted.alasan}
🕐 <b>Waktu:</b> ${isBlacklisted.waktu}

Hubungi admin jika ini kesalahan.
      `,
      true
    );
    return true;
  }
} catch (err) {
  console.error("❌ Error membaca blacklist:", err);
}

// === ⚙️ Maintenance ===
if (checkMaintenance() && !isOwner) {
  if (!isCallback) {
    await bot.sendPhoto(
      chatId,
      maintenanceImage,
      {
        caption: `⚙️ <b>BOT SEDANG MAINTENANCE</b>

Kami sedang melakukan pembaruan sistem.
⛔ Untuk sementara, layanan tidak dapat digunakan.

⏳ Silakan coba lagi beberapa saat lagi.`,
        parse_mode: "HTML"
      }
    );
  } else {
    await bot.answerCallbackQuery(x.id, {
      text: "⚙️ Bot sedang maintenance, coba lagi nanti.",
      show_alert: true
    });
  }
  return true;
}


// === 🚫 Group-only ===
if (checkGroupOnly() && isPrivate && !isOwner) {
  await answer(
    `🚫 <b>Bot hanya bisa digunakan di grup</b>
untuk sementara.`,
    true
  );
  return true;
}

  // === 🤫 Self Mode ===
  if (checkSelfMode() && !isOwner) return true;

  return false;
}

global.guardAll = guardAll;

// ⏳ Handler callback_query sudah di bawah (gabung jadi satu)

async function generateCustomQRIS(
  qrUrl,
  outputName,
  options = {}
) {
  const {
     // 🧱 ukuran QR
  qrBaseWidth = 440,
  qrBaseHeight = 440,

  baseY = null,
  
  // ❌ jangan dipotong
  shrinkKiri = 0,
  shrinkKanan = 0,
  shrinkAtas = 0,
  shrinkBawah = 0,

  // ❌ jangan diperbesar
  expandKiri = 0,
  expandKanan = 0,
  expandAtas = 0,
  expandBawah = 0,

  // 🎯 posisi (INI KUNCI)
  offsetGlobalX = 0,
  offsetGlobalY = -102, // PAS ke kotak putih frame

  // 🟦 background QR
  bgColor = "#FFFFFF",
  padding = 15, // pas, nggak makan ornamen

  shadow = false // QRIS aman & clean
} = options;

  const bgPath = path.join(__dirname, "assets/images/qriscustom.jpg");
  const outPath = path.join(__dirname, "temp", outputName);

  const background = await loadImage(bgPath);
  const qrImage = await loadImage(qrUrl);

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.drawImage(background, 0, 0);

  // 🧮 hitung ukuran final QR
  const qrWidth =
    qrBaseWidth +
    expandKiri +
    expandKanan -
    shrinkKiri -
    shrinkKanan;

  const qrHeight =
    qrBaseHeight +
    expandAtas +
    expandBawah -
    shrinkAtas -
    shrinkBawah;

  // 📍 posisi dasar
  const baseX = (background.width - qrBaseWidth) / 2;
  const baseYFinal =
    baseY !== null
      ? baseY
      : (background.height - qrBaseHeight) / 2;

  // 🎯 posisi akhir QR
  const qrX =
    baseX -
    expandKiri +
    shrinkKiri +
    offsetGlobalX;

  const qrY =
    baseYFinal -
    expandAtas +
    shrinkAtas +
    offsetGlobalY;

  // 🟦 background putih QR
  ctx.fillStyle = bgColor;
  ctx.fillRect(
    qrX - padding,
    qrY - padding,
    qrWidth + padding * 2,
    qrHeight + padding * 2
  );

  // 🌫 shadow opsional
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 10;
  }

  // draw QR
  ctx.drawImage(qrImage, qrX, qrY, qrWidth, qrHeight);

  ctx.shadowBlur = 0;

  // simpan
  const buffer = canvas.toBuffer("image/jpeg");
  fs.writeFileSync(outPath, buffer);

  return outPath;
}

//##################################//
// Logs Message In Console
bot.on("message", async (msg) => {
  if (!msg.text) return;
  if (!msg.text.startsWith("/")) return;

  const command = msg.text.split(" ")[0].toLowerCase();
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
  const chatType = msg.chat.type === "private"
    ? "Private"
    : `Public (${msg.chat.title || "Group Tanpa Nama"})`;

  // Format tanggal Indonesia
  const waktu = moment().tz("Asia/Jakarta");
  const tanggal = waktu.format("DD/MMMM/YYYY"); // contoh: 23/September/2025
  const hari = waktu.format("dddd"); // contoh: Senin

  console.log(
    chalk.blue.bold("Messages Detected 🟢") +
    chalk.white.bold("\n▢ Command : ") + chalk.green.bold(command) +
    chalk.white.bold("\n▢ Pengirim : ") + chalk.magenta.bold(userId) +
    chalk.white.bold("\n▢ Name : ") + chalk.red.bold(username) +
    chalk.white.bold("\n▢ Chat Type : ") + chalk.yellow.bold(chatType) +
    chalk.white.bold("\n▢ Tanggal : ") + chalk.cyan.bold(`${hari}, ${tanggal}\n`)
  );
});

// ==================== ⚡ SYSTEM LOG : AUTO SAVE ID ====================
bot.on("message", (msg) => {
  if (!msg.from) return;

  // ⛔ ABAIKAN PESAN REFERRAL
  if (msg.text && msg.text.startsWith("/start ref_")) return;

  const username = msg.from.username
    ? `@${msg.from.username}`
    : msg.from.first_name;

  const userId = msg.from.id.toString();
  const waktu = moment().tz("Asia/Jakarta").format("DD-MM-YYYY HH:mm:ss");

  const usersFile = path.join(__dirname, "users.json");
  let users = [];

  if (fs.existsSync(usersFile)) {
    try {
      users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
    } catch {
      users = [];
    }
  }

  if (!users.includes(userId)) {
    users.push(userId);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    const totalID = users.length;

bot.sendMessage(
  config.OWNER_ID,
  `<b>╔═══ 🕶️ CYBER DATABASE UPDATE ═══╗</b>
<code>▌ Secure Mainframe Logging ▐</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>🧠 NEW IDENTITY REGISTERED</b>
<code>▸ Neural signature detected</code>

👤 <b>Username</b>        : <b>${username}</b>
🆔 <b>ID Telegram</b>      : <code>${userId}</code>
🕒 <b>Timestamp</b>    : ${waktu}
📊 <b>Registry Count</b>: <b>${totalID}</b>

📡 <b>System Status</b>
<code>✔ Identity encrypted & archived</code>
<code>✔ Database index synchronized</code>
<code>✔ Access node stabilized</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💀 <b>CORE SYNC COMPLETE</b>
<code>▌ All systems operating normally ▐</code>

<i>#AutoSaveID #CyberCore #Mainframe #SecureLog</i>`,
  {
    parse_mode: "HTML",
    disable_web_page_preview: true
  }
);
  }
});

const sendMessage = (chatId, text) => bot.sendMessage(chatId, text);
bot.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "riwayat", description: "📜 Lihat riwayat transaksi Anda" },
  { command: "rekap", description: "Rekap transaksi & profit (Owner)" }
]);
// ====== FIX: ADD GLOBAL DEPOSIT LOCK ======
const depositLock = {};

// =====================
const sessionPath = path.join(__dirname, 'sessioncs.json');
const userState = {};
let contactSession = {};
let terminatedSession = {};
let forwardedMap = {};
let ownerReplyTarget = {}; // ⬅️ target user yang sedang dibalas owner

// Load session dari file jika ada
if (fs.existsSync(sessionPath)) {
  const data = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  contactSession = data.contactSession || {};
  terminatedSession = data.terminatedSession || {};
  forwardedMap = data.forwardedMap || {};
}

// Simpan session ke file
function saveSession() {
  fs.writeFileSync(sessionPath, JSON.stringify({ contactSession, terminatedSession, forwardedMap }, null, 2));
}

async function handleReferralStart(msg) {
  const fs = require("fs");
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const config = require("./config.js");

  try {
    const text = msg.text || "";
    if (!text.startsWith("/start ref_")) return;

    // === Load referral database DULU (sebelum semua) ===
    const referralDB = "./database/referral.json";
    let referralData = {};
    if (fs.existsSync(referralDB)) {
      try {
        const raw = fs.readFileSync(referralDB, "utf8");
        referralData = JSON.parse(raw);
      } catch (e) {
        console.error("referral.json parse error:", e.message);
        referralData = {};
      }
    }

    // === Sekarang barulah ambil refCode ===
    const refCode = text.replace("/start ", "").trim();
    const totalTeman = Object.values(referralData).filter(
      r => r.referrerId === refCode
    ).length;
    const waktuNotif = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    // === Load SystemReferral (safe) ===
    const sysPath = "./database/SystemReferral.json";
    let sysRef = { Referral_Enabled: true, Referral_PerUser: 0, Referral_PerDaftar: 0 };
    if (fs.existsSync(sysPath)) {
      try {
        const raw = fs.readFileSync(sysPath, "utf8");
        sysRef = JSON.parse(raw);
      } catch (e) {
        // jika rusak → anggap disabled supaya aman
        console.error("SystemReferral.json parse error:", e.message);
        sysRef = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };
      }
    }

    // Jika referral OFF → beritahu user dan (opsional) owner pemilik kode
    if (!sysRef.Referral_Enabled) {
      // Notifikasi user yang klik link
      await bot.sendMessage(chatId,
        "🔴 <b>Sistem referral sedang NONAKTIF oleh owner.</b>\nReferral tidak dapat digunakan saat ini.",
        { parse_mode: "HTML" }
      ).catch(()=>{});

      // Opsional notif owner kode (jika file kode ada dan owner ditemukan)
      try {
        const codeFile = "./database/referralCode.json";
        if (fs.existsSync(codeFile)) {
          const referralCodes = JSON.parse(fs.readFileSync(codeFile, "utf8"));
          const ownerEntry = Object.entries(referralCodes).find(e => `ref_${e[1]}` === refCode);
          if (ownerEntry) {
            const ownerId = ownerEntry[0];
            await bot.sendMessage(ownerId,
              `⚠️ Referral tidak diproses: user <code>${userId}</code> mengklik link ref kamu,\nnamun sistem referral sedang OFF.`,
              { parse_mode: "HTML" }
            ).catch(()=>{});
          }
        }
      } catch (e) {
        console.error("Notif owner failed:", e.message);
      }

      return; // STOP TOTAL
    }

    // === File kode referral (safe parse) ===
    const codeFile = "./database/referralCode.json";
    if (!fs.existsSync(codeFile)) return; // no codes

    let referralCodes = {};
    try {
      referralCodes = JSON.parse(fs.readFileSync(codeFile, "utf8"));
    } catch (e) {
      console.error("referralCode.json parse error:", e.message);
      return;
    }

    const ownerCode = Object.entries(referralCodes).find(e => `ref_${e[1]}` === refCode);
    if (!ownerCode) return; // kode tidak valid

    const ownerId = ownerCode[0];

    // 🚫 Anti refer diri sendiri
    if (ownerId === userId) {
      return bot.sendMessage(chatId, "❌ Kamu tidak bisa memakai kode referral milik sendiri.");
    }

    // 🚫 Cek jika user sudah pernah pakai bot → referral gagal
    if (typeof userHasStarted === "function" && userHasStarted(userId)) {
      // Notifikasi ke owner referral
      bot.sendMessage(
        ownerId,
        `⚠️ <b>Referral Gagal</b>\n\n` +
        `👤 User: <code>${userId}</code>\n` +
        `📌 Alasan: User sudah pernah menggunakan bot sebelumnya.\n` +
        `❌ Bonus tidak diberikan.`,
        { parse_mode: "HTML" }
      ).catch(()=>{});

      return bot.sendMessage(chatId,
        "ℹ️ Kamu sudah pernah menggunakan bot sebelumnya, jadi referral tidak bisa dipakai.",
        { parse_mode: "HTML" }
      ).catch(()=>{});
    }

    // ===============================
    // 📌 referralData sudah di-load di awal ===
    // ===============================

    // Ambil bonus dari SystemReferral (sudah aman di atas)
    const BONUS_REFERRAL = Number(sysRef.Referral_PerUser) || 0;  // Bonus untuk owner kode
    const BONUS_REFERRED = Number(sysRef.Referral_PerDaftar) || 0; // Bonus untuk user baru

    // Simpan data referral baru
    referralData[userId] = {
      referrerId: refCode,
      newUser: userId,
      bonus: BONUS_REFERRAL,
      date: new Date().toISOString(),
    };

    fs.writeFileSync(referralDB, JSON.stringify(referralData, null, 2));

    // ==========================================================
    // 🔥 UPDATE SALDO OTOMATIS (safe)
    // ==========================================================
    const saldoFile = "./database/saldoOtp.json";
    if (!fs.existsSync(saldoFile)) {
      fs.writeFileSync(saldoFile, JSON.stringify({}, null, 2));
    }

    let saldo = {};
    try {
      saldo = JSON.parse(fs.readFileSync(saldoFile, "utf8"));
    } catch (e) {
      saldo = {};
    }

    // Pastikan user & owner punya saldo
    if (!saldo[userId]) saldo[userId] = 0;
    if (!saldo[ownerId]) saldo[ownerId] = 0;

    // Tambah saldo
    saldo[userId] = Number(saldo[userId]) + Number(BONUS_REFERRED);
    saldo[ownerId] = Number(saldo[ownerId]) + Number(BONUS_REFERRAL);

    // Simpan saldo
    fs.writeFileSync(saldoFile, JSON.stringify(saldo, null, 2));

    // ==========================================================
    // 🔔 NOTIFIKASI
    // ==========================================================
    // Notifikasi ke owner kode referral
bot.sendMessage(
  ownerId,
  `🎉 🎉 <b>BONUS REFERRAL MASUK!</b>

Ada teman baru bergabung lewat link kamu!

👤 <b>ID Telegram:</b> <code>${userId}</code>
💰 <b>Bonus:</b> +Rp${BONUS_REFERRAL.toLocaleString("id-ID")}
📊 <b>Total Teman:</b> ${totalTeman}

⏰ <i>${waktuNotif}</i>
`,
  { parse_mode: "HTML" }
).catch(()=>{});

    // Notifikasi ke user baru
bot.sendMessage(
  chatId,
  `🎉 <b>Bonus Referral Berhasil!</b>

Kamu mendapatkan bonus +Rp${BONUS_REFERRED.toLocaleString("id-ID")} karena bergabung melalui referral teman! ✨

⏰ <i>${waktuNotif}</i>
`,
  { parse_mode: "HTML" }
).catch(()=>{});

  } catch (err) {
    console.error("handleReferralStart error:", err);
  }
}

// ====================================================
// 🧾 COMMANDS — BOT.ONTEXT
// ====================================================
bot.onText(/^\/start(?:\s+.+)?$/, async (msg) => {
  try {
        if (await guardAll(msg)) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "❌ Tidak ada username";
  const name = msg.from.first_name || "Tanpa Nama";
  const config = require("./config.js");
  
// ============= CEK MAINTENANCE =============
const maintenancePath = "./database/maintenanceDB.json";

// Jika folder belum ada → buat
if (!fs.existsSync("./database")) {
    fs.mkdirSync("./database");
}

// Jika file belum ada → buat default
if (!fs.existsSync(maintenancePath)) {
    fs.writeFileSync(
        maintenancePath,
        JSON.stringify({
            settings: { maintenance: false }
        }, null, 2)
    );
}

const db = JSON.parse(fs.readFileSync(maintenancePath, "utf-8"));

if (db.settings.maintenance) {
    const screen = dailyMaintenance.getMaintenanceScreen();
    return bot.sendMessage(chatId, screen.text, screen.options);
}  

await handleReferralStart(msg);
saveUser(msg.from.id.toString()); // <— universal save

    // =====================================================
    // 🔹 LOAD SYSTEM REFERRAL FROM JSON (BUKAN DARI CONFIG)
    // =====================================================
    const sysPath = "./database/SystemReferral.json";
    let sys = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };

    if (fs.existsSync(sysPath)) {
      sys = JSON.parse(fs.readFileSync(sysPath));
    }

    const BONUS_REFERRAL = sys.Referral_PerUser || 0;
    const BONUS_REFERRED = sys.Referral_PerDaftar || 0;    
  
    // 🔹 Ambil total pengguna dari users.json
    const usersFile = "./users.json";
    let totalUsers = 0;

    if (fs.existsSync(usersFile)) {
      const dataUsers = JSON.parse(fs.readFileSync(usersFile));
      if (Array.isArray(dataUsers)) {
        totalUsers = dataUsers.length;
      }
    }

    // === Pesan /start ===
    const caption = `👑 <b>RajaOTP</b> — Secure OTP Automation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 <b>Selamat datang, ${name}</b>

Dapatkan nomor verifikasi virtual untuk 1000+ aplikasi dengan harga terjangkau dan keamanan terjamin.

<b>✨ Fitur Unggulan</b>
• OTP instan tanpa delay
• Support 50+ negara
• Harga mulai Rp2.000
• Refund otomatis jika gagal
• Bonus referral Rp${BONUS_REFERRAL.toLocaleString("id-ID")}/teman

<b>📊 Data Akun</b>
Name: <code>${name}</code>
ID: <code>${userId}</code>
User aktif: <code>${totalUsers.toLocaleString("id-ID")}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>➤ Pilih layanan di bawah untuk mulai</b>

👑 RajaOTP • Secure OTP Automation
`;

    // === Inline Keyboard ===
    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Layanan OTP", callback_data: "choose_service" }],
          [
            { text: "💰 Topup Saldo", callback_data: "deposit_menu" }, { text: "🎁 Program Referral", callback_data: "bonus_referral" }],
          [{ text: "❓ Bantuan & Panduan", callback_data: "panduan_user" }],
          [{ text: "🏆 Pengguna Terbaik", callback_data: "listtop_user" }, { text: "👤 Akun Saya", callback_data: "profile" }],
          [{ text: "💬 Hubungi Kami", callback_data: "open_support_info" }],
        ],
      },
      parse_mode: "HTML",
    };

    // === Kirim foto dengan caption + tombol ===
    await bot.sendPhoto(msg.chat.id, config.linkthumbnail, {
      caption,
      ...buttons,
    });

    // ====================================================
    // 🗑️ BAGIAN NOTIF OWNER DIHAPUS SEPENUHNYA
    // ====================================================

  } catch (err) {
    logError(err, "/start");
  }
});
// ==============================================
// 💠 CALLBACK HANDLER — RajaOTP (CRASH FIX)
// ==============================================
bot.on("callback_query", async (callbackQuery) => {
  try {
    // 🔒 WAJIB PALING ATAS - Deklarasikan SEBELUM APAPUN
    const userId = callbackQuery.from?.id;
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const data = callbackQuery.data;
    const { from } = callbackQuery;

    // Guard userId
    if (!userId) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "⚠️ User tidak valid",
        show_alert: true
      }).catch(() => {});
      return;
    }

    // Immediate answerCallbackQuery to prevent timeout
    await bot.answerCallbackQuery(callbackQuery.id).catch(() => {});

    // Guard chatId & messageId untuk edit operations
    if (!chatId || !messageId) {
      console.warn("[GUARD] Missing chatId/messageId for userId:", userId);
      return;
    }

    // ✅ Setelah guard ini, SEMUA VARIABLE DIJAMIN VALID
    const axios = require("axios");
    const API_KEY = config.RUMAHOTP;
    const perPage = 20;

    // 🧩 Initialize global cache
    if (!global.cachedServices) global.cachedServices = [];
    if (!global.cachedCountries) global.cachedCountries = {};
    if (!global.userState) global.userState = {};

    // ✅ CEK JOIN GUARD (HANDLE TOMBOL "✅ SUDAH JOIN")
    if (data === "cek_join_guard") {
      try {
        const channelUsername = config.urlchannel.replace("https://t.me/", "").replace("@", "");
        const member = await bot.getChatMember(`@${channelUsername}`, userId);
        const isJoined = ["member", "administrator", "creator"].includes(member.status);

        if (isJoined) {
          await bot.deleteMessage(chatId, messageId).catch(() => {});
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "✅ Kamu sudah join channel!",
            show_alert: false
          }).catch(() => {});
          await bot.sendMessage(chatId, "✅ Terima kasih sudah join! Sekarang kamu bisa menggunakan bot.");
        } else {
          await bot.answerCallbackQuery(callbackQuery.id, {
            text: "🚫 Kamu belum join channel!",
            show_alert: true
          }).catch(() => {});
        }
      } catch (e) {
        console.log("⚠️ Error cek ulang channel:", e.message);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "⚠️ Gagal cek channel!",
          show_alert: true
        }).catch(() => {});
      }
      return;
    }

// ===============================
// 📦 PILIH SERVICE (DAFTAR APLIKASI OTP)
// ===============================
if (data === "choose_service") {
    const page = 1;
    const perPage = 20;

// 💬 LANGSUNG UBAH CAPTION MENJADI LOADING (HTML)
if (messageId) {
  await bot.editMessageCaption("<b>⏳ Memuat daftar layanan premium...</b>\n━━━━━━━━━━━━━━━━━━━━\nMohon tunggu sebentar.", {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML"
  }).catch(() => {});
}

    try {
        const response = await axios.get("https://www.rumahotp.com/api/v2/services", {
            headers: { "x-apikey": API_KEY }
        });

        if (!response.data.success) {
            console.error("[FETCH_SERVICES] API returned success=false", response.data);
            throw new Error("API returned success=false");
        }

        if (!Array.isArray(response.data.data)) {
            console.error("[FETCH_SERVICES] Response data is not array:", typeof response.data.data);
            throw new Error("API data is not array");
        }

        const services = response.data.data;

        if (services.length === 0) {
            console.warn("[FETCH_SERVICES] API returned empty services array");
            throw new Error("No services available from API");
        }

        global.cachedServices = services;

        const totalPages = Math.ceil(services.length / perPage);
const makeKeyboard = (page) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const list = services.slice(start, end);

  const keyboard = [];

  // 🔍 SEARCH DI ATAS
  keyboard.push([{ text: "🔎 Cari Layanan", callback_data: "search_service" }]);

  // 💠 2 KOLOM PER BARIS
  for (let i = 0; i < list.length; i += 2) {
    const row = [];

    row.push({
      text: list[i].service_name,
      callback_data: `service_${list[i].service_code}`
    });

    if (list[i + 1]) {
      row.push({
        text: list[i + 1].service_name,
        callback_data: `service_${list[i + 1].service_code}`
      });
    }

    keyboard.push(row);
  }

  // ⬅️ ➡️ NAVIGASI
  const nav = [];
  if (page > 1) nav.push({ text: "⬅️ Prev", callback_data: `choose_service_page_${page - 1}` });
  if (page < totalPages) nav.push({ text: "➡️ Next", callback_data: `choose_service_page_${page + 1}` });
  if (nav.length) keyboard.push(nav);

  // 📖 HALAMAN
  keyboard.push([{ text: `📖 Hal ${page}/${totalPages}`, callback_data: "noop" }]);

  // 🏠 MENU UTAMA
  keyboard.push([{ text: "🏠 Menu Utama", callback_data: "back_home" }]);

  return keyboard;
};
const caption = `👑 <b>RajaOTP • Daftar Layanan</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 <b>Pilih Aplikasi untuk Verifikasi</b>

Total Tersedia: <b>${services.length}</b> layanan
Halaman: <b>${page}/${totalPages}</b>

💡 <b>Tip:</b> Gunakan tombol 🔎 untuk mencari aplikasi spesifik.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

// 🖼️ EDIT FOTO + CAPTION SEKALIGUS JADI LIST SERVICE (HTML)
// Guard: Pastikan messageId ada sebelum edit
if (!messageId) {
  console.warn("[CHOOSE_SERVICE_GUARD] messageId tidak tersedia");
  await bot.answerCallbackQuery(callbackQuery.id, {
    text: "⚠️ Terjadi perubahan pesan, silakan ulangi.",
    show_alert: true
  }).catch(() => {});
  return;
}

await bot.editMessageMedia(
    {
        type: "photo",
        media: config.linkthumbnail,
        caption,
        parse_mode: "HTML"
    },
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: makeKeyboard(page) }
            }
        ).catch(err => {
          console.error("[EDIT_MEDIA_ERROR] choose_service:", err.message);
        });

        getUserState(userId).lastServicePhoto = {
            chatId,
            messageId: messageId
        };

    } catch (err) {
        console.error("[CHOOSE_SERVICE_ERROR] Failed to load services");
        console.error("[CHOOSE_SERVICE_ERROR]", err);
        if (err.response?.data) {
            console.error("[CHOOSE_SERVICE_ERROR] API response data:", JSON.stringify(err.response.data, null, 2));
        }
        if (err.response?.status) {
            console.error("[CHOOSE_SERVICE_ERROR] HTTP status:", err.response.status);
        }
  if (messageId) {
    await bot.editMessageCaption("❌ <b>GAGAL MEMUAT DAFTAR LAYANAN</b>\n\nTerjadi kesalahan saat mengambil data layanan.\nSilakan coba kembali beberapa saat lagi.", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML"
    }).catch(err => {
      console.error("[EDIT_CAPTION_ERROR] choose_service error:", err.message);
    });
  }
    }
}
if (data.startsWith("choose_service_page_")) {
    const perPage = 20;
    const page = Number(data.split("_").pop());
    const services = global.cachedServices;

    if (!services || services.length === 0) {
        return bot.sendMessage(chatId, "⚠️ Data layanan tidak ditemukan. Silakan jalankan /start.");
    }

    const lastPhoto = getUserState(userId).lastServicePhoto;
    if (!lastPhoto || !lastPhoto.messageId) {
        return bot.sendMessage(chatId, "⚠️ Tidak dapat menemukan daftar sebelumnya. Silakan klik Layanan OTP lagi.");
    }

    const { chatId: pChat, messageId } = lastPhoto;
    const totalPages = Math.ceil(services.length / perPage);

const makeKeyboard = (page) => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const currentPage = services.slice(start, end);

const keyboard = [];

keyboard.push([{ text: "🔎 Search Aplikasi", callback_data: "search_service" }]);

for (let i = 0; i < currentPage.length; i += 2) {
    const row = [];

    row.push({
        text: `${currentPage[i].service_name} | ${currentPage[i].service_code}`,
        callback_data: `service_${currentPage[i].service_code}`
    });

    if (currentPage[i + 1]) {
        row.push({
            text: `${currentPage[i + 1].service_name} | ${currentPage[i + 1].service_code}`,
            callback_data: `service_${currentPage[i + 1].service_code}`
        });
    }

    keyboard.push(row);
}

const nav = [];
if (page > 1) nav.push({ text: "⬅️ Prev", callback_data: `choose_service_page_${page - 1}` });
if (page < totalPages) nav.push({ text: "➡️ Next", callback_data: `choose_service_page_${page + 1}` });
if (nav.length) keyboard.push(nav);

keyboard.push([{ text: `📖 Hal ${page}/${totalPages}`, callback_data: "noop" }]);
keyboard.push([{ text: "🏠 Kembali Ke Menu Utama", callback_data: "back_home" }]);

    return keyboard;
};

const caption = `
📱 <b>DAFTAR LAYANAN OTP</b>

Silakan pilih salah satu aplikasi untuk melanjutkan.
📄 Halaman ${page} dari ${totalPages}
💡 Total layanan: ${services.length}

🔍 <b>Fitur Baru:</b> Gunakan tombol "Cari Layanan" untuk mencari aplikasi tertentu.
`;

await bot.editMessageCaption(caption, {
    chat_id: pChat,
    message_id: messageId,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: makeKeyboard(page) },
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] choose_service_page:", err.message);
});
}
if (data === "search_service") {
    const lastPhoto = getUserState(userId).lastServicePhoto;
    if (!lastPhoto || !lastPhoto.messageId) {
      return bot.sendMessage(chatId, "⚠️ Tidak dapat menemukan daftar layanan.");
    }

    global.waitingSearch = global.waitingSearch || {};
    global.waitingSearch[userId] = lastPhoto; // Simpan message yg akan diedit

const caption = `
🔍 <b>PENCARIAN LAYANAN</b>

Silakan ketik nama aplikasi yang ingin Anda cari.

💡 <b>Contoh:</b>
• TikTok
• WhatsApp  
• Telegram
• Facebook

⚠️ <b>Note:</b> Hanya boleh memasukkan 1 nama aplikasi saja.
`;

await bot.editMessageCaption(caption, {
    chat_id: lastPhoto.chatId,
    message_id: lastPhoto.messageId,
    parse_mode: "HTML",
    reply_markup: {
        inline_keyboard: [
            [{ text: "🏠 Kembali", callback_data: "choose_service" }]
        ]
    }
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] search_service:", err.message);
});
}
// ======================================================
// 🌍 PILIH NEGARA — V8 (Caption Loading FIX)
// ======================================================
if (data.startsWith("service_") || data.startsWith("countrylist_")) {
    const axios = require("axios");
    const apiKey = config.RUMAHOTP;

    let serviceId, page = 1;
    let isPagination = false;

    if (data.startsWith("service_")) {
        serviceId = data.split("_")[1];
    }

    if (data.startsWith("countrylist_")) {
        const parts = data.split("_");
        serviceId = parts[1];
        page = Number(parts[2]);
        isPagination = true;
    }

    bot.answerCallbackQuery(callbackQuery.id).catch(() => {});

    // =====================================
    // ✔ FIX: Saat user klik service → caption jadi loading
    // =====================================
    if (!isPagination) {
        let serviceName = "Layanan Tidak Dikenal";
        if (global.cachedServices) {
            const s = global.cachedServices.find(a => a.service_code == serviceId);
            if (s) serviceName = s.service_name;
        }

await bot.editMessageCaption(
  `⏳ <b>Memuat daftar negara untuk layanan</b>
Layanan: <b>${serviceName}</b>
ID: ${serviceId}

Mohon tunggu...`,
  {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "HTML"
  }
).catch(() => {});
    }

    try {
        // Cache country per service
        if (!global.cachedCountries) global.cachedCountries = {};
        if (!global.cachedCountries[serviceId]) {
            const res = await axios.get(
                `https://www.rumahotp.com/api/v2/countries?service_id=${serviceId}`,
                { headers: { "x-apikey": apiKey, Accept: "application/json" } }
            );

            if (!res.data.success) {
                console.error("[FETCH_COUNTRIES] API returned success=false", res.data);
                throw new Error("API returned success=false");
            }

            if (!Array.isArray(res.data.data)) {
                console.error("[FETCH_COUNTRIES] Response data is not array:", typeof res.data.data, res.data.data);
                throw new Error("API data is not array");
            }

            if (res.data.data.length === 0) {
                console.warn(`[FETCH_COUNTRIES] API returned empty array for serviceId: ${serviceId}`);
            }

            global.cachedCountries[serviceId] = res.data.data.filter(
                x => x.pricelist && x.pricelist.length > 0
            );
        }

        const countries = global.cachedCountries[serviceId];
        const totalCountries = countries.length;

        if (totalCountries === 0) {
            console.warn(`[COUNTRY_LIST] No countries available for serviceId: ${serviceId}`);
        return bot.editMessageCaption(
    "⚠️ <b>TIDAK ADA NEGARA TERSEDIA</b>\n\nLayanan ini belum memiliki negara yang mendukung verifikasi.",
    {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] no_countries:", err.message);
});
        }

        const perPage = 20;
        const totalPages = Math.ceil(totalCountries / perPage);

        const start = (page - 1) * perPage;
        const slice = countries.slice(start, start + perPage);

        let serviceName = "Layanan Tidak Dikenal";
        if (global.cachedServices) {
            const s = global.cachedServices.find(a => a.service_code == serviceId);
            if (s) serviceName = s.service_name;
        }

const keyboard = [];

// 🔍 SEARCH NEGARA (DI ATAS)
keyboard.push([
  { text: "🔎 Cari Negara", callback_data: `search_country_${serviceId}` }
]);

// 💠 2 KOLOM (KIRI & KANAN) DENGAN BENDERA
for (let i = 0; i < slice.length; i += 2) {
  const row = [];

  // Fungsi untuk ubah ISO country code ke emoji bendera
  const flagEmoji = (iso) => iso.toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));

  row.push({
    text: `${flagEmoji(slice[i].iso_code)} ${slice[i].name} (${slice[i].prefix})`,
    callback_data: `country_${serviceId}_${slice[i].iso_code}_${slice[i].number_id}`
  });

  if (slice[i + 1]) {
    row.push({
      text: `${flagEmoji(slice[i + 1].iso_code)} ${slice[i + 1].name} (${slice[i + 1].prefix})`,
      callback_data: `country_${serviceId}_${slice[i + 1].iso_code}_${slice[i + 1].number_id}`
    });
  }

  keyboard.push(row);
}

const nav = [];
if (page > 1)
  nav.push({ text: "⬅️ Prev", callback_data: `countrylist_${serviceId}_${page - 1}` });

if (page < totalPages)
  nav.push({ text: "➡️ Next", callback_data: `countrylist_${serviceId}_${page + 1}` });

if (nav.length) keyboard.push(nav);

keyboard.push([{ text: `📖 Hal ${page}/${totalPages}`, callback_data: "noop" }]);
keyboard.push([{ text: "⬅️ Kembali", callback_data: "choose_service" }]);

const caption = `👑 <b>RajaOTP • Pilih Negara</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 <b>Layanan:</b> ${serviceName}
🆔 <b>ID:</b> ${serviceId}

🌍 <b>Pilih Negara untuk Melanjutkan</b>

Halaman: <b>${page}/${totalPages}</b>
Total Negara: <b>${totalCountries}</b>

💡 <b>Tip:</b> Gunakan tombol 🔎 untuk mencari negara tertentu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// ===================================
// ✔ Jika pagination → hanya edit caption
// ===================================
if (isPagination && getUserState(userId).lastCountryPhoto) {
    return bot.editMessageCaption(caption, {
        chat_id: getUserState(userId).lastCountryPhoto.chatId,
        message_id: getUserState(userId).lastCountryPhoto.messageId,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: keyboard }
    }).catch(err => {
      console.error("[EDIT_CAPTION_ERROR] countrylist_pagination:", err.message);
    });
}

        // ===================================
        // ✔ Jika klik pertama → replace foto /start
        // ===================================
        if (!messageId) {
          console.warn("[EDIT_GUARD] messageId tidak tersedia di service handler");
          return;
        }
        
        const sent = await bot.editMessageMedia(
            {
                type: "photo",
                media: config.linkthumbnail,
                caption,
                parse_mode: "HTML"
            },
            {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: keyboard }
            }
        ).catch(err => {
          console.error("[EDIT_MEDIA_ERROR] service_first_country:", err.message);
        });

        global.lastCountryPhoto = {
            chatId,
            messageId: messageId
        };
        getUserState(userId).lastCountryPhoto = {
            chatId,
            messageId: messageId
        };

    } catch (err) {
        console.error("[SERVICE_HANDLER_ERROR] Failed to load countries for serviceId:", serviceId);
        console.error("[SERVICE_HANDLER_ERROR]", err);
        if (err.response?.data) {
            console.error("[SERVICE_HANDLER_ERROR] API response data:", JSON.stringify(err.response.data, null, 2));
        }
        if (err.response?.status) {
            console.error("[SERVICE_HANDLER_ERROR] HTTP status:", err.response.status);
        }
await bot.editMessageCaption("❌ <b>Gagal memuat negara.</b>", {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "HTML"
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] service_error:", err.message);
});
    }
}
if (data.startsWith("search_country_")) {
  const serviceId = data.split("_")[2];
  const lastPhoto = getUserState(userId).lastCountryPhoto;

  if (!lastPhoto || !lastPhoto.messageId) {
    return bot.answerCallbackQuery(callbackQuery.id, {
      text: "⚠️ Data negara tidak ditemukan.",
      show_alert: true
    });
  }

  global.waitingCountrySearch = global.waitingCountrySearch || {};
  global.waitingCountrySearch[userId] = {
    serviceId,
    chatId: lastPhoto.chatId,
    messageId: lastPhoto.messageId
  };

  const serviceName =
    global.cachedServices?.find(s => s.service_code == serviceId)?.service_name ||
    "Layanan Tidak Dikenal";

const caption = `
🔍 <b>PENCARIAN NEGARA</b>

Layanan: <b>${serviceName}</b>

Silakan ketik nama negara.
💡 <b>Contoh:</b>
• Indonesia
• Russia
• United
• Japan

⚠️ <b>Note:</b> Ketik 1 kata saja.
`;

await bot.editMessageCaption(caption, {
  chat_id: lastPhoto.chatId,
  message_id: lastPhoto.messageId,
  parse_mode: "HTML",
  reply_markup: {
    inline_keyboard: [
      [{ text: "⬅️ Kembali", callback_data: `countrylist_${serviceId}_1` }]
    ]
  }
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] search_country:", err.message);
});
}
// ===============================
// 💰 PILIH HARGA DARI NEGARA — V8 (Caption langsung loading)
// ===============================
if (data.startsWith("country_")) {
    const [, serviceId, isoCode, numberId] = data.split("_");
    const axios = require("axios");
    const apiKey = config.RUMAHOTP;
    const UNTUNG_NOKOS = config.UNTUNG_NOKOS || 0;

    let serviceName = "Layanan Tidak Dikenal";
    if (global.cachedServices) {
        const s = global.cachedServices.find(a => a.service_code == serviceId);
        if (s) serviceName = s.service_name;
    }

    // ========================================
    // ✔ LANGSUNG UBAH CAPTION JADI "LOADING"
    // ========================================
    if (global.lastCountryPhoto) {
await bot.editMessageCaption(
  `⏳ <b>Memuat daftar harga untuk negara</b>
Region: <b>${isoCode.toUpperCase()}</b>
Layanan: <b>${serviceName}</b>

Mohon tunggu...`,
  {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML"
  }
).catch(() => {});
    }

    try {
        // =====================================================
        // Ambil negara dari cache
        // =====================================================
        let negara = null;

        if (global.cachedCountries && global.cachedCountries[serviceId]) {
            negara = global.cachedCountries[serviceId].find(
                c => String(c.number_id) === String(numberId)
            );
        }

        // Kalau tidak ada di cache, ambil dari API
        if (!negara) {
            const res = await axios.get(
                `https://www.rumahotp.com/api/v2/countries?service_id=${serviceId}`,
                { headers: { "x-apikey": apiKey } }
            );
            negara = (res.data?.data || []).find(
                c => String(c.number_id) === String(numberId)
            );
        }

        if (!negara) {
return bot.editMessageCaption(
    `❌ Negara <b>${isoCode.toUpperCase()}</b> tidak ditemukan.`,
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
);
        }

        // =====================================================
        // Filter provider aktif
        // =====================================================
        const providers = (negara.pricelist || [])
            .filter(p => p.available && p.stock > 0)
            .map(p => {
                const base = Number(p.price) || 0;
                const hargaFinal = base + UNTUNG_NOKOS;
                return {
                    ...p,
                    price: hargaFinal,
                    price_format: `Rp${hargaFinal.toLocaleString("id-ID")}`
                };
            })
            .sort((a, b) => a.price - b.price);

        if (providers.length === 0) {
return bot.editMessageCaption(
    `⚠️ Tidak ada stok tersedia untuk negara <b>${negara.name}</b>.`,
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] country_no_providers:", err.message);
});
        }

        // =====================================================
        // Buat tombol harga
        // =====================================================
        const inlineKeyboard = providers.map(p => [
            {
                text: `${p.price_format} 💰 (stok ${p.stock})`,
                callback_data: `buy_${numberId}_${p.provider_id}_${serviceId}`
            }
        ]);

        inlineKeyboard.push([
            { text: "⬅️ Kembali", callback_data: `service_${serviceId}` }
        ]);

        // =====================================================
        // ✔ UPDATE CAPTION JADI LIST HARGA
        // =====================================================
const caption = `
✨ <b>Negara & Layanan</b>
🌍 <b>${negara.name}</b> | ${negara.prefix}
📦 <b>${serviceName}</b> (ID: ${serviceId})

💰 <b>Daftar Harga:</b>
🔹 Termurah ➜ Termahal

📊 <b>Stok Tersedia:</b> ${negara.stock_total} item
⏱️ <b>Segera pesan sebelum habis!</b>

--------------------------------
💡 <b>Tips:</b> Pilih layanan & harga sesuai kebutuhanmu
🎯 Cepat, mudah, aman!
`;

await bot.editMessageCaption(caption, {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: inlineKeyboard }
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] country_price_list:", err.message);
});
    } catch (err) {
        console.log("❌ ERROR:", err);
await bot.editMessageCaption(
    "❌ <b>Gagal memuat harga.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] country_error:", err.message);
});
    }
}
// =====================================================
// 📋 DETAIL SETELAH PILIH HARGA — FINAL V10 (No Delete)
// =====================================================
if (data.startsWith("buy_")) {
    const parts = data.split("_");
    const numberId   = parts[1];
    const providerId = parts[2];
    const serviceId  = parts[3];

    const axios = require("axios");
    const apiKey = config.RUMAHOTP;
    const UNTUNG_NOKOS = config.UNTUNG_NOKOS || 0;
    const photoThumb = config.linkthumbnail;

    let serviceName = "Layanan Tidak Dikenal";
    if (global.cachedServices) {
        const svc = global.cachedServices.find(s => String(s.service_code) === String(serviceId));
        if (svc) serviceName = svc.service_name;
    }

    // =====================================================
    // ✔ LANGSUNG UBAH CAPTION JADI LOADING
    // =====================================================
    if (getUserState(userId).lastCountryPhoto) {
await bot.editMessageCaption(
    "⏳ <b>Memuat detail layanan…</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(() => {});
    }

    try {
        // =====================================================
        // Ambil data negara (cache → API)
        // =====================================================
        let negara;
        if (global.cachedCountries && global.cachedCountries[serviceId]) {
            negara = global.cachedCountries[serviceId]
                .find(c => String(c.number_id) === String(numberId));
        }

        if (!negara) {
            const res = await axios.get(
                `https://www.rumahotp.com/api/v2/countries?service_id=${serviceId}`,
                { headers: { "x-apikey": apiKey } }
            );
            negara = (res.data?.data || [])
                .find(c => String(c.number_id) === String(numberId));
        }

        if (!negara) {
return bot.editMessageCaption(
    "❌ <b>Negara tidak ditemukan.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] buy_negara_not_found:", err.message);
});
        }

        const providerData = negara.pricelist
            .find(p => String(p.provider_id) === String(providerId));

        if (!providerData) {
return bot.editMessageCaption(
    "❌ <b>Provider tidak ditemukan.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] buy_provider_not_found:", err.message);
});
        }

        // =====================================================
        // Hitung harga
        // =====================================================
        const base = Number(providerData.price) || 0;
        const hargaFinal = base + UNTUNG_NOKOS;
        const priceFormat = `Rp${hargaFinal.toLocaleString("id-ID")}`;

        // =====================================================
        // Simpan cache untuk operator
        // =====================================================
        getUserState(userId).lastBuyData = {
            serviceName,
            negaraName: negara.name,
            priceFormat,
            providerServer: providerData.server_id || "-"
        };

        // =====================================================
        // Buat tombol
        // =====================================================
        const inlineKeyboard = [
            [
                { text: "📡 Pilih Operator", callback_data: `operator_${numberId}_${providerId}_${serviceId}_${negara.iso_code}` }
            ],
            [
                { text: "⬅️ Kembali Ke Harga", callback_data: `country_${serviceId}_${negara.iso_code}_${numberId}` }
            ]
        ];

const caption = `✨ <b>DETAIL LAYANAN PREMIUM</b> ✨

📱 <b>Layanan:</b> ${serviceName}  
🌍 <b>Negara:</b> ${negara.name} (${negara.prefix})  
📦 <b>Provider ID:</b> ${providerId}  
🔧 <b>Server:</b> ${providerData.server_id || "-"}

💰 <b>Harga:</b> ${priceFormat}  
📦 <b>Stok:</b> ${providerData.stock} item

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Tips:</b> Pastikan semua detail sudah sesuai dengan kebutuhan Anda.
⏱️ Stok terbatas – pesan sekarang agar tidak kehabisan!

👇 <b>Klik tombol di bawah untuk melanjutkan:</b>
`;

// =====================================================
// ✔ EDIT FOTO YANG SAMA (TIDAK HAPUS)
// =====================================================
// Guard: Validasi state sebelum edit
const buyPhotoState = getUserState(userId).lastCountryPhoto;
if (!buyPhotoState || !buyPhotoState.messageId) {
  console.warn("[BUY_PHOTO_GUARD] lastCountryPhoto atau messageId tidak tersedia");
  await bot.answerCallbackQuery(callbackQuery.id, 
    "⚠️ Sesi telah kedaluwarsa. Silakan jalankan /start untuk memulai lagi.", true
  ).catch(() => {});
  return;
}

await bot.editMessageMedia(
    {
        type: "photo",
        media: photoThumb,
        caption,
        parse_mode: "HTML"
    },
    {
        chat_id: buyPhotoState.chatId,
        message_id: buyPhotoState.messageId,
        reply_markup: { inline_keyboard: inlineKeyboard }
    }
).catch(err => {
  console.error("[EDIT_MEDIA_ERROR] buy_detail:", err.message);
});

    } catch (err) {
        console.error("❌ Error detail:", err?.response?.data || err.message);
await bot.editMessageCaption(
    "❌ <b>Gagal memuat detail layanan.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] buy_error:", err.message);
});
    }
}
// =====================================================
// 📡 LIST OPERATOR SETELAH PILIH PROVIDER — FINAL V10
// =====================================================
if (data.startsWith("operator_")) {
    const parts = data.split("_");
    const numberId   = parts[1];
    const providerId = parts[2];
    const serviceId  = parts[3];
    const isoCode    = parts[4];

    const axios = require("axios");
    const apiKey = config.RUMAHOTP;

    // =====================================================
    // ✔ UBAH CAPTION MENJADI LOADING (tanpa hapus pesan)
    // =====================================================
    if (getUserState(userId).lastCountryPhoto) {
await bot.editMessageCaption(
    "⏳ <b>Memuat operator yang tersedia...</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(() => {});
    }

    try {
        // 🔥 Ambil cache dari step buy_
        const cached = getUserState(userId).lastBuyData || {};
        const serviceName    = cached.serviceName || "-";
        const negaraName     = cached.negaraName || isoCode.toUpperCase();
        const priceFormat    = cached.priceFormat || "-";
        const providerServer = cached.providerServer || "-";

        // =====================================================
        // AMBIL OPERATOR DARI API
        // =====================================================
        const response = await axios.get(
            `https://www.rumahotp.com/api/v2/operators?country=${encodeURIComponent(negaraName)}&provider_id=${providerId}`,
            { headers: { "x-apikey": apiKey } }
        );

        const operators = response.data?.data || [];

        if (operators.length === 0) {
return bot.editMessageCaption(
    `⚠️ Tidak ada operator tersedia untuk negara <b>${negaraName}</b>.`,
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] operator_not_found:", err.message);
});
        }

        // =====================================================
        // BUAT TOMBOL OPERATOR
        // =====================================================
        const inlineKeyboard = operators.map(op => [
            {
                text: op.name,
                callback_data: `chooseop_${op.id}_${numberId}_${providerId}_${serviceId}_${isoCode}`
            }
        ]);

        inlineKeyboard.push([
            { text: "⬅️ Kembali ke Detail", callback_data: `buy_${numberId}_${providerId}_${serviceId}` }
        ]);

        // =====================================================
        // ✔ UPDATE CAPTION MENJADI LIST OPERATOR
        // =====================================================
const caption = `✨ <b>PILIH OPERATOR PREMIUM</b> ✨

📱 <b>Layanan:</b> ${serviceName}  
🌍 <b>Negara:</b> ${negaraName} (${isoCode.toUpperCase()})  
💠 <b>Provider:</b> ${providerId}  
💵 <b>Harga:</b> ${priceFormat}  
🔧 <b>Server:</b> ${providerServer || "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Pilih Operator yang Anda Inginkan</b>

Setiap operator memiliki kecepatan berbeda untuk mengirimkan OTP. Pilih yang paling sesuai dengan kebutuhan Anda.

👇 <b>Klik operator di bawah untuk melanjutkan:</b>

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

await bot.editMessageCaption(caption, {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: inlineKeyboard }
}).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] operator_list:", err.message);
});

    } catch (err) {
        console.error("❌ ERROR OPERATOR:", err?.response?.data || err.message);

await bot.editMessageCaption(
    "❌ <b>Gagal memuat daftar operator.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] operator_error:", err.message);
});
    }
}
// =====================================================
// 📄 DETAIL SETELAH PILIH OPERATOR — FINAL V10 (Edit Caption Only)
// =====================================================
if (data.startsWith("chooseop_")) {
    const parts = data.split("_");
    const operatorId = parts[1];
    const numberId = parts[2];
    const providerId = parts[3];
    const serviceId = parts[4];
    const isoCode = parts[5];

    const axios = require("axios");
    const apiKey = config.RUMAHOTP;
    const UNTUNG_NOKOS = config.UNTUNG_NOKOS || 0;
    const photoThumb = config.linkthumbnail;

    // =====================================================
    // ✔ LANGSUNG EDIT CAPTION MENJADI LOADING
    // =====================================================
    if (global.lastCountryPhoto) {
await bot.editMessageCaption(
    "⏳ <b>Mengambil detail operator yang dipilih...</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(() => {});
    }

    try {
        // 🔹 Ambil nama service
        let serviceName = "Layanan Tidak Dikenal";
        if (global.cachedServices) {
            const svc = global.cachedServices.find(s => String(s.service_code) === String(serviceId));
            if (svc) serviceName = svc.service_name;
        }

        // 🔹 Ambil data negara
        let negara;
        if (global.cachedCountries && global.cachedCountries[serviceId]) {
            negara = global.cachedCountries[serviceId]
                .find(c => c.iso_code.toLowerCase() === isoCode.toLowerCase());
        }

        if (!negara) {
            const resNeg = await axios.get(
                `https://www.rumahotp.com/api/v2/countries?service_id=${serviceId}`,
                { headers: { "x-apikey": apiKey } }
            );
            negara = (resNeg.data?.data || [])
                .find(c => c.iso_code.toLowerCase() === isoCode.toLowerCase());
        }

        if (!negara) {
return bot.editMessageCaption(
    `❌ Negara <b>${isoCode.toUpperCase()}</b> tidak ditemukan.`,
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] chooseop_negara_not_found:", err.message);
});
        }

        // 🔹 Ambil provider
        const providerData = negara.pricelist
            .find(p => String(p.provider_id) === String(providerId));

        if (!providerData) {
return bot.editMessageCaption(
    "❌ <b>Provider tidak ditemukan untuk negara ini.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] chooseop_provider_not_found:", err.message);
});
        }

        const hargaFinal = (Number(providerData.price) || 0) + UNTUNG_NOKOS;
        const priceFormat = `Rp${hargaFinal.toLocaleString("id-ID")}`;

        // 🔹 Ambil detail operator
        const ops = await axios.get(
            `https://www.rumahotp.com/api/v2/operators?country=${encodeURIComponent(negara.name)}&provider_id=${providerId}`,
            { headers: { "x-apikey": apiKey } }
        );

        const operator = (ops.data?.data || [])
            .find(o => String(o.id) === String(operatorId));

        if (!operator) {
return bot.editMessageCaption(
    "❌ <b>Operator tidak ditemukan.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] chooseop_operator_not_found:", err.message);
});
        }

        // =====================================================
        // ✔ SIAPKAN CAPTION FINAL KONFIRMASI
        // =====================================================
const caption = `✨ <b>KONFIRMASI PEMESANAN NOMOR</b> ✨

📱 <b>Layanan:</b> ${serviceName} (ID ${serviceId})  
🌍 <b>Negara:</b> ${negara.name} (${negara.iso_code.toUpperCase()})  
🏷️ <b>Provider:</b> ${providerId}  
📶 <b>Operator:</b> ${operator.name}  
💵 <b>Harga:</b> ${priceFormat}  
📦 <b>Stok:</b> ${providerData.stock} item

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Verifikasi Detail Pesanan Anda</b>

Pastikan semua detail sudah benar sebelum melanjutkan. Setelah konfirmasi, saldo Anda akan langsung dipotong.

👇 <b>Tekan tombol di bawah untuk melanjutkan:</b>

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

        const inlineKeyboard = [
            [
                {
                    text: "✅ Pesan Nomor Ini",
                    callback_data: `confirm_${numberId}_${providerId}_${serviceId}_${operatorId}_${isoCode}`
                }
            ],
            [
                {
                    text: "⬅️ Kembali ke Operator",
                    callback_data: `operator_${numberId}_${providerId}_${serviceId}_${isoCode}`
                }
            ]
        ];

        // =====================================================
        // ✔ EDIT FOTO SAMA → GANTI CAPTION JADI KONFIRMASI
        // =====================================================
        const chooseOpPhotoState = getUserState(userId).lastCountryPhoto;
        if (!chooseOpPhotoState || !chooseOpPhotoState.messageId) {
          console.warn("[CHOOSEOP_PHOTO_GUARD] lastCountryPhoto atau messageId tidak tersedia");
          await bot.answerCallbackQuery(callbackQuery.id, 
            "⚠️ Sesi telah kedaluwarsa. Silakan jalankan /start untuk memulai lagi.", true
          ).catch(() => {});
          return;
        }
        
        await bot.editMessageMedia(
            {
                type: "photo",
                media: photoThumb,
                caption,
                parse_mode: "HTML"
            },
            {
                chat_id: chooseOpPhotoState.chatId,
                message_id: chooseOpPhotoState.messageId,
                reply_markup: { inline_keyboard: inlineKeyboard }
            }
        ).catch(err => {
          console.error("[EDIT_MEDIA_ERROR] chooseop_confirm:", err.message);
        });

    } catch (err) {
        console.error("❌ ERROR chooseop:", err?.response?.data || err.message);

await bot.editMessageCaption(
    "❌ <b>Gagal memuat detail operator.</b>",
    {
        chat_id: getUserState(userId).lastCountryPhoto?.chatId,
        message_id: getUserState(userId).lastCountryPhoto?.messageId,
        parse_mode: "HTML"
    }
).catch(err => {
  console.error("[EDIT_CAPTION_ERROR] chooseop_error:", err.message);
});
    }
}
// =====================================================
// ✅ PROSES PESAN NOMOR — FIX: EDIT CAPTION LOADING (Tanpa Hapus Foto)
// =====================================================
if (data.startsWith("confirm_")) {
  const parts = data.split("_");
  const numberId = parts[1];
  const providerId = parts[2];
  const serviceId = parts[3];
  const operatorId = parts[4];
  const isoCode = parts[5];

  const fs = require("fs");
  const path = require("path");
  const axios = require("axios");
  const saldoPath = path.join(__dirname, "./database/saldoOtp.json");

  const apiKey = config.RUMAHOTP;
  const UNTUNG_NOKOS = config.UNTUNG_NOKOS || 0;

  // 🔒 DEKLARASIKAN userId SEBELUM DIPAKAI
  // userId sudah tersedia dari outer callback_query scope
  // Tapi kita akses langsung dari callbackQuery untuk explicitness
  const userId = callbackQuery.from?.id;
  
  if (!userId) {
    console.error("[CONFIRM_GUARD] userId tidak valid");
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "⚠️ User tidak valid",
      show_alert: true
    }).catch(() => {});
    return;
  }

let chatId =
  callbackQuery?.message?.chat?.id ||         // Dari callbackQuery
  msg?.chat?.id ||                             // Fallback dari msg (jika ada)
  global.lastCountryPhoto?.chatId ||           // Fallback global foto terakhir
  global.lastChatId ||                         // Backup tambahan
  null;

if (!chatId) return;

// ============== FIX EDIT CAPTION SAJA ==============
await bot.editMessageCaption(
  "⏳ <b>Memproses pesanan Anda...</b>\n━━━━━━━━━━━━━━━━━━━━\nMohon tunggu sebentar.",
  {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML"
  }
).catch(() => {});
// ===================================================

  // =====================================================
  // ⚠️ STOP — JANGAN DELETE FOTO KONFIRMASI LAGI
  // ❌ (Kode deleteMessage dihapus total)
  // =====================================================

let userSaldo = 0;
let saldoData = {};

try {
    if (!fs.existsSync(saldoPath)) fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
    saldoData = JSON.parse(fs.readFileSync(saldoPath));
    userSaldo = saldoData[userId] || 0;

    // ... dst (semua tetap seperti kode kamu)

    // ===================================================
    // 💰 Ambil harga provider dari CACHE negara (tanpa request ulang)
    // ===================================================
    let hargaFinal = 0;
    let providerData = null;

    try {
      // 🔹 Cek cache global hasil dari menu "Pilih Negara"
      if (global.cachedCountries && global.cachedCountries[serviceId]) {
        const negaraCache = global.cachedCountries[serviceId].find(
          c => c.iso_code.toLowerCase() === isoCode.toLowerCase()
        );
        providerData = negaraCache?.pricelist?.find(
          p => String(p.provider_id) === String(providerId)
        );
      }

      // 🔹 Jika belum ada di cache, fallback ke API (backup)
      if (!providerData) {
        const resNeg = await axios.get(
          `https://www.rumahotp.com/api/v2/countries?service_id=${serviceId}`,
          { headers: { "x-apikey": apiKey, Accept: "application/json" } }
        );
        const negara = (resNeg.data?.data || []).find(
          c => c.iso_code.toLowerCase() === isoCode.toLowerCase()
        );
        providerData = negara?.pricelist?.find(
          p => String(p.provider_id) === String(providerId)
        );
      }

      hargaFinal = parseInt(providerData?.price || 0, 10) + UNTUNG_NOKOS;
    } catch (e) {
      console.error("❌ Gagal ambil harga provider dari cache/API:", e.message);
      hargaFinal = 0;
    }

    const priceFormatted = `Rp${hargaFinal.toLocaleString("id-ID")}`;
    const saldoFormatted = `Rp${userSaldo.toLocaleString("id-ID")}`;

    // ===================================================
    // 💳 Cek saldo user
    // ===================================================
    if (userSaldo < hargaFinal) {
await bot.editMessageCaption(
  `❌ <b>SALDO TIDAK CUKUP!</b>

Sisa Saldo: <b>${saldoFormatted}</b>
Harga Layanan: <b>${priceFormatted}</b>

━━━━━━━━━━━━━━━━━━━━
💳 Silakan lakukan top up saldo terlebih dahulu untuk melanjutkan pemesanan.`,
  {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML"
  }
).catch(() => {});

return;
    }

    // ===================================================
    // 🛒 PANGGIL API DULU (SEBELUM DEDUCT SALDO)
    // ===================================================
await bot.editMessageCaption(
  "🛒 <b>Saldo cukup!</b>\nMemproses pemesanan nomor Anda...",
  {
    chat_id: getUserState(userId).lastCountryPhoto?.chatId,
    message_id: getUserState(userId).lastCountryPhoto?.messageId,
    parse_mode: "HTML"
  }
).catch(() => {});

    const resOrder = await axios.get(
      `https://www.rumahotp.com/api/v2/orders?number_id=${numberId}&provider_id=${providerId}&operator_id=${operatorId}`,
      { headers: { "x-apikey": apiKey, Accept: "application/json" } }
    );

    const dataOrder = resOrder.data?.data;
    if (!dataOrder || !resOrder.data?.success) {
      console.error(`[ORDER_FLOW_FAILED] API returned invalid data for user ${userId}`);
      throw new Error("Order gagal, tidak ada data dari API.");
    }

    // ===================================================
    // ✅ API VALID → BARU DEDUCT SALDO (SETELAH VALIDASI API)
    // ===================================================

    // 🔒 GENERATE DEBIT PROOF (waktu debit = bukti nyata)
    // Format: DEBIT-TIMESTAMP-HASH
    const debitTimestamp = Date.now();
    const debitHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const debitTxnId = `DEBIT-${debitTimestamp}-${debitHash}`;

    // ✅ DEBIT SALDO HANYA SEKARANG (SETELAH API SUKSES)
    saldoData[userId] = userSaldo - hargaFinal;
    fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));

    const finalPrice = hargaFinal;
    const priceFormattedFinal = `Rp${finalPrice.toLocaleString("id-ID")}`;
    const saldoFormattedAfter = `Rp${saldoData[userId].toLocaleString("id-ID")}`;

const caption = `✅ <b>Pesanan Nomor Virtual Berhasil</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 <b>Detail Pesanan</b>

Layanan: <code>${dataOrder.service}</code>
Negara: <code>${dataOrder.country}</code>
Operator: <code>${dataOrder.operator}</code>

🔑 Order ID: <code>${dataOrder.order_id}</code>
📞 Nomor: <code>${dataOrder.phone_number}</code>
💰 Harga: <b>${priceFormattedFinal}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ <b>Status</b>

Kondisi: ${dataOrder.status || "Menunggu OTP"}
Kode SMS: Belum diterima
Batas waktu: ${dataOrder.expires_in_minute} menit

💵 Saldo dipotong: <b>${priceFormattedFinal}</b>
📊 Sisa saldo: <b>${saldoFormattedAfter}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>📌 Langkah Berikutnya</b>

1️⃣ Tekan tombol Cek Status di bawah
2️⃣ Tunggu kode OTP masuk (${dataOrder.expires_in_minute} menit)
3️⃣ Gunakan kode untuk verifikasi

⚠️ Pesanan otomatis dibatalkan jika OTP tidak masuk.

👑 RajaOTP • Secure OTP Automation
`;

    const inlineKeyboard = [
      [{ text: "📩 Cek Status / Kode SMS", callback_data: `checksms_${dataOrder.order_id}` }],
      [{ text: "❌ Batalkan Pesanan Ini", callback_data: `cancelorder_${dataOrder.order_id}` }]
    ];

// Guard: Validasi state sebelum edit media
const confirmPhotoState = getUserState(userId).lastCountryPhoto;
if (!confirmPhotoState || !confirmPhotoState.messageId) {
  console.warn("[CONFIRM_PHOTO_GUARD] lastCountryPhoto atau messageId tidak tersedia");
  await bot.answerCallbackQuery(callbackQuery.id, 
    "⚠️ Sesi telah kedaluwarsa. Silakan jalankan /start untuk memulai lagi.", true
  ).catch(() => {});
  return;
}

await bot.editMessageMedia(
  {
    type: "photo",
    media: config.linkthumbnail,
    caption,
    parse_mode: "HTML"
  },
  {
    chat_id: confirmPhotoState.chatId,
    message_id: confirmPhotoState.messageId,
    reply_markup: { inline_keyboard: inlineKeyboard }
  }
).catch(err => {
  console.error("[EDIT_MEDIA_ERROR] confirm_success:", err.message);
});

// TETAP SIMPAN STATE BERBASIS USERID (TIDAK UBAH)
// Jangan assign ke global.lastCountryPhoto lagi

    // ===================================================
    // 💾 Simpan order aktif ke cache (DENGAN DEBIT PROOF)
    // ===================================================
    if (!global.activeOrders) global.activeOrders = {};
    global.activeOrders[dataOrder.order_id] = {
      userId,
      messageId: getUserState(userId).lastCountryPhoto?.messageId,
      hargaTotal: finalPrice,
      createdAt: Date.now(),
      operator: dataOrder.operator,
      // 🔒 DEBIT PROOF (sumber kebenaran kedua)
      deducted: true,  // Bendera: saldo sudah dipotong
      debit_txn_id: debitTxnId,  // ID transaksi debit (WAJIB)
      debit_timestamp: debitTimestamp,  // Kapan debit terjadi
      // 🔒 STATUS REFUND EKSPLISIT (ANTI DOUBLE REFUND)
      status: "pending",
      refund_status: "none",  // "none" | "refunded"
      refundLock: false
    };

    // ===================================================
    // 🗄️ SIMPAN JUGA KE PERSISTENT STORAGE (JSON)
    // ===================================================
    try {
      const nokosPath = path.join(__dirname, "./database/nokosData.json");
      let nokosData = [];
      if (fs.existsSync(nokosPath)) {
        try {
          nokosData = JSON.parse(fs.readFileSync(nokosPath, "utf-8"));
        } catch {
          nokosData = [];
        }
      }
      if (!Array.isArray(nokosData)) nokosData = [];

      // Tambah order baru
      nokosData.push({
        order_id: dataOrder.order_id,
        userId: userId,
        service: dataOrder.service,
        country: dataOrder.country,
        operator: dataOrder.operator,
        phone_number: dataOrder.phone_number,
        hargaTotal: finalPrice,
        status: "pending",
        deducted: true,           // ✅ FLAG: saldo sudah dipotong
        refundStatus: "NONE",     // ✅ FLAG: belum di-refund
        debit_txn_id: debitTxnId,
        debit_timestamp: debitTimestamp,
        created_at: new Date().toISOString(),
        expires_in_minute: dataOrder.expires_in_minute || 15
      });

      fs.writeFileSync(nokosPath, JSON.stringify(nokosData, null, 2));
    } catch (err) {
      console.error("[ORDER_STORAGE_ERROR]", err.message);
    }

// ===================================================
// ⏱️ AUTO CANCEL & REFUND JIKA OTP TIDAK MASUK DALAM 15 MENIT
// ===================================================
setTimeout(async () => {
  const orderInfo = global.activeOrders?.[dataOrder.order_id];
  if (!orderInfo) return; // Sudah selesai atau dibatalkan manual

  try {
    const resCheck = await axios.get(
      `https://www.rumahotp.com/api/v1/orders/get_status?order_id=${dataOrder.order_id}`,
      { headers: { "x-apikey": apiKey } }
    );

    const d = resCheck.data?.data;
    if (!d || d.status === "completed" || (d.otp_code && d.otp_code !== "-")) return;

    // Belum dapat OTP -> cancel dan refund IDEMPOTENSI
    await axios.get(
      `https://www.rumahotp.com/api/v1/orders/set_status?order_id=${dataOrder.order_id}&status=cancel`,
      { headers: { "x-apikey": apiKey } }
    );

    // Update status order
    orderInfo.status = "expired";
    
    // 🔒 DETEKSI DEBIT NYATA (bukan hanya flag)
    // Refund jika:
    // 1. order.deducted = true, ATAU
    // 2. order.debit_txn_id ada (proof of debit)
    const wasDebited = orderInfo.deducted === true || Boolean(orderInfo.debit_txn_id);

    if (!wasDebited) {
      console.warn(`[AUTO_CANCEL_SKIP] Order ${dataOrder.order_id} no debit detected, skip refund`);
      delete global.activeOrders[dataOrder.order_id];
      return; // No debit = nothing to refund
    }

    // 🔒 USE REFUND LOCKER (idempotent, single source of truth)
    const refundResult = await RefundLocker.refundOrder(
      dataOrder.order_id,
      orderInfo.userId,
      orderInfo.hargaTotal,
      "expired"
    );

    if (refundResult.skipped && refundResult.alreadyRefunded) {
      console.warn(`[AUTO_CANCEL_SKIP] Order ${dataOrder.order_id} already refunded`);
      // Already refunded, just clean up
      delete global.activeOrders[dataOrder.order_id];
      return;
    }

    if (!refundResult.success && !refundResult.skipped) {
      console.error("[AUTO_CANCEL_REFUND_FAILED]", refundResult.error);
      // Real error, will retry on next scheduler cycle
      return;
    }

    const saldoData2 = JSON.parse(fs.readFileSync(saldoPath, "utf-8"));
    const refundFormatted = `Rp${orderInfo.hargaTotal.toLocaleString("id-ID")}`;
    const saldoFormattedNow = `Rp${saldoData2[orderInfo.userId].toLocaleString("id-ID")}`;

    try {
      await bot.deleteMessage(orderInfo.userId, orderInfo.messageId);
    } catch {}

    await bot.sendMessage(
      orderInfo.userId,
      `⌛ <b>Pesanan Dibatalkan Otomatis (${dataOrder.expires_in_minute} Menit Tanpa OTP)</b>

🆔 <b>Order ID:</b> <code>${dataOrder.order_id}</code>
💸 <b>Refund:</b> ${refundFormatted}
💰 <b>Saldo Saat Ini:</b> ${saldoFormattedNow}

Pesanan otomatis expired & saldo telah dikembalikan (Safe Idempotensi).`,
      { parse_mode: "HTML" }
    );

    // ✅ SIMPAN EXPIRED ORDER KE TRANSAKSI.JSON
    saveTransaction({
      txid: null,
      userId: orderInfo.userId,
      customerId: orderInfo.userId,
      service: dataOrder.service || "OTP Service",
      country: dataOrder.country || "Unknown",
      price: orderInfo.hargaTotal,
      status: "expired",
      created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ")
    });

    delete global.activeOrders[dataOrder.order_id];
  } catch (err) {
    console.error("❌ Error auto cancel:", err?.response?.data || err.message);
  }
}, dataOrder.expires_in_minute * 60 * 1000);

} catch (err) {
  console.error(`[ORDER_FLOW_API_FAILED] API error for user ${userId}:`, err?.response?.data || err.message);

  // ==========================
  // 🔍 DETEKSI ALASAN GAGAL
  // ==========================
  let reason = "Tidak diketahui";

  const msgErr =
    err?.response?.data?.message ||
    err?.response?.data?.msg ||
    err?.message ||
    "Gagal memesan nomor.";

  if (/stock|habis|no number|not available/i.test(msgErr)) reason = "STOK HABIS";
  else if (/provider/i.test(msgErr)) reason = "PROVIDER BERMASALAH";
  else if (/price|harga 0/i.test(msgErr)) reason = "HARGA TIDAK VALID (0)";
  else if (/limit|over/i.test(msgErr)) reason = "LIMIT PROVIDER";
  else reason = msgErr; // fallback

  // ==========================
  // 🛡️ KEAMANAN: API GAGAL = SALDO TIDAK DIPOTONG
  // ==========================
  // ✅ PENTING: Dengan flow API-FIRST (sebelum deduct), jika API gagal
  //    maka saldo USER PASTI TIDAK DIPOTONG sama sekali.
  //    Oleh karena itu, JANGAN ada refund di sini.
  //
  // ❌ JANGAN REFUND UNTUK API GAGAL
  // Refund hanya untuk:
  // - Cancel user
  // - Timeout/Expired
  // - API sukses tapi OTP tidak masuk
  
  // ==========================
  // 💬 KIRIM ERROR PESAN (TANPA REFUND)
  // ==========================
  await bot.editMessageCaption(
    `❌ <b>Gagal Memesan Nomor</b>\n` +
      `Alasan: <b>${reason}</b>\n\n` +
      `💳 <b>Saldo Anda AMAN</b>\n` +
      `Saldo tidak dipotong karena order gagal di API.`,
    {
      chat_id: getUserState(userId).lastCountryPhoto?.chatId,
      message_id: getUserState(userId).lastCountryPhoto?.messageId,
      parse_mode: "HTML"
    }
  ).catch(() => {});

  // ✅ SIMPAN FAILED ORDER KE TRANSAKSI.JSON (untuk audit)
  saveTransaction({
    txid: null,
    userId: userId,
    customerId: userId,
    service: "OTP Service (API Failed)",
    country: "Unknown",
    price: 0,  // No deduction happened
    status: "api_failed",
    created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ")
  });
}
}
// ==============================================
// ✅ CEK STATUS / KODE SMS — (CheckSMS Final v7 Sync RumahOTP)
// ==============================================
if (data.startsWith("checksms_")) {
  const orderId = data.split("_")[1];
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");
  const apiKey = config.RUMAHOTP;
  const { from } = callbackQuery;
  const userId = from.id;
  const userName = from.first_name || "Anonymous";
  const username = from.username || "Anonymous";
  const ownerId = String(config.OWNER_ID);
  const channellog = config.idchannel;
  const nokosPath = "./database/nokosData.json";
const botInfo = await bot.getMe();
const botUsername = botInfo.username
  ? `@${botInfo.username}`
  : "AutoBuyNokosBot";
  
  // 🔒 LOAD ORDER: Coba dari cache dulu, kemudian fallback ke JSON storage
  let cachedOrder = global.activeOrders?.[orderId];
  if (!cachedOrder) {
    try {
      if (fs.existsSync(nokosPath)) {
        const nokosData = JSON.parse(fs.readFileSync(nokosPath, "utf-8"));
        const orderFromStorage = Array.isArray(nokosData) 
          ? nokosData.find(o => o.order_id === orderId)
          : null;
        
        if (orderFromStorage) {
          cachedOrder = {
            operator: orderFromStorage.operator || "Unknown",
            hargaTotal: orderFromStorage.hargaTotal || 0,
            hargaProvider: orderFromStorage.hargaProvider || 0
          };
        }
      }
    } catch (err) {
      console.warn(`[CHECKSMS] Error loading from storage:`, err.message);
    }
  }
  
  if (!cachedOrder) {
    return bot.sendMessage(chatId, `⚠️ Order ID \`${orderId}\` tidak ditemukan atau sudah dibatalkan.`, { parse_mode: "Markdown" });
  }
  const loadingMsg = await bot.sendMessage(chatId, "📡 Mengecek status SMS OTP...", { parse_mode: "HTML" });

  try {
    const res = await axios.get(`https://www.rumahotp.com/api/v1/orders/get_status?order_id=${orderId}`, {
      headers: { "x-apikey": apiKey, Accept: "application/json" }
    });

    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    const d = res.data?.data;
    if (!d) return bot.sendMessage(chatId, "❌ Tidak ada data status dari server.");

    const otp = d.otp_code && d.otp_code !== "-" ? d.otp_code : "Belum masuk";

  if (otp === "Belum masuk") {
  const statusText = `📩 <b>STATUS TERKINI PESANAN OTP</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 <b>Layanan:</b> ${d.service}
🌍 <b>Negara:</b> ${d.country}
📶 <b>Operator:</b> ${cachedOrder.operator}

🆔 <b>Order ID:</b> <code>${d.order_id}</code>
📞 <b>Nomor:</b> <code>${d.phone_number}</code>
💰 <b>Harga:</b> Rp${cachedOrder.hargaTotal.toLocaleString("id-ID")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ <b>Status Pengiriman:</b> ${d.status}
🔐 <b>SMS Code:</b> <code>${otp}</code>

📌 <b>Catatan:</b>
Kode OTP belum diterima. Silakan tunggu atau refresh untuk update terbaru. Pesanan akan otomatis dibatalkan jika OTP tidak masuk dalam batas waktu.

👇 <b>Klik tombol di bawah untuk refresh:</b>
`;

  return bot.sendMessage(chatId, statusText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Refresh Status OTP", callback_data: `checksms_${orderId}` }]
      ]
    }
  });
}

    // ✅ OTP SUDAH MASUK
    const now = new Date();
    const tanggal = now.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
// ===============================
// 💰 SIMPAN DATA MARGIN — BUY NOKOS (OTP SUCCESS)
// ===============================
try {
  let marginDb = [];
  if (fs.existsSync(marginNokosPath)) {
    try {
      marginDb = JSON.parse(fs.readFileSync(marginNokosPath, "utf-8"));
    } catch {
      marginDb = [];
    }
  }

  // ===== HITUNG MARGIN =====
  const hargaJual = cachedOrder.hargaTotal;        // harga user bayar
  const hargaProvider = cachedOrder.hargaProvider || 0; // harga beli ke provider
  const marginValue = hargaJual - hargaProvider;

  marginDb.push({
    type: "buy_nokos",
    trx_id: d.order_id,
    user: {
      id: userId,
      name: userName,
      username
    },
    service: d.service,
    country: d.country,
    operator: cachedOrder.operator,
    phone_number: d.phone_number,
    otp: otp,
    amount_user: hargaJual,
    amount_provider: hargaProvider,
    margin: marginValue > 0 ? marginValue : 0,
    method: "SALDO",
    provider: "RumahOTP",
    status: "success",
    created_at: cachedOrder.created_at || new Date().toISOString(),
    success_at: new Date().toISOString(),
    source: "buy",
    meta: {
      note: "OTP berhasil diterima",
      bot: botUsername
    }
  });

  fs.writeFileSync(marginNokosPath, JSON.stringify(marginDb, null, 2));
} catch (err) {
  console.error("❌ Gagal simpan margin BUY NOKOS:", err.message);
}
    const trxData = {
      customerName: userName,
      customerUsername: username,
      customerId: userId,
      service: d.service,
      country: d.country,
      operator: cachedOrder.operator,
      number: d.phone_number,
      otp: otp,
      price: `Rp${cachedOrder.hargaTotal.toLocaleString("id-ID")}`,
      orderId: d.order_id,
      date: tanggal
    };

    let db = [];
    if (fs.existsSync(nokosPath)) {
      try { db = JSON.parse(fs.readFileSync(nokosPath, "utf-8")); } catch { db = []; }
    }
    db.push(trxData);
    fs.writeFileSync(nokosPath, JSON.stringify(db, null, 2));

    // ✅ SIMPAN KE TRANSAKSI.JSON (FITUR HISTORY)
    saveTransaction({
      txid: null, // akan di-generate oleh saveTransaction
      userId: userId,
      customerId: userId,
      service: d.service,
      country: d.country,
      price: parseInt(cachedOrder.hargaTotal),
      status: "success",
      created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ")
    });

    try { await bot.deleteMessage(chatId, cachedOrder.messageId); } catch {}
    delete global.activeOrders[orderId];

// ========================
// 🎁 BONUS POINT +50 SAAT OTP MASUK — FORMAT BARU
// ========================
try {
  const pointPath = "./database/pointSaldo.json";
  let pointDb = {};

  if (fs.existsSync(pointPath)) {
    try {
      pointDb = JSON.parse(fs.readFileSync(pointPath, "utf-8"));
    } catch {
      pointDb = {};
    }
  }

  // Jika user belum ada → buat struktur default
  if (!pointDb[userId]) {
    pointDb[userId] = {
      point_total: 0,
      convert_total: 0,
      history: []
    };
  }

  // Tambah point
  pointDb[userId].point_total += 50;

  // Tambah ke history
  pointDb[userId].history.push({
    tipe: "Bonus Point",
    jumlah: 50,
    tanggal: new Date().toISOString(),
    keterangan: "Bonus Point Karena Sudah Mendapat OTP masuk"
  });

  // Simpan
  fs.writeFileSync(pointPath, JSON.stringify(pointDb, null, 2));

  // Notif ke user
  await bot.sendMessage(
    chatId,
    `🎁 *Bonus Point +50!*\n\nTotal poin kamu sekarang: *${pointDb[userId].point_total}*`,
    { parse_mode: "Markdown" }
  );

} catch (err) {
  console.error("Gagal menambah point:", err.message);
}

    const notifText = `
🎉 <b>TRANSAKSI OTP BERHASIL!</b> 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>DETAIL TRANSAKSI</b>

📱 <b>Layanan:</b> ${trxData.service}
🌍 <b>Negara:</b> ${trxData.country}
📶 <b>Operator:</b> ${trxData.operator}

🆔 <b>Order ID:</b> <code>${trxData.orderId}</code>
📞 <b>Nomor:</b> <code>${trxData.number}</code>
💰 <b>Harga:</b> ${trxData.price}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 <b>KOD OTP</b>

<code>${trxData.otp}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>WAKTU TRANSAKSI</b>

📅 ${trxData.date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 <b>BONUS POINT +50!</b>

Anda mendapatkan 50 point dari transaksi ini. Kumpulkan point untuk ditukar dengan saldo!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 <b>RajaOTP • Secure OTP Automation</b>

Terima kasih telah mempercayai layanan kami. Semoga verifikasi Anda lancar! 🙏
`;

await bot.sendMessage(chatId, notifText, {
  parse_mode: "HTML"
});

// ======================
// 📢 NOTIF KE CHANNEL & OWNER (FINAL FIX)
// ======================

// Kirim ke owner (full detail)
if (ownerId) {
  await bot.sendMessage(
    ownerId,
    `
🔔 <b>Transaksi Baru:</b>

🎉 <b>TRANSAKSI BERHASIL!</b> 🎉

📱 <b>Layanan:</b> ${trxData.service}
🌍 <b>Negara:</b> ${trxData.country}
📶 <b>Operator:</b> ${trxData.operator}

🆔 <b>Order ID:</b> <code>${trxData.orderId}</code>
📞 <b>Nomor:</b> <code>${trxData.number}</code>
🔐 <b>Kode OTP:</b> <code>${trxData.otp}</code>
💰 <b>Harga:</b> ${trxData.price}

📆 <b>Tanggal:</b> ${trxData.date}

🟢 <b>Status:</b> OTP diterima & transaksi selesai

👤 <b>Pembeli:</b>
• <b>Nama:</b> ${userName}
• <b>Username:</b> @${username}
• <b>ID Telegram:</b> <code>${userId}</code>

🤖 <b>Sistem Auto 24/7</b>
✅ Proses cepat & aman
✅ SMS langsung masuk
✅ Refund otomatis jika gagal
📞 Order sekarang juga!
`,
    { parse_mode: "HTML" }
  ).catch(() => {});
}

// ======================
// MASKING UNTUK CHANNEL
// ======================
if (channellog && channellog !== "" && channellog !== "0") {

  const number = trxData.number || "";
  const cleanNumber = number.replace(/\D/g, "");
  const phoneMasked =
    cleanNumber.length > 4
      ? `${cleanNumber.slice(0, 2)}*******${cleanNumber.slice(-2)}`
      : `${cleanNumber.slice(0, 1)}***`;

  const otp = trxData.otp || "";
  const cleanOtp = otp.replace(/\D/g, "");
  const otpMasked =
    cleanOtp.length > 3
      ? `${cleanOtp.slice(0, 2)}***${cleanOtp.slice(-1)}`
      : `***`;

const chNotif = `
📢 <b>Transaksi OTP Selesai</b>

📱 <b>Layanan:</b> ${trxData.service}
🌍 <b>Negara:</b> ${trxData.country}
📶 <b>Operator:</b> ${trxData.operator}

🆔 <b>Order ID:</b> ${trxData.orderId}
📞 <b>Nomor:</b> <code>+${phoneMasked}</code>
🔐 <b>Kode OTP:</b> <code>${otpMasked}</code>
💰 <b>Harga:</b> ${trxData.price}

📆 <b>Tanggal:</b> ${trxData.date}

👤 <b>Pembeli:</b>
• <b>Nama:</b> ${userName}
• <b>Username:</b> @${username}
• <b>ID Telegram:</b> <code>${userId}</code>

🤖 <b>Sistem Auto 24/7</b>
✅ Proses cepat & aman
✅ SMS langsung masuk
✅ Refund otomatis jika gagal
📞 Order sekarang juga!
`;

  // Kirim ke channel — anti error
  await bot.sendMessage(channellog, chNotif, { parse_mode: "HTML" })
    .catch(err => console.error("Gagal kirim ke channel:", err.message));
}
  } catch (err) {
    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    console.error("❌ Error cek OTP:", err?.response?.data || err.message);
    await bot.sendMessage(chatId, "❌ Terjadi kesalahan saat cek OTP.", { parse_mode: "HTML" });
  }
}

// ==============================================
// ❌ BATALKAN PESANAN + REFUND + WAKTU REALTIME — V12.1 FINAL FIX
// ==============================================
if (data.startsWith("cancelorder_")) {
  const orderId = data.split("_")[1];
  const axios = require("axios");
  const fs = require("fs");
  const path = require("path");

  const apiKey = config.RUMAHOTP;
  const saldoPath = path.join(__dirname, "./database/saldoOtp.json");
  const nokosPath = path.join(__dirname, "./database/nokosData.json");

  // 🔒 LOAD ORDER: Try cache first, then JSON storage
  let orderInfo = global.activeOrders?.[orderId];
  if (!orderInfo) {
    try {
      if (fs.existsSync(nokosPath)) {
        const nokosData = JSON.parse(fs.readFileSync(nokosPath, "utf-8"));
        const orderFromStorage = Array.isArray(nokosData) 
          ? nokosData.find(o => o.order_id === orderId)
          : null;
        
        if (orderFromStorage) {
          orderInfo = {
            userId: orderFromStorage.userId,
            messageId: null,
            hargaTotal: orderFromStorage.hargaTotal || 0,
            createdAt: new Date(orderFromStorage.created_at).getTime() || Date.now(),
            operator: orderFromStorage.operator || "Unknown",
            deducted: orderFromStorage.deducted === true,
            debit_txn_id: orderFromStorage.debit_txn_id,
            status: "pending",
            refund_status: orderFromStorage.refundStatus || "none"
          };
        }
      }
    } catch (err) {
      console.warn(`[CANCEL] Error loading from storage:`, err.message);
    }
  }

  if (!orderInfo) {
return bot.sendMessage(
  chatId,
  "⚠️ <b>Data pesanan tidak ditemukan atau sudah kadaluarsa.</b>",
  { parse_mode: "HTML" }
);
  }

  const cooldown = 5 * 60 * 1000; // 5 menit
  const cancelableAt = orderInfo.createdAt + cooldown;
  const now = Date.now();

  // 🔹 Tunda pembatalan kalau belum 5 menit
  if (now < cancelableAt) {
    // 💡 Format waktu realtime Indonesia (WIB)
    const waktuBisaCancel = new Date(cancelableAt)
      .toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");

return bot.sendMessage(
  chatId,
  `❌ Anda belum bisa membatalkan pesanan ini.\n\n🆔 <b>Order ID:</b> <code>${orderId}</code>\n🕒 <b>Waktu Pembatalan:</b> ${waktuBisaCancel}\n\nSilakan tunggu hingga waktu di atas.`,
  { parse_mode: "HTML" }
);
  }

  // 🔹 Kirim pesan loading
const loadingMsg = await bot.sendMessage(
  chatId,
  "🗑️ Membatalkan pesanan...",
  { parse_mode: "HTML" }
);

  try {
    // 🔹 Batalkan pesanan di server RumahOTP
    const response = await axios.get(
      `https://www.rumahotp.com/api/v1/orders/set_status?order_id=${orderId}&status=cancel`,
      { headers: { "x-apikey": apiKey, Accept: "application/json" } }
    );

    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});

    if (response.data?.success) {
      // ✅ Hapus pesan order utama
      if (orderInfo.messageId) {
        await bot.deleteMessage(chatId, orderInfo.messageId).catch(() => {});
      }

      // 🔒 UPDATE STATUS (mark as cancelled, NOT refund yet)
      orderInfo.status = "cancelled";
      
      // 🔒 DETEKSI DEBIT NYATA (bukan hanya flag)
      // Refund jika:
      // 1. order.deducted = true, ATAU
      // 2. order.debit_txn_id ada (proof of debit)
      const wasDebited = orderInfo.deducted === true || Boolean(orderInfo.debit_txn_id);

      if (!wasDebited) {
        console.warn(`[CANCEL_REFUND_SKIP] Order ${orderId} no debit detected, skip refund`);
        // No debit detected = no refund needed
      } else {
        // 🔒 USE REFUND LOCKER (idempotent, single source of truth)
        const refundResult = await RefundLocker.refundOrder(
          orderId,
          orderInfo.userId,
          orderInfo.hargaTotal,
          "cancelled"
        );

        if (refundResult.skipped && refundResult.alreadyRefunded) {
          console.warn(`[CANCEL_REFUND_SKIP] Order ${orderId} already refunded`);
          // Already refunded, just show success
        } else if (!refundResult.success && !refundResult.skipped) {
          console.error("[CANCEL_REFUND_FAILED]", refundResult.error);
          await bot.sendMessage(
            chatId,
            `⚠️ <b>Pesanan dibatalkan, tapi refund gagal!</b>\n\nSilakan hubungi admin.`,
            { parse_mode: "HTML" }
          );
          return; // Refund failed, don't continue
        }
      }

      // Baca saldo terbaru
      let saldoData = {};
      if (fs.existsSync(saldoPath)) {
        saldoData = JSON.parse(fs.readFileSync(saldoPath));
      }

      const userId = orderInfo.userId;
      const saldoFormatted = `Rp${(saldoData[userId] || 0).toLocaleString("id-ID")}`;
      const refundFormatted = `Rp${orderInfo.hargaTotal.toLocaleString("id-ID")}`;

      await bot.sendMessage(
        chatId,
        `✅ <b>Pesanan Berhasil Dibatalkan!</b>\n\n🆔 <b>Order ID:</b> ${orderId}\n💸 <b>Refund:</b> ${refundFormatted}\n💰 <b>Saldo Terbaru:</b> ${saldoFormatted}\n\nPesanan telah dibatalkan & saldo otomatis dikembalikan (Safe Idempotensi).`,
        { parse_mode: "HTML" }
      );

      // ✅ SIMPAN PEMBATALAN KE TRANSAKSI.JSON
      saveTransaction({
        txid: null,
        userId: userId,
        customerId: userId,
        service: "OTP Service (Cancelled)",
        country: "Unknown",
        price: orderInfo.hargaTotal,
        status: "cancelled",
        created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace("T", " ")
      });

      delete global.activeOrders[orderId];
    } else {
await bot.sendMessage(
  chatId,
  `❌ <b>Gagal membatalkan pesanan!</b>\n🧩 ${response.data?.message || "Tidak ada pesan dari API."}`,
  { parse_mode: "HTML" }
);
    }
  } catch (err) {
    console.error("❌ Error cancelorder:", err?.response?.data || err.message);
    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, "❌ Terjadi kesalahan saat membatalkan pesanan.", {
      parse_mode: "HTML",
    });
  }
}
// ===============================
// 👤 PROFILE MENU (Owner + User)
// ===============================
if (data === "profile") {
  await bot.answerCallbackQuery(callbackQuery.id, { text: "Loading profile..." });

  const fs = require("fs");
  const axios = require("axios");
  const from = callbackQuery.from;
  
  if (!from) {
    console.error("[PROFILE_GUARD] from is undefined in callbackQuery");
    return;
  }
  
  const saldoFile = "./database/saldoOtp.json";
  const depositPath = "./database/deposit.json";
  const orderPath = "./database/nokosData.json";
  const pointPath = "./database/pointSaldo.json";
  const joinDateFile = "./database/joinDate.json";

  let saldoUser = 0;
  let saldoApiFormat = null;
  let apiStatus = null;
  let name = from.first_name || "No Name";
  let username = from.username ? `@${from.username}` : "-";
  const nowTime = require("moment-timezone").tz("Asia/Jakarta").format("HH.mm.ss, DD/MM/YYYY");
  const userId = from.id;
  const ownerId = String(config.OWNER_ID);

  // 🔰 Ambil saldo bot
  if (fs.existsSync(saldoFile)) {
    try {
      const saldoData = JSON.parse(fs.readFileSync(saldoFile));
      saldoUser = saldoData[userId] || 0;
    } catch {}
  }
  const saldoLocalFormat = saldoUser.toLocaleString("id-ID");

  // 🔰 Ambil saldo website (hanya untuk OWNER)
  if (String(userId) === ownerId) {
    try {
      const response = await axios.get("https://www.rumahotp.com/api/v1/user/balance", {
        headers: { "x-apikey": config.RUMAHOTP, Accept: "application/json" },
        timeout: 20000
      });

      if (response.data?.success && response.data.data) {
        saldoApiFormat = response.data.data.formated || `Rp ${response.data.data.balance.toLocaleString("id-ID")}`;
        name = `${response.data.data.first_name} ${response.data.data.last_name}`.trim() || name;
        username = response.data.data.username ? `@${response.data.data.username}` : username;
        apiStatus = "OK";
      } else {
        apiStatus = "No Data";
      }
    } catch (err) {
      console.error("API Error:", err.message);
      apiStatus = "Connection Error";
    }
  }

  // 🔰 Join date
  const moment = require("moment-timezone");
  if (!fs.existsSync(joinDateFile)) fs.writeFileSync(joinDateFile, "{}");
  const joinData = JSON.parse(fs.readFileSync(joinDateFile));
  if (!joinData[userId]) {
    joinData[userId] = moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH.mm.ss");
    fs.writeFileSync(joinDateFile, JSON.stringify(joinData, null, 2));
  }
  const joinDate = joinData[userId];

  // 🔰 Total deposit
  let totalDeposit = 0;
  if (fs.existsSync(depositPath)) {
    try {
      const depositData = JSON.parse(fs.readFileSync(depositPath));
      const userDeposits = depositData.filter(d => String(d.userId) === String(userId));
      totalDeposit = userDeposits
        .filter(d => d.status && d.status.toLowerCase().includes("success"))
        .reduce((acc, cur) => acc + (parseInt(cur.total) || 0), 0);
    } catch {}
  }

  // 🔰 Total order
  let totalOrder = 0;
  if (fs.existsSync(orderPath)) {
    try {
      let orderRaw = JSON.parse(fs.readFileSync(orderPath, "utf8"));
      if (!Array.isArray(orderRaw)) orderRaw = [orderRaw];
      const userOrders = orderRaw.filter(item => String(item.customerId) === String(userId));
      totalOrder = userOrders.length;
    } catch {}
  }

  // 🔰 Point
  let userPoint = 0;
  if (fs.existsSync(pointPath)) {
    try {
      const pointRaw = JSON.parse(fs.readFileSync(pointPath, "utf8"));
      if (pointRaw[userId]) userPoint = pointRaw[userId].point_total || 0;
    } catch {}
  }

  const idDigit = String(userId).length;
  const idDisplay = `(${idDigit} digit)`;

  // ===============================
  // 🔰 Format profil
  // ===============================
  let saldoSection = `<b>💰 Balance & Activity</b>
Saldo: Rp ${saldoLocalFormat}
Deposit: Rp ${totalDeposit.toLocaleString("id-ID")}
Order: ${totalOrder}
Poin: ${userPoint}`;

  // Tambahkan saldo website jika owner
  if (saldoApiFormat) {
    saldoSection = `<b>💰 Balance & Activity</b>
Saldo (Bot): Rp ${saldoLocalFormat}
Saldo (Web): ${saldoApiFormat} (${apiStatus})
Deposit: Rp ${totalDeposit.toLocaleString("id-ID")}
Order: ${totalOrder}
Poin: ${userPoint}`;
  }

const caption = `<b>👤 Profil Akun</b>
━━━━━━━━━━━━━━━━━━━━━━

Nama: <b>${name}</b>
🆔 ID: <code>${userId}</code> ${idDisplay}
Username: ${username}
✅ Status: Active

━━━━━━━━━━━━━━━━━━━━━━

${saldoSection}

━━━━━━━━━━━━━━━━━━━━━━

<b>📅 Aktivitas</b>
Bergabung: ${joinDate}
Waktu Sekarang: ${nowTime}

━━━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`.trim();

const options = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
        [{ text: "⬅️ Kembali", callback_data: "deposit_menu" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }]
    ]
  }
};

  // ✅ Guard: Pastikan callbackQuery.message ada
  if (!callbackQuery.message) {
    console.error("[PROFILE] callbackQuery.message is undefined");
    return;
  }

  const message = callbackQuery.message;

  await bot.editMessageCaption(caption, {
    chat_id: chatId,
    message_id: message.message_id,
    ...options
  });
}

// ===============================  
// 💰 RIWAYAT DEPOSIT USER (MAX 10 DATA)  
// ===============================  
if (data === "riwayat_deposit") {
  const fs = require("fs");
  const pathDeposit = "./database/deposit.json";
  const pathSaldo = "./database/saldoOtp.json";

  const username = from.username ? `@${from.username}` : "Tidak ada username";
  const name = from.first_name || "Tanpa Nama";
  const userId = from.id.toString();

  // Pastikan file ada
  if (!fs.existsSync(pathDeposit)) fs.writeFileSync(pathDeposit, JSON.stringify([]));
  if (!fs.existsSync(pathSaldo)) fs.writeFileSync(pathSaldo, JSON.stringify({}));

  const depositData = JSON.parse(fs.readFileSync(pathDeposit));
  const saldoData = JSON.parse(fs.readFileSync(pathSaldo));

  // ✅ Filter deposit sesuai user
  const userDeposits = depositData.filter(d => d.userId.toString() === userId);

  // ===============================
  // 💾 BATAS 10 RIWAYAT PER USER
  // ===============================
  if (userDeposits.length > 10) {
    // hapus data lama jika lebih dari 10
    const userLatest10 = userDeposits.slice(-10);
    // hapus semua data lama user dari database
    const newData = depositData.filter(d => d.userId.toString() !== userId);
    // gabungkan 10 data terakhir user dengan data user lain
    const finalData = [...newData, ...userLatest10];
    fs.writeFileSync(pathDeposit, JSON.stringify(finalData, null, 2));
  }

  // Ambil ulang data deposit setelah filter
  const updatedDeposits = JSON.parse(fs.readFileSync(pathDeposit));
  const userDepositsUpdated = updatedDeposits.filter(d => d.userId.toString() === userId);

  let caption = `📊 *Riwayat Deposit*\n\n`;

  if (userDepositsUpdated.length === 0) {
    caption += `Kamu belum pernah melakukan deposit.\n\n`;
  } else {
    const lastDeposits = userDepositsUpdated.slice(-10).reverse(); // 10 terakhir, terbaru di atas
    caption += `💰 *Deposit Terakhir:*\n`;
    for (const dep of lastDeposits) {
      let totalFormatted;
      if (dep.total === "-" || dep.total === "" || dep.total === null) {
        totalFormatted = "-";
      } else {
        totalFormatted = parseInt(dep.total).toLocaleString("id-ID");
      }

      const status = dep.status.toLowerCase().includes("success")
        ? "✅Berhasil"
        : "❌Cancelled";

      caption += `• Rp${totalFormatted} - ${status}\n`;
    }
    caption += `\n`;
  }

  const saldoUser = saldoData[userId] || 0;
  caption += `📄 *Saldo Saat Ini:* Rp${saldoUser.toLocaleString("id-ID")}`;

  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅️ Kembali", callback_data: "deposit_menu" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }],
      ],
    },
  };

  try {
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...options,
    });
  } catch {
    await bot.sendMessage(chatId, caption, options);
  }

  return bot.answerCallbackQuery(callbackQuery.id);
}
// ===============================  
// 💰 RIWAYAT ORDER USER (MAX 5 DATA)  
// ===============================  
  // 📜 Jika user klik tombol history order
  if (data === "history_orderbot") {
    const filePath = "./database/nokosData.json";
    if (!fs.existsSync(filePath)) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Belum ada riwayat order.", show_alert: true });
    }

    const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    // Filter order berdasarkan ID user
    const userOrders = rawData.filter((item) => item.customerId === userId);

    if (userOrders.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, { text: "Kamu belum pernah melakukan order.", show_alert: true });
    }

    // Tampilkan halaman pertama
    showOrderPage(chatId, messageId, userOrders, 1, callbackQuery.id);
  }

  // 📄 Pagination handler (misal: page_2)
  if (data.startsWith("page_")) {
    const page = parseInt(data.split("_")[1]);
const filePath = "./database/nokosData.json";
let rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Pastikan dalam bentuk array
if (!Array.isArray(rawData)) {
  rawData = [rawData];
}

const userOrders = rawData.filter((item) => item.customerId === userId);

    showOrderPage(chatId, messageId, userOrders, page, callbackQuery.id);
  }
async function showOrderPage(chatId, messageId, userOrders, page = 1, callbackId) {
  try {
    const perPage = 5;
    const totalOrders = userOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / perPage));

    // Validasi page
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageData = userOrders.slice(start, end);

    let caption = `📦 <b>RIWAYAT ORDER KAMU</b>\n`;
    caption += `📄 Halaman <b>${page}</b> dari <b>${totalPages}</b>\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Jika kosong
    if (pageData.length === 0) {
      caption += `❌ <i>Kamu belum memiliki order.</i>\n\n`;
    }

    pageData.forEach((order, i) => {
      caption += `<b>${start + i + 1}. ${order.service}</b> <code>#${order.orderId}</code>\n`;
      caption += `┌ 🌍 Negara: <b>${order.country}</b>\n`;
      caption += `├ 📞 Nomor: <code>${order.number}</code>\n`;
      caption += `├ 💰 Harga: <b>${order.price}</b>\n`;
      caption += `├ 💬 OTP: ${order.otp ? `<code>${order.otp}</code>` : `<i>Belum ada</i>`}\n`;
      caption += `└ 🗓️ Tanggal: ${order.date}\n\n`;
    });

    caption += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `📌 Total Order: <b>${totalOrders}</b>\n`;

    // Pagination buttons
    const buttons = [];
    if (page > 1) {
      buttons.push({ text: "⬅️ Sebelumnya", callback_data: `page_${page - 1}` });
    }
    if (page < totalPages) {
      buttons.push({ text: "Berikutnya ➡️", callback_data: `page_${page + 1}` });
    }

    const keyboard = [];
    if (buttons.length) keyboard.push(buttons);
    keyboard.push([{ text: "⬅️ Kembali", callback_data: "deposit_menu" }]);
    keyboard.push([{ text: "🏠 Menu Utama", callback_data: "back_home" }]);

    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });

    if (callbackId) bot.answerCallbackQuery(callbackId);

  } catch (err) {
    console.error("❌ Error showOrderPage:", err);
    bot.answerCallbackQuery(callbackId, {
      text: "Terjadi kesalahan saat menampilkan riwayat.",
      show_alert: true,
    });
  }
}
// =====================================================
// 🏆 LIST TOP USER MENU (WOW PREMIUM VERSION)
// =====================================================
if (data === "listtop_user") {
  try {
    const listTopText = `🏆 <b>RajaOTP Leaderboard</b>
━━━━━━━━━━━━━━━━━━━━━━

Lihat ranking pengguna berdasarkan aktivitas mereka.

<b>📈 Pilih Kategori</b>
🛒 Top Order — jumlah order terbanyak
💰 Top Deposit — total deposit tertinggi
💳 Top Saldo — saldo terbesar
⭐ Top Point — poin terbanyak

Data update realtime setiap jam.

━━━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    await safeEditMessage(bot, callbackQuery.message, {
      text: listTopText,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Top Order", callback_data: "top_order" }],
          [{ text: "💰 Top Deposit", callback_data: "top_depo" }],
          [{ text: "💳 Top Saldo", callback_data: "top_saldo" }],
          [{ text: "⭐ Top Point", callback_data: "top_point" }],
          [{ text: "⬅️ Kembali", callback_data: "back_home" }],
        ],
      },
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("[LISTTOP_USER ERROR]", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Gagal memuat list top users.",
      show_alert: true,
    });
  }
}
// ===============================
// ⭐ TOP POINT (10 USER POINT TERBANYAK)
// ===============================
if (data === "top_point") {
  try {
    const fs = require("fs");
    const pointPath = "./database/pointSaldo.json";

    // Cek file
    if (!fs.existsSync(pointPath)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Data leaderboard tidak ditemukan.",
        show_alert: true,
      });
    }

    // Load JSON
    let pointDb = {};
    try {
      pointDb = JSON.parse(fs.readFileSync(pointPath, "utf8"));
    } catch (e) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Terjadi kesalahan memuat data.",
        show_alert: true,
      });
    }

    const users = Object.entries(pointDb);

    if (users.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "Belum ada data leaderboard tersedia.",
        show_alert: true,
      });
    }

    // ==========================
    // URUTKAN USER BY POINT
    // ==========================
    const ranking = users
      .map(([uid, data]) => ({
        userId: uid,
        point: data.point_total || 0,
      }))
      .sort((a, b) => b.point - a.point) // terbesar → kecil
      .slice(0, 10);

// ==========================
// Top Point Leaderboard
// ==========================
let text = `⭐ <b>Top 10 Point</b>\n`;
text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

ranking.forEach((u, i) => {
  const medal =
    i === 0 ? "🥇" :
    i === 1 ? "🥈" :
    i === 2 ? "🥉" : "•";

  text += `${medal} #${i + 1} — <code>${u.userId}</code>\n`;
  text += `${u.point} poin\n\n`;
});

text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
text += `Kumpulkan poin untuk naik peringkat.\n\n`;
text += `👑 RajaOTP • Secure OTP Automation`;

const options = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
      [{ text: "⬅️ Kembali", callback_data: "back_to_listtop" }]
    ],
  },
};

    try {
      await bot.sendMessage(callbackQuery.message.chat.id, text, options);
    } catch (sendErr) {
      console.error("[TOP POINT SEND ERROR]", sendErr.message);
      await bot.sendMessage(callbackQuery.message.chat.id, 
        "Gagal memuat leaderboard. Coba lagi.",
        { parse_mode: "HTML" }
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat memuat Top Point.",
      show_alert: true,
    });
  }
}

// ===============================
// ⬅️ BACK TO LIST TOP (NEW HANDLER)
// ===============================
if (data === "back_to_listtop") {
  try {
    const listTopText = `🏆 <b>RajaOTP Leaderboard</b>
━━━━━━━━━━━━━━━━━━━━━━

Lihat ranking pengguna berdasarkan aktivitas mereka.

<b>📈 Pilih Kategori</b>
🛒 Top Order — jumlah order terbanyak
💰 Top Deposit — total deposit tertinggi
💳 Top Saldo — saldo terbesar
⭐ Top Point — poin terbanyak

Data update realtime setiap jam.

━━━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    await safeEditMessage(bot, callbackQuery.message, {
      text: listTopText,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Top Order", callback_data: "top_order" }],
          [{ text: "💰 Top Deposit", callback_data: "top_depo" }],
          [{ text: "💳 Top Saldo", callback_data: "top_saldo" }],
          [{ text: "⭐ Top Point", callback_data: "top_point" }],
          [{ text: "⬅️ Kembali", callback_data: "back_home" }],
        ],
      },
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("[BACK TO LISTTOP ERROR]", err.message);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Gagal memuat leaderboard.",
      show_alert: true,
    });
  }
}

// ===============================
// 🛒 TOP ORDER (10 USER ORDER TERBANYAK)
// ===============================
if (data === "top_order") {
  try {
    const fs = require("fs");

    const path = "./database/nokosData.json";

    // 🔍 Cek file
    if (!fs.existsSync(path)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Data order tidak ditemukan!",
        show_alert: true,
      });
    }

    // 🔍 Baca JSON
    let raw = fs.readFileSync(path, "utf8");
    let orders = [];

    try {
      orders = JSON.parse(raw);
      if (!Array.isArray(orders)) throw new Error("Format bukan array");
    } catch (e) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Format JSON rusak!",
        show_alert: true,
      });
    }

    if (orders.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Belum ada data order!",
        show_alert: true,
      });
    }

    // ==========================
    // HITUNG ORDER PER USER
    // ==========================
    const count = {}; 
    const nameMap = {};

    for (const o of orders) {
      const uid = String(o.customerId);
      nameMap[uid] = o.customerName || "Tidak diketahui";

      if (!count[uid]) count[uid] = 0;
      count[uid]++;
    }

    // Convert to array → sort → ambil top 10
    const ranking = Object.entries(count)
      .sort((a, b) => b[1] - a[1]) // terbanyak
      .slice(0, 10);

// ==========================
// Top Order Leaderboard
// ==========================
let text = `🛒 <b>Top 10 Order</b>\n`;
text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

ranking.forEach((u, i) => {
  const userId = u[0];
  const totalOrder = u[1];
  const namaUser = escapeHTML(nameMap[userId] || "User Tidak Diketahui");

  const medal =
    i === 0 ? "🥇" :
    i === 1 ? "🥈" :
    i === 2 ? "🥉" : "•";

  text += `${medal} #${i + 1} — ${namaUser}\n`;
  text += `${totalOrder}x order\n\n`;
});

text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
text += `Terima kasih atas dukungan Anda!\n\n`;
text += `👑 RajaOTP • Secure OTP Automation`;

const options = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
      [{ text: "⬅️ Kembali", callback_data: "back_to_listtop" }]
    ],
  },
};

    try {
      await bot.sendMessage(callbackQuery.message.chat.id, text, options);
    } catch (sendErr) {
      console.error("[TOP ORDER SEND ERROR]", sendErr.message);
      await bot.sendMessage(callbackQuery.message.chat.id,
        "Gagal memuat leaderboard. Coba lagi.",
        { parse_mode: "HTML" }
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Gagal memuat leaderboard.",
      show_alert: true,
    });
  }
}
// ===============================
// 💰 TOP DEPOSIT (10 USER DEPOSIT TERBANYAK)
// ===============================
if (data === "top_depo") {
  try {
    const fs = require("fs");

    const path = "./database/deposit.json";

    // 🔍 Cek file ada
    if (!fs.existsSync(path)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Data deposit tidak ditemukan!",
        show_alert: true,
      });
    }

    // 🔍 Baca file JSON
    let raw = fs.readFileSync(path, "utf8");
    let depo = [];

    try {
      depo = JSON.parse(raw);
      if (!Array.isArray(depo)) throw new Error("Data bukan array");
    } catch (e) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Format JSON rusak!",
        show_alert: true,
      });
    }

    if (depo.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Belum ada data deposit!",
        show_alert: true,
      });
    }

    // 🔄 Hitung total deposit per user (SUCCESS ONLY)
    const map = {}; // key = userId

    for (let d of depo) {
      if (!d.userId) continue;
      if (d.status !== "success") continue;
      if (isNaN(d.total)) continue; // skip "-", null, dll

      const amount = Number(d.total);

      if (!map[d.userId]) {
        map[d.userId] = {
          userId: d.userId,
          username: d.username || "-",
          totalDepo: 0,
        };
      }

      map[d.userId].totalDepo += amount;
    }

    // Jika semua data tidak valid / 0
    const arr = Object.values(map);
    if (arr.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Belum ada deposit berhasil!",
        show_alert: true,
      });
    }

    // 🔽 Urutkan dari deposit terbesar
    const ranking = arr.sort((a, b) => b.totalDepo - a.totalDepo).slice(0, 10);

// ==========================
// Top Deposit Leaderboard
// ==========================
let text = `💰 <b>Top 10 Deposit</b>\n`;
text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

ranking.forEach((u, i) => {
  const medal =
    i === 0 ? "🥇" :
    i === 1 ? "🥈" :
    i === 2 ? "🥉" : "•";

  const safeUsername = escapeHTML(u.username || "No Username");
  const namaDisplay = u.username && u.username !== "-"
    ? `@${safeUsername}`
    : `User ${u.userId.substring(0, 6)}`;

  text += `${medal} #${i + 1} — ${namaDisplay}\n`;
  text += `Rp${u.totalDepo.toLocaleString("id-ID")}\n\n`;
});

text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
text += `Terima kasih atas dukungan Anda!\n\n`;
text += `👑 RajaOTP • Secure OTP Automation`;

const options = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [
      [{ text: "⬅️ Kembali", callback_data: "back_to_listtop" }]
    ],
  },
};

    // Kirim hasil
    try {
      await bot.sendMessage(callbackQuery.message.chat.id, text, options);
    } catch (sendErr) {
      console.error("[TOP DEPOSIT SEND ERROR]", sendErr.message);
      await bot.sendMessage(callbackQuery.message.chat.id,
        "Gagal memuat leaderboard. Coba lagi.",
        { parse_mode: "HTML" }
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Gagal memuat leaderboard.",
      show_alert: true,
    });
  }
}
// ===============================
// 💰 TOP SALDO (10 USER SALDO TERBANYAK)
// ===============================
if (data === "top_saldo") {
  try {
    const fs = require("fs");
    const path = "./database/saldoOtp.json";

    // 🔍 Cek file ada
    if (!fs.existsSync(path)) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Data saldo tidak ditemukan!",
        show_alert: true,
      });
    }

    // 🔍 Baca file JSON
    let raw = fs.readFileSync(path, "utf8");
    let saldoData = {};

    try {
      saldoData = JSON.parse(raw);
      if (typeof saldoData !== "object") throw new Error("Data bukan object");
    } catch (e) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Format JSON saldo rusak!",
        show_alert: true,
      });
    }

    // 🔄 Convert object → array
    let arr = [];
    for (let userId in saldoData) {
      const saldo = Number(saldoData[userId]);
      if (isNaN(saldo) || saldo <= 0) continue;

      arr.push({
        userId,
        saldo,
      });
    }

    if (arr.length === 0) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Belum ada saldo tersedia!",
        show_alert: true,
      });
    }

    // 🔽 Urutkan saldo terbesar
    const ranking = arr
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 10);

    // ==========================
    // Top Saldo Leaderboard
    // ==========================
    let text = `💳 <b>Top 10 Saldo</b>\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    ranking.forEach((u, i) => {
      const medal =
        i === 0 ? "🥇" :
        i === 1 ? "🥈" :
        i === 2 ? "🥉" : "•";

      const safeUserId = escapeHTML(u.userId);

      text += `${medal} #${i + 1} — <code>${safeUserId.substring(0, 10)}</code>\n`;
      text += `Rp${u.saldo.toLocaleString("id-ID")}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Gunakan saldo dengan bijak.\n\n`;
    text += `👑 RajaOTP • Secure OTP Automation`;

    const options = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "back_to_listtop" }],
        ],
      },
    };

    // Kirim hasil
    try {
      await bot.sendMessage(callbackQuery.message.chat.id, text, options);
    } catch (sendErr) {
      console.error("[TOP SALDO SEND ERROR]", sendErr.message);
      await bot.sendMessage(callbackQuery.message.chat.id,
        "Gagal memuat leaderboard. Coba lagi.",
        { parse_mode: "HTML" }
      );
    }

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Gagal memuat leaderboard.",
      show_alert: true,
    });
  }
}
// ===============================================
// 📌 CALLBACK: BONUS_REFERRAL (FINAL FIX)
// ===============================================
if (data === "bonus_referral") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id.toString();
    const config = require("./config.js");

    // =====================================================
    // 🔹 LOAD SYSTEM REFERRAL FROM JSON (BUKAN DARI CONFIG)
    // =====================================================
    const sysPath = "./database/SystemReferral.json";
    let sys = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };

    if (fs.existsSync(sysPath)) {
      sys = JSON.parse(fs.readFileSync(sysPath));
    }

    const REF_ON = sys.Referral_Enabled;
    const BONUS_REFERRAL = sys.Referral_PerUser || 0;
    const BONUS_REFERRED = sys.Referral_PerDaftar || 0;

    // =====================================================
    // ❗ BLOCK TOTAL JIKA REFERRAL OFF
    // =====================================================
    if (!REF_ON) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "🔴 Sistem referral saat ini NONAKTIF.",
        show_alert: true,
      });

      await bot.editMessageCaption(
        `
🎁 <b>PROGRAM REFERRAL RajaOTP</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 <b>Referral sedang NONAKTIF</b>

Sistem ini sementara tidak tersedia. Silakan coba lagi nanti.

👑 RajaOTP • Secure OTP Automation`,
        {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⬅️ Kembali", callback_data: "back_home" }],
            ],
          },
        }
      );
      return;
    }

    // =====================================================
    // 🔹 FILE referralCode.json (kode referral user)
    // =====================================================
    const codeFile = "./database/referralCode.json";
    let referralCodes = {};

    if (fs.existsSync(codeFile)) {
      referralCodes = JSON.parse(fs.readFileSync(codeFile));
    }

    // Generate referral code jika belum ada
    function generateCode() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    if (!referralCodes[userId]) {
      referralCodes[userId] = generateCode();
      fs.writeFileSync(codeFile, JSON.stringify(referralCodes, null, 2));
    }

    const finalCode = `ref_${referralCodes[userId]}`;

    // =====================================================
    // 🔹 File referral.json (log referral user)
    // =====================================================
    const referralFile = "./database/referral.json";
    let referralData = {};

    if (fs.existsSync(referralFile)) {
      referralData = JSON.parse(fs.readFileSync(referralFile));
    }

    const totalRef = Object.values(referralData).filter(
      (r) => r.referrerId === finalCode
    ).length;

    const totalBonus = Object.values(referralData)
      .filter((r) => r.referrerId === finalCode)
      .reduce((sum, r) => sum + (r.bonus || BONUS_REFERRAL), 0);

    // =====================================================
    // 🔹 Referral Link
    // =====================================================
      const botInfo = await bot.getMe();
      const botUsername = botInfo.username
  ? `${botInfo.username.replace(/_/g, "\\_")}`
  : "TanpaUsername";
    const referralLink = `https://t.me/${botUsername}?start=${finalCode}`;

    // =====================================================
    // 🔹 BUILD CAPTION
    // =====================================================
    const caption = `
🎁 <b>PROGRAM REFERRAL RajaOTP</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>Ajak teman & dapatkan bonus saldo! 🎉</b>

<b>📊 PERFORMA REFERRAL ANDA</b>
👥 Teman Diajak: <b>${totalRef}</b> orang
💸 Total Bonus: <b>Rp${totalBonus.toLocaleString("id-ID")}</b>
💎 Status: <b>Akun Premium</b>

💰 <b>Bonus untuk Kamu:</b> Rp${BONUS_REFERRAL.toLocaleString("id-ID")}
🎁 <b>Bonus untuk Teman Baru:</b> Rp${BONUS_REFERRED.toLocaleString("id-ID")}

🔗 <b>LINK REFERRAL ANDA</b>
(Ketuk link di bawah untuk menyalin otomatis)

<code><a href="${referralLink}">${referralLink}</a></code>

🔐 <b>Kode Referral:</b> <code>${finalCode}</code>

📚 <b>CARA KERJA SISTEM</b>
1️⃣ Bagikan link di atas ke teman/grup.
2️⃣ Teman menekan tombol START.
3️⃣ Bonus <b>Rp${BONUS_REFERRAL.toLocaleString("id-ID")}</b> langsung masuk saldo!

💡 <b>Tips:</b> Sebarkan ke grup Facebook, WA, atau Telegram pencari receh untuk hasil maksimal!
`;

    // =====================================================
    // 🔹 BUTTONS
    // =====================================================
const shareText = `✨ 𝗥𝗘𝗙𝗘𝗥𝗥𝗔𝗟 𝗕𝗢𝗡𝗨𝗦 ✨

🚀 Ajak teman-temanmu bergabung dan dapatkan 𝗯𝗼𝗻𝘂𝘀 𝘀𝗮𝗹𝗱𝗼 𝗴𝗿𝗮𝘁𝗶𝘀! 

💎 Semakin banyak teman yang join menggunakan link kamu, semakin besar hadiah yang kamu terima!

🔗 Klik link di bawah untuk mulai:
${referralLink}
`;

const keyboard = [
  [
    {
      text: "📤 Bagikan Referral",
      url:
        "https://t.me/share/url?" +
        `url=${encodeURIComponent("")}` + // FIX → kosongkan url
        `&text=${encodeURIComponent(shareText)}`,
    },
  ],
  [{ text: "⬅️ Kembali", callback_data: "back_home" }],
];

    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });

    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error("❌ REFERRAL ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan membuka menu referral.",
      show_alert: true,
    });
  }
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "panduan_user") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // ==========================
    // Caption HOME
    // ==========================
    const caption = `<b>─── 🎯 PUSAT BANTUAN & TUTORIAL ───</b>

Butuh panduan? Silakan pilih salah satu tutorial di bawah untuk memahami cara penggunaan layanan dengan mudah.

📚 <b>Daftar Tutorial</b>
• 💰 <b>Tutorial Deposit</b> — Cara melakukan top up saldo  
• 📱 <b>Tutorial Order</b> — Cara memesan nomor OTP  
• 👥 <b>Tutorial Referral</b> — Cara mendapatkan bonus referral  
• ❓ <b>FAQ</b> — Kumpulan pertanyaan yang sering diajukan

<b>─── 💡 Informasi Penting ───</b>
• Bot berjalan otomatis 24/7  
• Deposit & pemesanan diproses instan  
• Refund otomatis jika transaksi gagal  
• Customer Service selalu siap membantu

Jika masih membutuhkan bantuan tambahan, silakan pilih menu “🆘 Customer Service” pada menu utama.
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💰 Tutorial Deposit", callback_data: "panduan_deposit" }, { text: "📱 Tutorial Order", callback_data: "panduan_order" }],
          [{ text: "👥 Tutorial Referral", callback_data: "panduan_referral" }],
          [{ text: "❓ Ketentuan", callback_data: "panduan_ketentuan" }],
          [{ text: "⬅️ Kembali", callback_data: "back_home" }],
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "panduan_deposit") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // ==========================
    // Caption HOME
    // ==========================
    const caption = `<b>─── 💰 TUTORIAL DEPOSIT SALDO ───</b>

Panduan lengkap untuk melakukan pengisian saldo dengan cepat dan aman.

📋 <b>Langkah-langkah Top Up</b>
1. 🏠 Buka Menu Utama  
   • Pilih opsi "💰 Top Up Saldo"

2. 💵 <b>Pilih Nominal</b>
   • Anda dapat memilih nominal cepat: 5K, 10K, 20K, 50K, 100K  
   • Atau gunakan Custom Nominal untuk jumlah lainnya

3. 📲 <b>Lakukan Pembayaran via QRIS</b>
   • Scan QR yang muncul  
   • Bayar sesuai nominal tertera  
   • Sistem akan mendeteksi pembayaran secara otomatis

4. ✅ <b>Saldo Bertambah</b>
   • Saldo masuk dalam ± 5–10 detik  
   • Langsung bisa digunakan untuk melakukan order

<b>─── ⚡ Keunggulan Sistem ───</b>
• Proses otomatis 24/7  
• Minimal deposit hanya Rp 2.000  
• Tanpa konfirmasi admin  
• Cepat, aman, dan terpercaya

💡 <b>Tips:</b> Gunakan nominal sesuai kebutuhan untuk memudahkan manajemen saldo Anda.

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "panduan_user" }, { text: "💰Top Up", callback_data: "deposit_menu" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }]          
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "panduan_order") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // ==========================
    // Caption HOME
    // ==========================
    const caption = `<b>─── 📱 TUTORIAL ORDER NOMOR OTP ───</b>

Panduan lengkap untuk melakukan pemesanan nomor OTP dengan cepat dan aman.

🛒 <b>Proses Pemesanan</b>
1. 📋 <b>Pilih Layanan</b>
   • Buka menu utama, lalu pilih "📱 Layanan OTP"  
   • Cari aplikasi yang ingin digunakan (WhatsApp, TikTok, dll)

2. 🌍 <b>Pilih Negara</b>
   • Tentukan negara tujuan nomor  
   • Harga dapat berbeda di setiap negara

3. 💰 <b>Pilih Harga & Operator</b>
   • Pilih harga yang tersedia  
   • Sesuaikan operator sesuai preferensi Anda

4. 🛒 <b>Pesan Nomor</b>
   • Klik "✅ Pesan Nomor Ini"  
   • Saldo terpotong otomatis  
   • Nomor langsung muncul dan siap digunakan

5. ⏳ <b>Tunggu OTP</b>
   • Sistem otomatis memonitor SMS masuk  
   • OTP akan tampil otomatis ketika diterima  
   • Auto-cancel jika OTP tidak masuk dalam batas waktu

<b>─── 🛡️ Fitur Keamanan ───</b>
• Maksimal waktu tunggu: 15 menit  
• Refund otomatis jika gagal  
• Proses 100% otomatis  
• Riwayat transaksi tersimpan rapi

🎯 <b>Tips:</b> Pastikan saldo mencukupi sebelum memesan nomor.

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "panduan_user" }, { text: "📱Order", callback_data: "choose_service" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }]          
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "panduan_referral") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // =====================================================
    // 🔹 LOAD SYSTEM REFERRAL FROM JSON (BUKAN DARI CONFIG)
    // =====================================================
    const sysPath = "./database/SystemReferral.json";
    let sys = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };

    if (fs.existsSync(sysPath)) {
      sys = JSON.parse(fs.readFileSync(sysPath));
    }

    const BONUS_REFERRAL = sys.Referral_PerUser || 0;
    const BONUS_REFERRED = sys.Referral_PerDaftar || 0;
    
    // ==========================
    // Caption HOME
    // ==========================
    const caption = `<b>👥 TUTORIAL PROGRAM REFERRAL</b>

🎁 <b>CARA DAPAT BONUS:</b>

1. 🔗 <b>DAPATKAN LINK</b>
   └ Buka menu "👥 Program Referral"
   └ Copy link referral Anda

2. 📤 <b>BAGIKAN LINK</b>
   └ Share ke teman/group
   └ WhatsApp, Telegram, dll

3. 👋 <b>TEMAN DAFTAR</b>
   └ Teman klik link Anda
   └ Harus start bot pertama kali
   └ Hanya untuk user baru

4. 💰 <b>DAPAT BONUS</b>
   └ Bonus Kamu <b>Rp${BONUS_REFERRAL.toLocaleString("id-ID")}</b> otomatis masuk
   └ Bonus Teman <b>Rp${BONUS_REFERRED.toLocaleString("id-ID")}</b> otomatis masuk   
   └ Tidak ada batas jumlah referral

💰 <b>SISTEM BONUS:</b>
├ 💵 Bonus Kamu:  <b>Rp${BONUS_REFERRAL.toLocaleString("id-ID")}</b> per referral
├ 💵 Bonus Teman: <b>Rp${BONUS_REFERRED.toLocaleString("id-ID")}</b> per referral
├ 👤 Syarat: User baru saja
└ ⚡ Langsung masuk ke saldo

🚀 <b>KEUNTUNGAN:</b>
└ 💰 Dapat uang tambahan
└ 👥 Ajak teman dapat benefit
└ 📈 Passive income
└ 🎁 Win-win solution

💡 <b>Tips:</b> Share link ke banyak teman untuk maksimalkan bonus!

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "panduan_user" }, { text: "👥Referral", callback_data: "bonus_referral" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }]          
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "panduan_ketentuan") {
  try {
    const fs = require("fs");
    const from = callbackQuery.from;
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userId = from.id;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // =====================================================
    // 🔹 LOAD SYSTEM REFERRAL FROM JSON (BUKAN DARI CONFIG)
    // =====================================================
    const sysPath = "./database/SystemReferral.json";
    let sys = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };

    if (fs.existsSync(sysPath)) {
      sys = JSON.parse(fs.readFileSync(sysPath));
    }

    const BONUS_REFERRAL = sys.Referral_PerUser || 0;
    const BONUS_REFERRED = sys.Referral_PerDaftar || 0;
    
    // ==========================
    // Caption HOME
    // ==========================
    const caption = `<b>❓ FREQUENTLY ASKED QUESTIONS</b>

🤔 <b>PERTANYAAN UMUM:</b>

💳 <b>TENTANG DEPOSIT:</b>
├ ❓ Minimal deposit berapa?
├ 💰 Minimal Rp 2.000
├ 
├ ❓ Metode pembayaran apa saja?
├ 📱 QRIS (Instant)
├ 
├ ❓ Berapa lama proses deposit?
├ ⚡ 5-10 detik otomatis

📱 <b>TENTANG ORDER:</b>
├ ❓ Berapa lama dapat OTP?
├ ⏰ Maksimal 15 menit
├ 
├ ❓ Apa yang terjadi jika gagal?
├ 💸 Refund otomatis
├ 
├ ❓ Bisa pesan berapa kali?
├ ✅ Tidak ada batasan

👥 <b>TENTANG REFERRAL:</b>
├ ❓ Bonus referral berapa?
├ 💰 <b>Rp${BONUS_REFERRED.toLocaleString("id-ID")}</b> per user baru
├ 💰 <b>Rp${BONUS_REFERRAL.toLocaleString("id-ID")}</b> untuk owner
├ 
├ ❓ Syarat dapat bonus?
├ 👤 User harus baru

🛠️ <b>MASALAH TEKNIS:</b>
├ ❓ Saldo tidak bertambah?
├ 📞 Hubungi CS
├ 
├ ❓ OTP tidak masuk?
├ 🔄 Coba order lagi
├ 
├ ❓ Bot tidak responsif?
├ 🔁 Restart bot

📞 <b>BUTUH BANTUAN?</b>
Klik tombol Customer Service di bawah!

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "panduan_user" }, { text: "🆘CS", callback_data: "open_support_info" }],
        [{ text: "🏠 Menu Utama", callback_data: "back_home" }]          
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: message.message_id
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: message.message_id,
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}

// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "deposit_menu") {
  try {
    // Guard: Ensure message data is available
    if (!messageId) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "⚠️ Sesi telah kedaluwarsa",
        show_alert: true
      }).catch(() => {});
    }

    const fs = require("fs");
    const from = callbackQuery.from;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

// 🔥 RESET STATE JIKA BALIK KE MENU DEPOSIT
if (userState[userId]) {
  delete userState[userId];
}

    const caption = `👑 <b>RajaOTP • Top Up Saldo</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 <b>PILIH METODE PEMBAYARAN</b>
✅ QRIS (Instan) – terverifikasi otomatis  
✅ Transfer Manual – konfirmasi admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ <b>NOMINAL CEPAT</b>
Tap salah satu nominal di bawah untuk melakukan top up instan melalui QRIS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Minimal deposit: Rp 2.000  
✅ Proses 24/7 otomatis  
✅ Saldo masuk instan setelah pembayaran

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
  [
            { text: "✍️ Custom Harga", callback_data: "topup_nokos" }
          ],        
  [
            { text: "💰 5.000", callback_data: "topup_5000" },
            { text: "💰 10.000", callback_data: "topup_10000" }
          ],
          [
            { text: "💰 15.000", callback_data: "topup_15000" },
            { text: "💰 20.000", callback_data: "topup_20000" }
          ],
          [
            { text: "💰 25.000", callback_data: "topup_25000" },
            { text: "💰 30.000", callback_data: "topup_30000" }
          ],
          [
            { text: "🛒 HISTORY ORDER", callback_data: "history_orderbot" },
            { text: "📊 HISTORY DEPOSIT", callback_data: "riwayat_deposit" }
          ],
          // Cek saldo dan Kembali
          [{ text: "💳 Cek Saldo", callback_data: "profile" }],
          [{ text: "⬅️ Kembali", callback_data: "back_home" }],
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: messageId  // ✅ FIX: Use messageId from destructuring
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,  // ✅ FIX: Use messageId from destructuring
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}
// ===============================
// 💰 TOPUP VIA BUTTON (FIXED PRICE)
// ===============================
if (data.startsWith("topup_") && data !== "topup_nokos") {
  try {
    // Guard: Ensure message data is available
    if (!messageId) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "⚠️ Sesi telah kedaluwarsa",
        show_alert: true
      }).catch(() => {});
    }

    // Ambil nominal dari callback_data
    // contoh: topup_5000 -> 5000
    const amount = parseInt(data.split("_")[1]);

    if (isNaN(amount) || amount < 2000) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Nominal tidak valid",
        show_alert: true
      });
    }

    // 🔥 HAPUS MENU DEPOSIT
    try {
      await bot.deleteMessage(chatId, messageId);  // ✅ FIX: Use messageId from destructuring
    } catch {}

    await bot.answerCallbackQuery(callbackQuery.id);

    // 🚀 LANGSUNG BUAT QRIS
    return processDepositQRIS(bot, {
      chat: { id: chatId },  // ✅ FIX: Use chatId from destructuring
      from: callbackQuery.from
    }, amount);

  } catch (err) {
    console.error("TOPUP BUTTON ERROR:", err);
    return bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Gagal memproses deposit",
      show_alert: true
    });
  }
}
if (data === "topup_nokos") {
  // Guard: Ensure message data is available
  if (!messageId) {
    return bot.answerCallbackQuery(callbackQuery.id, {
      text: "⚠️ Sesi telah kedaluwarsa",
      show_alert: true
    }).catch(() => {});
  }

  userState[userId] = {
    mode: "INPUT_CUSTOM_TOPUP",
    menuMessageId: messageId // ✅ FIX: Use messageId from destructuring
  };

  await bot.editMessageCaption(
`<b>✍️ TOP UP CUSTOM</b>

Ketik <b>nominal deposit</b> (angka saja)

💡 Contoh:
<code>5000</code>

⬅️ Tekan kembali jika batal`,
    {
      chat_id: chatId,
      message_id: messageId, // ✅ FIX: Use messageId from destructuring
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Kembali", callback_data: "deposit_menu" }]
        ]
      }
    }
  );

  return bot.answerCallbackQuery(callbackQuery.id);
}
// ===============================  
// 🏠 BACK HOME (EDIT FOTO & CAPTION VERSION)  
// ===============================  
if (data === "back_home") {
  try {
    // Guard: Ensure message data is available
    if (!messageId) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "⚠️ Sesi telah kedaluwarsa",
        show_alert: true
      }).catch(() => {});
    }

    const fs = require("fs");
    const from = callbackQuery.from;
    const username = from.username ? `@${from.username}` : "Tidak ada username";
    const name = from.first_name || "Tanpa Nama";
    const config = require("./config.js");

    // =====================================================
    // LOAD SYSTEM REFERRAL
    // =====================================================
    const sysPath = "./database/SystemReferral.json";
    let sys = { Referral_Enabled: false, Referral_PerUser: 0, Referral_PerDaftar: 0 };

    if (fs.existsSync(sysPath)) {
      sys = JSON.parse(fs.readFileSync(sysPath));
    }

    const BONUS_REFERRAL = sys.Referral_PerUser || 0;
    const BONUS_REFERRED = sys.Referral_PerDaftar || 0;

    // Hitung total user
    const usersFile = "./users.json";
    let totalUsers = 0;

    if (fs.existsSync(usersFile)) {
      const dataUsers = JSON.parse(fs.readFileSync(usersFile));
      if (Array.isArray(dataUsers)) totalUsers = dataUsers.length;
    }

    // ==========================
    // Caption HOME
    // ==========================
    const caption = `👑 <b>RajaOTP • Secure OTP Automation</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<b>Halo ${name}!</b> 👋

Selamat datang di <b>RajaOTP</b>, layanan nomor virtual terpercaya untuk semua kebutuhan verifikasi.

<b>🔒 KEUNGGULAN KAMI</b>
✅ Nomor virtual untuk 1000+ aplikasi
✅ Verifikasi instan – OTP langsung masuk
✅ Enkripsi tingkat premium
✅ Harga mulai Rp 2.000
✅ Refund otomatis jika gagal
✅ Bonus referral Rp${BONUS_REFERRAL.toLocaleString("id-ID")}/teman

<b>📊 PROFIL AKUN ANDA</b>
👤 Nama: <b>${name}</b>
🆔 ID: <code>${userId}</code>
🏷️ Username: ${username}
👥 Pengguna Aktif: <b>${totalUsers.toLocaleString("id-ID")}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>MULAI SEKARANG</b>
Pilih menu di bawah untuk menikmati layanan premium kami.

━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation
`;

    const keyboard = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Layanan OTP", callback_data: "choose_service" }],
          [
            { text: "💰 Topup Saldo", callback_data: "deposit_menu" }, { text: "🎁 Program Referral", callback_data: "bonus_referral" }],
          [{ text: "❓ Bantuan & Panduan", callback_data: "panduan_user" }],
          [{ text: "🏆 Pengguna Terbaik", callback_data: "listtop_user" }, { text: "👤 Akun Saya", callback_data: "profile" }],
          [{ text: "💬 Hubungi Kami", callback_data: "open_support_info" }],
        ]
      }
    };

    // ===============================
    // EDIT FOTO
    // ===============================
    await bot.editMessageMedia(
      {
        type: "photo",
        media: config.linkthumbnail
      },
      {
        chat_id: chatId,
        message_id: messageId  // ✅ FIX: Use messageId from destructuring
      }
    );

    // ===============================
    // EDIT CAPTION (HOME MENU)
    // ===============================
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,  // ✅ FIX: Use messageId from destructuring
      ...keyboard
    });

    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    console.error("❌ BACK HOME ERROR:", err);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan saat membuka menu utama.",
      show_alert: true,
    });
  }
}

// =====================================================
// ☎️ INFO SEBELUM CHAT DEVELOPER
// =====================================================
if (data === "open_support_info") {
  if (!callbackQuery.message) {
    console.error("[SUPPORT_GUARD] callbackQuery.message is undefined");
    return;
  }
  
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;

  const supportText = `
💻 <b>Hubungi Developer Utama</b>

Ingin kerja sama, custom fitur, atau melaporkan bug pada sistem bot?
Silakan hubungi developer resmi melalui tombol di bawah.

👨‍💻 Developer siap bantu:
• Pembuatan fitur baru  
• Integrasi API  
• Perbaikan error / bug  
• Pengembangan sistem bot  

⚠️ <b>Pastikan kamu berada di private chat!</b>  
Tombol di bawah akan membuka chat langsung ke developer.

Klik tombol berikut untuk melanjutkan ⬇️
`.trim();

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "👨‍💻 Chat Developer Sekarang", callback_data: "contact_admin" }],
        [{ text: "⬅️ Kembali", callback_data: "back_home" }]
      ]
    },
    parse_mode: "HTML"
  };

  // SELALU EDIT, TANPA SEND MESSAGE
  return bot.editMessageCaption(supportText, {
    chat_id: chatId,
    message_id: messageId,
    ...keyboard
  });
}

  } catch (err) {
    console.error(err);
    bot.answerCallbackQuery(callbackQuery.id, {
      text: "❌ Terjadi kesalahan.",
      show_alert: true,
    });
  }
});

bot.on('callback_query', async (cb) => {
  const chatId = cb.message.chat.id;
  const data = cb.data;
  const isPrivate = cb.message.chat.type === 'private';
  const userId = cb.from.id;

  if (await guardAll(cb)) return;

  if (data === 'contact_admin') {
    if (!isPrivate)
      return bot.answerCallbackQuery(cb.id, {
        text: '❌ Hanya bisa di private chat!',
        show_alert: true
      });

    if (String(userId) === String(config.OWNER_ID))
      return bot.answerCallbackQuery(cb.id, {
        text: '🧠 Kamu owner 😅',
        show_alert: true
      });

    // 🚫 SUDAH DALAM SESI
    if (contactSession[userId] && !terminatedSession[userId]) {
      return bot.answerCallbackQuery(cb.id, {
        text: '📨 Kamu sedang chat dengan admin.\nKetik "batal" untuk mengakhiri.',
        show_alert: true
      });
    }

    // ✅ BUKA SESI BARU
    contactSession[userId] = true;
    delete terminatedSession[userId];

    await bot.sendMessage(
      chatId,
      '📨 *Kamu sedang terhubung dengan Admin*\n\nSilakan kirim pesan.\nKetik *batal* untuk mengakhiri.',
      { parse_mode: 'Markdown' }
    );

    // 🔔 NOTIF KE ADMIN
    await bot.sendMessage(
      config.OWNER_ID,
      `📩 <b>Sesi Chat Baru</b>\n\n🆔 <code>${userId}</code>\n👤 ${cb.from.first_name}\n🔗 @${cb.from.username || '-'}`,
      { parse_mode: 'HTML' }
    );
  }
});

bot.on('message', async (msg) => {
  // 🚫 BLOCK PESAN DARI BOT SENDIRI
  if (msg.from?.is_bot) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isPM = msg.chat.type === 'private';
  const isOwner = String(userId) === String(config.OWNER_ID);
  const replyTo = msg.reply_to_message;
  const text = msg.text?.trim();
  const caption = msg.caption || '';

  if (await guardAll(msg)) return;

// 🚫 USER CHAT TANPA SESI (DIAM, TANPA PESAN)
if (isPM && !contactSession[userId] && !isOwner) {
  if (!msg.text?.startsWith('/')) {
    return; // ⛔ jangan kirim apa-apa
  }
}

  // ==================================================
  // OWNER BALAS USER (WAJIB REPLY PESAN BOT)
  // ==================================================
  if (
    isOwner &&
    replyTo &&
    replyTo.from?.is_bot &&
    forwardedMap[replyTo.message_id]
  ) {
    const targetUserId = forwardedMap[replyTo.message_id];
    if (terminatedSession[targetUserId]) return;

    if (text?.toLowerCase() === 'batal') {
      delete contactSession[targetUserId];
      delete forwardedMap[replyTo.message_id];
      terminatedSession[targetUserId] = true;

      await bot.sendMessage(config.OWNER_ID, `✅ Sesi dengan ${targetUserId} dibatalkan.`);
      await bot.sendMessage(targetUserId, '❌ Sesi chat dibatalkan oleh Admin.');
      return;
    }

    try {
      if (text)
        await bot.sendMessage(
          targetUserId,
          `📬 <b>Balasan dari Admin:</b>\n\n${text}`,
          { parse_mode: 'HTML' }
        );
      else if (msg.document)
        await bot.sendDocument(targetUserId, msg.document.file_id, {
          caption: `📦 <b>File dari Admin</b>\n📝 ${caption}`,
          parse_mode: 'HTML'
        });
      else if (msg.photo)
        await bot.sendPhoto(targetUserId, msg.photo.pop().file_id, {
          caption: `🖼️ <b>Foto dari Admin</b>\n📝 ${caption}`,
          parse_mode: 'HTML'
        });
      else if (msg.voice)
        await bot.sendVoice(targetUserId, msg.voice.file_id);
      else if (msg.video)
        await bot.sendVideo(targetUserId, msg.video.file_id, {
          caption: caption
        });
      else if (msg.audio)
        await bot.sendAudio(targetUserId, msg.audio.file_id);

      await bot.sendMessage(config.OWNER_ID, '✅ Pesan berhasil dikirim ke user.');
    } catch {}

    return;
  }

// ==================================================
// USER KIRIM PESAN KE ADMIN
// ==================================================
if (isPM && contactSession[userId]) {

  // 🚫 SESSION SUDAH DITUTUP
  if (terminatedSession[userId]) {
    delete contactSession[userId];
    return bot.sendMessage(
      userId,
      '❌ Sesi chat sudah berakhir.\nKlik *Contact Admin* untuk memulai ulang.',
      { parse_mode: 'Markdown' }
    );
  }
  // ==================================================
  // USER KIRIM PESAN KE ADMIN
  // ==================================================
    if (text?.toLowerCase() === 'batal') {
      delete contactSession[userId];
      terminatedSession[userId] = true;

      await bot.sendMessage(userId, '✅ Sesi chat dibatalkan.');
      await bot.sendMessage(
        config.OWNER_ID,
        `❌ User <code>${userId}</code> membatalkan sesi.`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    const info =
      `🆔 <code>${userId}</code>\n` +
      `👤 <b>${msg.from.first_name}</b>\n` +
      `🔗 @${msg.from.username || '-'}`;

    // TEXT
    if (text) {
      const fwd = await bot.sendMessage(
        config.OWNER_ID,
        `<b>Pesan dari User</b>\n\n${info}\n💬:\n<pre>${text}</pre>`,
        { parse_mode: 'HTML' }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    // DOCUMENT
    if (msg.document) {
      const fwd = await bot.sendDocument(
        config.OWNER_ID,
        msg.document.file_id,
        {
          caption: `📎 File dari User\n${info}\n📄 <code>${msg.document.file_name}</code>\n📝 ${caption}`,
          parse_mode: 'HTML'
        }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    // PHOTO
    if (msg.photo) {
      const fwd = await bot.sendPhoto(
        config.OWNER_ID,
        msg.photo.pop().file_id,
        {
          caption: `🖼️ Foto dari User\n${info}\n📝 ${caption}`,
          parse_mode: 'HTML'
        }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    // VOICE
    if (msg.voice) {
      const fwd = await bot.sendVoice(
        config.OWNER_ID,
        msg.voice.file_id,
        {
          caption: `🎙️ Voice dari User\n${info}\n📝 ${caption}`,
          parse_mode: 'HTML'
        }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    // VIDEO
    if (msg.video) {
      const fwd = await bot.sendVideo(
        config.OWNER_ID,
        msg.video.file_id,
        {
          caption: `🎥 Video dari User\n${info}\n📝 ${caption}`,
          parse_mode: 'HTML'
        }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    // AUDIO
    if (msg.audio) {
      const fwd = await bot.sendAudio(
        config.OWNER_ID,
        msg.audio.file_id,
        {
          caption: `🎵 Audio dari User\n${info}\n📝 ${caption}`,
          parse_mode: 'HTML'
        }
      );
      forwardedMap[fwd.message_id] = userId;
    }

    await bot.sendMessage(
      userId,
      '✅ Pesan terkirim ke admin.\nKetik *batal* untuk mengakhiri.',
      { parse_mode: 'Markdown' }
    );
  }
});

bot.onText(/^\/batal(?:\s+(\d+))?$/i, async (msg, match) => {
  const fs = require("fs");
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetIdFromCommand = match[1];
  const replyTo = msg.reply_to_message;
  const isOwner = userId === String(config.OWNER_ID);
  const isPM = msg.chat.type === 'private';

  // ================= GUARD =================
  if (await guardAll(msg)) return;

  // === USER membatalkan sendiri ===
  if (!isOwner && isPM) {
    if (contactSession[userId]) {
      delete contactSession[userId];
      terminatedSession[userId] = true;

      Object.keys(forwardedMap).forEach(key => {
        if (forwardedMap[key] === userId) delete forwardedMap[key];
      });

      saveSession();

      await bot.sendMessage(userId, '✅ Sesi chat dibatalkan. Tekan 📞 Contact Admin untuk mulai lagi.');
      await bot.sendMessage(
        config.OWNER_ID,
        `❌ Sesi chat dengan <code>${userId}</code> dibatalkan oleh user.`,
        { parse_mode: 'HTML' }
      );

      await bot.sendMessage(userId, "💬 Sesi telah berakhir.", {
        reply_markup: { remove_keyboard: true }
      });
    } else {
      await bot.sendMessage(userId, 'ℹ️ Tidak ada sesi chat aktif.', { parse_mode: 'HTML' });
    }
    return;
  }

  // === OWNER membatalkan user ===
  if (!isOwner) return;

  let targetId;
  if (targetIdFromCommand) targetId = targetIdFromCommand;
  else if (replyTo && forwardedMap[replyTo.message_id]) {
    targetId = forwardedMap[replyTo.message_id];
  } else {
    return bot.sendMessage(
      chatId,
      '❌ Format salah.\nGunakan:\n`/batal 123456789`\nAtau balas pesan user.',
      { parse_mode: 'Markdown' }
    );
  }

  if (!contactSession[targetId]) {
    return bot.sendMessage(
      chatId,
      `ℹ️ Tidak ada sesi aktif dengan <code>${targetId}</code>.`,
      { parse_mode: 'HTML' }
    );
  }

  delete contactSession[targetId];
  terminatedSession[targetId] = true;

  Object.keys(forwardedMap).forEach(key => {
    if (forwardedMap[key] === targetId) delete forwardedMap[key];
  });

  saveSession();

  await bot.sendMessage(targetId, '❌ Sesi chat dibatalkan oleh Admin.');
  await bot.sendMessage(
    chatId,
    `✅ Sesi dengan user <code>${targetId}</code> telah dibatalkan.`,
    { parse_mode: 'HTML' }
  );

  await bot.sendMessage(config.OWNER_ID, "💬 Sesi telah ditutup.", {
    reply_markup: { remove_keyboard: true }
  });
});
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const state = userState[userId];
  if (!state) return;
  if (state.mode !== "INPUT_CUSTOM_TOPUP") return;

  const text = (msg.text || "").trim();

  if (!/^\d+$/.test(text)) {
    return bot.sendMessage(
      chatId,
      "❌ Masukkan <b>ANGKA SAJA</b>\nContoh: <code>5000</code>",
      { parse_mode: "HTML" }
    );
  }

  const amount = parseInt(text);
  if (amount < 2000) {
    return bot.sendMessage(
      chatId,
      "🚫 Minimal deposit <b>Rp 2.000</b>",
      { parse_mode: "HTML" }
    );
  }

  // 🔥 AUTO DELETE PESAN USER (ANGKA)
  try {
    await bot.deleteMessage(chatId, msg.message_id);
  } catch {}

  // 🔥 AUTO DELETE MENU "TOP UP CUSTOM"
  try {
    await bot.deleteMessage(chatId, state.menuMessageId);
  } catch {}

  delete userState[userId];

  // 🚀 LANJUT QRIS (NEW MESSAGE)
  return processDepositQRIS(bot, msg, amount);
});
const marginDEPOSITPath = "./database/data_marginDEPOSIT.json";
if (!fs.existsSync(marginDEPOSITPath)) {
  fs.writeFileSync(marginDEPOSITPath, JSON.stringify([], null, 2));
}
async function processDepositQRIS(bot, msg, amount) {
const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name || "unknown";
  const name = msg.from.first_name || "TanpaNama";
const botInfo = await bot.getMe();
const botUsername = botInfo.username
  ? `@${botInfo.username}`
  : "AutoPaymentBot";
  
    const fs = require("fs");
    const axios = require("axios");

    const API_KEY = config.RUMAHOTP;
    const OWNER_ID = config.OWNER_ID;
    const channellog = config.idchannel;

    if (!API_KEY)
      return bot.sendMessage(chatId, `⚠️ *API Key belum diset di config.js!*`, { parse_mode: "Markdown" });

    const BASE_URL = "https://www.rumahotp.com/api/v2/deposit/create";
    const STATUS_URL = "https://www.rumahotp.com/api/v2/deposit/get_status";
    const CANCEL_URL = "https://www.rumahotp.com/api/v1/deposit/cancel";
    const PAYMENT_ID = "qris";
    const pendingPath = "./database/depositPending.json";
    const saldoPath = "./database/saldoOtp.json";
    const depositPath = "./database/deposit.json";

  // ==================
  // Loading animation
  // ==================
  const frames = [
    "🔄 Membuat QRIS [▰▱▱▱▱]",
    "🔄 Membuat QRIS [▰▰▱▱▱]",
    "🔄 Membuat QRIS [▰▰▰▱▱]",
    "🔄 Membuat QRIS [▰▰▰▰▱]",
    "🔄 Membuat QRIS [▰▰▰▰▰]",
    "💫 Menyiapkan QR Code...",
    "⚙️ Menghubungkan server...",
    "✅ Hampir selesai..."
  ];

  let f = 0;

  const loadingMsg = await bot.sendMessage(
    chatId,
    frames[f],
    { parse_mode: "HTML" }
  );

  const loadingInterval = setInterval(async () => {
    f = (f + 1) % frames.length;
    try {
      await bot.editMessageText(frames[f], {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: "HTML"
      });
    } catch {}
  }, 600);

      try {
        if (!fs.existsSync(pendingPath)) fs.writeFileSync(pendingPath, JSON.stringify({}));
        if (!fs.existsSync(saldoPath)) fs.writeFileSync(saldoPath, JSON.stringify({}));
        if (!fs.existsSync(depositPath)) fs.writeFileSync(depositPath, JSON.stringify([]));

        const pendingData = JSON.parse(fs.readFileSync(pendingPath));
        const saldoData = JSON.parse(fs.readFileSync(saldoPath));
        const depositData = JSON.parse(fs.readFileSync(depositPath));

        if (!pendingData[userId]) pendingData[userId] = [];
        // 🔥 CLEANUP EXPIRED & STUCK PENDING
if (pendingData[userId]) {
  const now = Date.now();
  pendingData[userId] = pendingData[userId].filter(d => {
    if (d.expired_at_ts <= now) {
      depositData.push({
        id: d.id,
        userId,
        total: d.total,
        status: "expired",
        tanggal: new Date().toISOString(),
        metode: "QRIS"
      });
      return false;
    }
    return true;
  });
  fs.writeFileSync(pendingPath, JSON.stringify(pendingData, null, 2));
}
// 🔥 CLEANUP EXPIRED PENDING (WAJIB)
if (pendingData[userId]) {
  const now = Date.now();
  const before = pendingData[userId].length;

  pendingData[userId] = pendingData[userId].filter(d => {
    return d.expired_at_ts > now;
  });

  if (before !== pendingData[userId].length) {
    fs.writeFileSync(pendingPath, JSON.stringify(pendingData, null, 2));
  }
}
        if (pendingData[userId].length > 0) {
          clearInterval(loadingInterval);
          try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch {}

          let aktifList = pendingData[userId]
            .map((x, i) => `#${i + 1} • ID: <code>${x.id}</code> • Rp${x.total.toLocaleString("id-ID")}`)
            .join("\n");

return bot.sendMessage(
  chatId,
  `🚫 <b>Kamu masih punya pembayaran QRIS yang belum selesai!</b>

${aktifList}

❗ <b>Selesaikan atau batalkan dulu sebelum membuat QRIS baru.</b>`,
  { parse_mode: "HTML" }
);
}

        // ==== FIX START ====
        const UNTUNG = config.UNTUNG_DEPOSIT || 0; // misal 500
        const totalRequest = amount + UNTUNG;

        // Buat QRIS dengan totalRequest (sudah termasuk fee)
        const response = await axios.get(`${BASE_URL}?amount=${totalRequest}&payment_id=${PAYMENT_ID}`, {
          headers: { "x-apikey": API_KEY, Accept: "application/json" },
        });
        // ==== FIX END ====

const data = response.data;
if (!data.success) {
  clearInterval(loadingInterval);
  try {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
  } catch {}

  return bot.sendMessage(
    chatId,
    "❌ <b>Gagal membuat QRIS.</b> Coba lagi nanti.",
    { parse_mode: "HTML" }
  );
}

        const d = data.data;
const diterima = amount; // saldo masuk tetap sesuai input user
const totalBaru = d.total; // nominal QRIS final dari API
const feeAkhir = totalBaru - diterima; // FEE ADMIN FIX

        const waktuBuat = new Date(d.created_at_ts).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        const expiredBotTs = Date.now() + (5 * 60 * 1000);
const waktuExp = new Date(expiredBotTs).toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta"
});

const caption = `
<b>🔄「 Waiting Payment 」🔄</b>

<blockquote expandable>🧾 <b>ID Pembayaran:</b> <code>${d.id}</code>
💰 <b>Nominal:</b> Rp${totalBaru.toLocaleString("id-ID")}
💵 <b>Admin Fee:</b> Rp${feeAkhir.toLocaleString("id-ID")}
📥 <b>Nominal Diterima:</b> Rp${diterima.toLocaleString("id-ID")}
⏳ <b>Expired:</b> ${waktuExp}

<b>Please scan the QRIS above to complete your payment.
If you encounter any issues, please contact the admin.
Click the ❌ Cancel button below to cancel this transaction.</b></blockquote>

<blockquote>© Auto Payment ${botUsername}</blockquote>
`;

clearInterval(loadingInterval);
try {
  await bot.deleteMessage(chatId, loadingMsg.message_id);
} catch {}

// buat QRIS custom
const customQRPath = await generateCustomQRIS(
  d.qr_image,
  `qris_${d.id}.jpg`
);

// kirim hasil gabungan
const sentMsg = await bot.sendPhoto(
  chatId,
  customQRPath,
  {
    caption,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
      [
        {
          text: "❌ Cancel Payment",
          callback_data: `bataldeposit_${d.id}_${userId}`
        }
      ]
    ]
  }
});
// ===============================
// ⚠️ PESAN PENTING SETELAH QRIS
// ===============================
const warningMsg = await bot.sendMessage(
  chatId,
  `
‼️ <b>PENTING — HARAP DIBACA</b> ‼️

⚠️ <b>Kesalahan yang sering terjadi:</b>

1️⃣ Menekan tombol <b>❌ Batalkan</b> 
<u>SETELAH melakukan pembayaran</u>  
➡️ <b>Saldo TIDAK akan diproses</b> oleh sistem.

2️⃣ Melakukan <b>TRANSFER KE QRIS YANG SAMA LEBIH DARI 1 KALI</b>  
➡️ <b>HANYA pembayaran pertama</b> yang diterima provider  
➡️ <b>Pembayaran ke-2 dan seterusnya TIDAK MASUK</b>  
➡️ <b>TIDAK dapat direfund</b>

🚫 <b>WAJIB DIPERHATIKAN:</b>
• 1 QRIS = 1 kali pembayaran  
• Jangan scan / transfer ulang QRIS yang sama  
• Jangan tekan tombol batal jika sudah membayar  
• Jika sudah transfer namun <b>belum ada proses</b>,  
  <b>JANGAN transfer ulang</b> — segera hubungi admin  
• Sertakan <b>bukti transfer</b> dan <b>teks expired</b> agar admin dapat melakukan pengecekan

⏳ <b>Mohon bersabar</b>, verifikasi membutuhkan waktu
± <b>2 menit</b> setelah pembayaran berhasil.

🙏 Terima kasih atas pengertiannya 😇
`,
  { parse_mode: "HTML" }
);
// SIMPAN ID PESAN QRIS UNTUK DELETE SAAT EXPIRED
pendingData[userId].push({
    id: d.id,
    total: totalBaru,
    status: d.status,
    expired_at_ts: d.expired_at_ts,
    message_id: sentMsg.message_id,   // <===== TAMBAHAN BARU
    warning_message_id: warningMsg.message_id
});
fs.writeFileSync(pendingPath, JSON.stringify(pendingData, null, 2));

        // AUTO CANCEL 5 MENIT
const autoCancelTimer = setTimeout(async () => {
  try {
    const cancelRes = await axios.get(
      `${CANCEL_URL}?deposit_id=${d.id}`,
      { headers: { "x-apikey": API_KEY } }
    );

// ===============================
// 🔥 AUTO CANCEL (FINAL FIX)
// ===============================
if (cancelRes.data.success) {

  const freshPending = JSON.parse(fs.readFileSync(pendingPath));

  // 🔑 AMBIL DATA DULU
  const pendingItem = freshPending?.[userId]?.find(x => x.id === d.id);

  // 🔥 DELETE QRIS
  try {
    if (sentMsg?.message_id) {
      await bot.deleteMessage(chatId, sentMsg.message_id);
    }
  } catch {}

  // 🔥 DELETE WARNING
  try {
    if (pendingItem?.warning_message_id) {
      await bot.deleteMessage(chatId, pendingItem.warning_message_id);
    }
  } catch {}

  // 🔥 BARU HAPUS DARI FILE
  if (freshPending[userId]) {
    freshPending[userId] = freshPending[userId].filter(x => x.id !== d.id);
    fs.writeFileSync(pendingPath, JSON.stringify(freshPending, null, 2));
  }

  await bot.sendMessage(
    chatId,
    `❌ <b>PAYMENT AUTO CANCELLED (5 MINUTES)</b>
━━━━━━━━━━━━━━━━━━
🧾 <b>Transaction ID:</b> <code>${d.id}</code>
💰 <b>Amount:</b> Rp${totalBaru.toLocaleString("id-ID")}
📆 <b>Status:</b> Cancelled`,
    { parse_mode: "HTML" }
  );

      // LOG KE DEPOSIT
      depositData.push({
        id: d.id,
        userId,
        name,
        username,
        total: totalBaru,
        diterima: 0,
        fee: feeAkhir,
        status: "cancelled (auto)",
        tanggal: new Date().toISOString(),
        metode: "QRIS",
      });
      fs.writeFileSync(depositPath, JSON.stringify(depositData, null, 2));

      clearInterval(checkInterval);
    }
  } catch (err) {
    console.error("Auto-cancel error:", err.message);
  }
}, 5 * 60 * 1000);

        // AUTO CHECK STATUS
        const checkInterval = setInterval(async () => {
          try {
            const checkRes = await axios.get(`${STATUS_URL}?deposit_id=${d.id}`, { headers: { "x-apikey": API_KEY } });
            if (checkRes.data.success) {
              const s = checkRes.data.data.status;
if (s === "success") {

    // ======== ANTI DOUBLE EXEC FIX ========
    if (depositLock[d.id]) return;
    depositLock[d.id] = true;
    // ======================================
// ===============================
// 💰 SIMPAN DATA PROFIT / MARGIN
// ===============================
try {
  const marginData = JSON.parse(fs.readFileSync(marginDEPOSITPath));

  const marginValue = UNTUNG; // untung kamu (config)
  const providerFee = feeAkhir - marginValue; // estimasi fee provider

marginData.push({
  type: "deposit_qris",
  trx_id: checkRes.data.data.id,
  user: {
    id: userId,
    name,
    username
  },
  amount_user: diterima,
  amount_paid: totalBaru,
  fee_admin: feeAkhir,
  margin: marginValue, // UNTUNG_DEPOSIT (FIX)
  provider_fee: providerFee > 0 ? providerFee : 0,
  method: "QRIS",
  provider: "RumahOTP",
  status: "success",
  created_at: d.created_at,
  success_at: nowWIB(),
  source: "deposit", // ⬅️ INI
  meta: {             // ⬅️ HARUS ADA KOMA
    note: "Deposit QRIS Berhasil",
    bot: botUsername
  }
});

  fs.writeFileSync(marginDEPOSITPath, JSON.stringify(marginData, null, 2));
} catch (e) {
  console.error("❌ Gagal simpan data margin:", e.message);
}
    clearInterval(checkInterval);
    clearTimeout(autoCancelTimer);
// 🔥 DELETE QRIS
try { await bot.deleteMessage(chatId, sentMsg.message_id); } catch {}

// 🔥 DELETE WARNING
const warnId = pendingData[userId]
  ?.find(x => x.id === d.id)
  ?.warning_message_id;

if (warnId) {
  try { await bot.deleteMessage(chatId, warnId); } catch {}
}

    saldoData[userId] = (saldoData[userId] || 0) + diterima;
    fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));

    const waktuSukses = new Date().toLocaleString("id-ID", {
  timeZone: "Asia/Jakarta"
});

const successMsg = `
💰 <b>DEPOSIT OTP BERHASIL!</b>

🧾 <b>ID Pembayaran:</b> <code>${checkRes.data.data.id}</code>
👤 <b>User:</b> @${username} (<code>${userId}</code>)
💰 <b>Nominal:</b> Rp${totalBaru.toLocaleString("id-ID")}
💵 <b>Biaya Admin:</b> Rp${feeAkhir.toLocaleString("id-ID")}
📥 <b>Diterima:</b> Rp${diterima.toLocaleString("id-ID")}
🏷️ <b>Metode:</b> ${checkRes.data.data.brand_name}
📆 <b>Tanggal:</b> ${waktuSukses}

💳 <b>Saldo kamu telah ditambah Rp${diterima.toLocaleString("id-ID")} secara otomatis!</b>
💰 <b>Saldo Saat Ini:</b> Rp${saldoData[userId].toLocaleString("id-ID")}
`;

await bot.sendMessage(chatId, successMsg, { parse_mode: "HTML" });

    depositData.push({
        id: checkRes.data.data.id,
        userId,
        name,
        username,
        total: totalBaru,
        diterima,
        fee: feeAkhir,
        status: "success",
        tanggal: new Date().toISOString(),
        metode: checkRes.data.data.brand_name,
    });
    fs.writeFileSync(depositPath, JSON.stringify(depositData, null, 2));

    if (channellog) await bot.sendMessage(channellog, successMsg, { parse_mode: "HTML" });
    if (OWNER_ID) await bot.sendMessage(OWNER_ID, successMsg, { parse_mode: "HTML" });

    pendingData[userId] = pendingData[userId].filter((x) => x.id !== d.id);
    fs.writeFileSync(pendingPath, JSON.stringify(pendingData, null, 2));

    delete depositLock[d.id]; // HAPUS LOCK
}
            }
          } catch (err) {
            console.error(`Gagal cek status deposit ${d.id}:`, err.message);
          }
        }, 5000);

      } catch (err) {
        clearInterval(loadingInterval);
        try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch {}
        console.error(err);
return bot.sendMessage(
  chatId,
  `⚠️ <b>Terjadi kesalahan saat membuat QRIS.</b>\n\n<b>Detail:</b> <code>${err.message}</code>`,
  { parse_mode: "HTML" }
);
      }
}

// ==============================================
// 🧾 HANDLE BUTTON "BATAL PEMBAYARAN" (FINAL FIX)
// ==============================================
bot.on("callback_query", async (cb) => {
  try {
    // ✅ FIX: Proper destructuring from callback_query
    const { message, from, data } = cb;
    if (!message) {
      console.warn("[BATALDEPOSIT_GUARD] message is null");
      return;
    }

    if (!data.startsWith("bataldeposit_")) return;

    const fs = require("fs");
    const axios = require("axios");
    const config = require("./config.js");

    const [_, depositId, uid] = data.split("_");
    const userId = from.id.toString();
    const chatId = message.chat?.id;
    const messageId = message.message_id;

    if (userId !== uid) {
      return bot.answerCallbackQuery(cb.id, {
        text: "❌ Kamu tidak bisa membatalkan deposit orang lain!",
        show_alert: true
      });
    }

    const API_KEY = config.RUMAHOTP;
    const CANCEL_URL = "https://www.rumahotp.com/api/v1/deposit/cancel";
    const pendingPath = "./database/depositPending.json";
    const depositPath = "./database/deposit.json";

    if (!fs.existsSync(pendingPath)) fs.writeFileSync(pendingPath, JSON.stringify({}));
    if (!fs.existsSync(depositPath)) fs.writeFileSync(depositPath, JSON.stringify([]));

    const pendingData = JSON.parse(fs.readFileSync(pendingPath));
    const depositData = JSON.parse(fs.readFileSync(depositPath));

    // 🔑 AMBIL DATA PENDING DULU
    const pendingItem = pendingData?.[userId]?.find(x => x.id === depositId);
    if (!pendingItem) {
      return bot.answerCallbackQuery(cb.id, {
        text: "⚠️ Deposit sudah tidak aktif / expired.",
        show_alert: true
      });
    }

    const totalNominal = pendingItem.total || 0;

    // ❌ CANCEL KE API
    const cancelRes = await axios.get(
      `${CANCEL_URL}?deposit_id=${depositId}`,
      { headers: { "x-apikey": API_KEY } }
    );

    if (!cancelRes.data.success) {
      return bot.answerCallbackQuery(cb.id, {
        text: "⚠️ Gagal membatalkan! Mungkin sudah dibayar.",
        show_alert: true
      });
    }

    // 🔥 DELETE QRIS MESSAGE
    try {
      if (pendingItem.message_id) {
        await bot.deleteMessage(chatId, pendingItem.message_id);
      }
    } catch {}

    // 🔥 DELETE WARNING MESSAGE
    try {
      if (pendingItem.warning_message_id) {
        await bot.deleteMessage(chatId, pendingItem.warning_message_id);
      }
    } catch {}

    // 🧹 HAPUS DARI PENDING
    pendingData[userId] = pendingData[userId].filter(x => x.id !== depositId);
    fs.writeFileSync(pendingPath, JSON.stringify(pendingData, null, 2));

    // 🧾 LOG DEPOSIT
    depositData.push({
      id: depositId,
      userId,
      name: cb.from.first_name || "Unknown",
      username: cb.from.username || "TanpaUsername",
      total: totalNominal,
      status: "cancelled",
      tanggal: new Date().toISOString(),
      metode: "QRIS",
    });
    fs.writeFileSync(depositPath, JSON.stringify(depositData, null, 2));

    // 📩 NOTIF USER
    await bot.sendMessage(
      chatId,
      `
❌ <b>Pembayaran Dibatalkan!</b>
━━━━━━━━━━━━━━━━━━
🧾 <b>ID Transaksi:</b> <code>${depositId}</code>
💰 <b>Nominal:</b> Rp${totalNominal.toLocaleString("id-ID")}
💬 <b>Status:</b> Cancelled oleh pengguna
`,
      { parse_mode: "HTML" }
    );

    await bot.answerCallbackQuery(cb.id, {
      text: "✅ Pembayaran berhasil dibatalkan.",
      show_alert: false
    });

  } catch (err) {
    console.error("Error bataldeposit:", err.message);
    await bot.answerCallbackQuery(cb.id, {
      text: "❌ Terjadi kesalahan internal.",
      show_alert: true
    });
  }
});
// ====================================================
// 🧾 COMMANDS — BOT.ONTEXT
// ====================================================
bot.onText(/^\/help$/i, async (msg) => {
  try {
  const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const fullName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();
    const username = msg.from.username || null;
    const name = msg.from.first_name || "pengguna";

    // 🔐 OWNER ONLY (HARD BLOCK)
    if (userId !== config.OWNER_ID.toString()) {
      return bot.sendMessage(
        chatId,
        "❌ <b>COMMAND INI KHUSUS OWNER</b>",
        { parse_mode: "HTML" }
      );
    }

    // === Pesan /ownermenu ===
    const caption = `<blockquote><b>─「 📜 OWNER MENU 」─</b></blockquote>

𖥔 <b>/listh2h</b> — Melihat semua PPOB (H2H)
𖥔 <b>/orderh2h</b> — Kelola order PPOB (H2H)
𖥔 <b>/cairkan</b> — Proses pencairan PPOB

𖥔 <b>/setreferral</b> — Atur sistem Referral Bonus
𖥔 <b>/self</b> — Ubah bot ke mode <i>Self</i> (Owner only)
𖥔 <b>/public</b> — Ubah bot ke mode <i>Public</i>

𖥔 <b>/joinch</b> — Atur kewajiban Join Channel
𖥔 <b>/grouponly</b> — Batasi perintah hanya untuk Group

𖥔 <b>/maintenance</b> — Aktif / Nonaktifkan Maintenance Mode

𖥔 <b>/bluser</b> — Tambahkan user ke Blacklist
𖥔 <b>/unbluser</b> — Hapus user dari Blacklist

𖥔 <b>/broadcast</b> — Kirim pesan ke semua pengguna
𖥔 <b>/stopbc</b> — Hentikan proses Broadcast
𖥔 <b>/delbc</b> — Hapus data Broadcast

𖥔 <b>/addsaldo</b> — Tambah saldo akun pengguna
𖥔 <b>/delsaldo</b> — Kurangi saldo akun pengguna
𖥔 <b>/listsaldo</b> — Lihat daftar saldo seluruh pengguna

𖥔 <b>/setbackup</b> — Atur time Backup data
𖥔 <b>/backup</b> — Jalankan Backup data bot

<blockquote>#- 👑 RajaOTP • Secure OTP Automation</blockquote>`;

    // === Inline Keyboard ===
    const buttons = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "CS ☇ Limit", callback_data: "contact_admin" }],
          [{ text: "⌦ ∂єνєℓσρєя ⌫", url: urladmin }],
        ],
      },
      parse_mode: "HTML",
    };

    // === Kirim foto dengan caption + tombol ===
    await bot.sendPhoto(msg.chat.id, config.linkthumbnail, {
      caption,
      ...buttons,
    });

    // ====================================================
    // 🗑️ BAGIAN NOTIF OWNER DIHAPUS SEPENUHNYA
    // ====================================================

  } catch (err) {
    logError(err, "/ownermenu");
  }
});

// ===============================================
// 📜 COMMAND: /riwayat - Tampilkan history transaksi user
// ===============================================
bot.onText(/^\/riwayat$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  try {
    const history = getTransactionHistory(userId);

    if (history.length === 0) {
      return bot.sendMessage(
        chatId,
        `📭 <b>Belum ada riwayat transaksi.</b>\n\nMulai gunakan layanan OTP kami sekarang untuk melihat history transaksi Anda.`,
        { parse_mode: "HTML" }
      );
    }

    let caption = `📜 <b>RIWAYAT TRANSAKSI ANDA</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

    history.forEach((trx, idx) => {
      const statusEmoji = {
        success: "✅",
        failed: "❌",
        refund: "🔄",
        cancelled: "❌",
        pending: "⏳"
      }[trx.status] || "❓";

      const serviceName = trx.service || trx.layanan || "Unknown";
      const countryName = trx.country || trx.negara || "Unknown";
      const price = typeof trx.price === "number" 
        ? trx.price 
        : parseInt(trx.price) || 0;
      const priceFormat = typeof trx.price === "string"
        ? trx.price
        : `Rp${price.toLocaleString("id-ID")}`;
      const txid = trx.txid || trx.orderId || trx.order_id || "N/A";
      const date = formatTransactionDate(trx.created_at || trx.date);
      const statusText = (trx.status || "unknown").toUpperCase();

      caption += `${idx + 1}️⃣ ${serviceName} • ${countryName}\n`;
      caption += `💰 ${priceFormat}\n`;
      caption += `📌 ${statusEmoji} ${statusText}\n`;
      caption += `🕒 ${date}\n`;
      caption += `TXID: <code>${txid}</code>\n\n`;
    });

    caption += `━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `👑 RajaOTP • Secure OTP Automation`;

    bot.sendMessage(chatId, caption, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🏠 Menu Utama", callback_data: "back_home" }]
        ]
      }
    });
  } catch (err) {
    console.error("❌ Error /riwayat:", err.message);
    bot.sendMessage(
      chatId,
      "❌ <b>Gagal mengambil riwayat transaksi.</b>\nSilakan coba lagi nanti.",
      { parse_mode: "HTML" }
    );
  }
});

bot.onText(/^\/rekap$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  const marginNokosPath = "./database/data_marginNOKOS.json";
  const marginDepositPath = "./database/data_marginDEPOSIT.json";

  const nokosData = loadJsonSafe(marginNokosPath);
  const depositData = loadJsonSafe(marginDepositPath);

  const rekap = buildRekap(nokosData, depositData);

  const text = `
📊 <b>REKAP KEUANGAN BOT</b>
━━━━━━━━━━━━━━━━━━

🟢 <b>NOKOS</b>
• Total Transaksi : <b>${rekap.nokos.total_trx}</b>
• Omzet          : Rp${rekap.nokos.omzet.toLocaleString("id-ID")}
• Modal          : Rp${rekap.nokos.modal.toLocaleString("id-ID")}
• Total Margin   : Rp${rekap.nokos.margin.toLocaleString("id-ID")}
• Margin Hari Ini: Rp${rekap.nokos.today_margin.toLocaleString("id-ID")}
• Margin Bulan Ini: Rp${rekap.nokos.month_margin.toLocaleString("id-ID")}

🔵 <b>DEPOSIT</b>
• Total Transaksi : <b>${rekap.deposit.total_trx}</b>
• Omzet           : Rp${rekap.deposit.omzet.toLocaleString("id-ID")}
• Total Margin    : Rp${rekap.deposit.margin.toLocaleString("id-ID")}
• Margin Hari Ini : Rp${rekap.deposit.today_margin.toLocaleString("id-ID")}
• Margin Bulan Ini: Rp${rekap.deposit.month_margin.toLocaleString("id-ID")}

━━━━━━━━━━━━━━━━━━
💰 <b>TOTAL PROFIT</b>
Rp${(
    rekap.nokos.margin +
    rekap.deposit.margin
  ).toLocaleString("id-ID")}
`;

  bot.sendMessage(chatId, text, { parse_mode: "HTML" });
});

// ===============================================
// 💰 COMMAND: /tukarpoint nominal (kelipatan 1000)
// ===============================================
bot.onText(/^\/tukarpoint(?:\s+(\d+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const nominal = match[1];

  const fs = require("fs");
  const pointPath = "./database/pointSaldo.json";
  const saldoPath = "./database/saldoOtp.json";
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }
  // ==============
  // Load database
  // ==============
  let pointDb = {};
  let saldoDb = {};

  if (fs.existsSync(pointPath)) pointDb = JSON.parse(fs.readFileSync(pointPath));
  if (fs.existsSync(saldoPath)) saldoDb = JSON.parse(fs.readFileSync(saldoPath));

  // pastikan user ada di DB (FORMAT BENAR)
  if (!pointDb[userId]) {
    pointDb[userId] = {
      point_total: 0,
      convert_total: 0,
      history: []
    };
  }

  if (!saldoDb[userId]) saldoDb[userId] = 0;

// ============================
// 📌 Tutorial jika tanpa argumen (HTML)
// ============================
if (!nominal) {
  return bot.sendMessage(
    chatId,
    `<b>📌 Cara penggunaan /tukarpoint:</b>

Gunakan:
➡️ <code>/tukarpoint &lt;nominal&gt;</code>

🎯 Hanya kelipatan <b>1000</b>

Contoh:
<code>/tukarpoint 1000</code>
<code>/tukarpoint 5000</code>
<code>/tukarpoint 20000</code>`,
    { parse_mode: "HTML" }
  );
}

  const amount = parseInt(nominal);

  // ==============================
  // ❌ Cek kelipatan 1000
  // ==============================
  if (amount % 1000 !== 0) {
    return bot.sendMessage(chatId,
      `❌ Nominal tidak valid! Harus kelipatan 1000`,
      { parse_mode: "HTML" }
    );
  }

  // ==============================
  // ❌ Cek point cukup
  // ==============================
  const userPoint = pointDb[userId].point_total;

  if (userPoint < amount) {
    return bot.sendMessage(chatId,
      `❌ Point kamu kurang!
      
Point sekarang: ${userPoint}`,
      { parse_mode: "HTML" }
    );
  }

  // ==============================
  // 🔥 PROSES PENUKARAN
  // ==============================
  pointDb[userId].point_total -= amount;
  pointDb[userId].convert_total += 1;

  // Tambah riwayat
  pointDb[userId].history.push({
    tipe: "convert_point",
    jumlah: -amount,
    tanggal: new Date().toISOString(),
    keterangan: "Tukar point ke saldo"
  });

  saldoDb[userId] += amount;

  // simpan DB
  fs.writeFileSync(pointPath, JSON.stringify(pointDb, null, 2));
  fs.writeFileSync(saldoPath, JSON.stringify(saldoDb, null, 2));

// ==============================
// ✅ Respon berhasil (HTML)
// ==============================
return bot.sendMessage(
  chatId,
  `<b>🎉 Tukar Point Berhasil!</b>

🔻 <b>Point dikurang:</b> <code>${amount}</code>
🔺 <b>Saldo bertambah:</b> <code>${amount}</code>

💰 <b>Sisa Point:</b> <code>${pointDb[userId].point_total}</code>
💵 <b>Total Saldo:</b> <code>${saldoDb[userId]}</code>`,
  { parse_mode: "HTML" }
);
});
// ===============================================
// 🟩 COMMAND: /addpoint <iduser> <nominal>
// ===============================================
bot.onText(/^\/addpoint(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id.toString();
  const fs = require("fs");

  const pointPath = "./database/pointSaldo.json";

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  // 📌 Tutorial jika tanpa argumen
  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      `<b>🟩 Cara Pakai Perintah /addpoint</b>

<b>Format:</b>
<code>/addpoint &lt;iduser&gt; &lt;nominal&gt;</code>

<b>Contoh:</b>
<code>/addpoint 123456789 1000</code>

Nominal bebas (tidak wajib kelipatan).
User akan otomatis dibuat di database jika belum ada.`,
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Parsing argumen
  // ==================
  const args = match[1].trim().split(/\s+/);
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      `⚠️ <b>Format salah!</b>

Gunakan:
<code>/addpoint &lt;iduser&gt; &lt;nominal&gt;</code>`,
      { parse_mode: "HTML" }
    );
  }

  const targetId = args[0];
  const nominal = parseInt(args[1]);

  // ==================
  // Validasi angka
  // ==================
  if (isNaN(nominal) || nominal <= 0) {
    return bot.sendMessage(
      chatId,
      "⚠️ <b>Nominal harus berupa angka dan lebih dari 0!</b>",
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Load database
  // ==================
  let pointDb = {};
  if (fs.existsSync(pointPath)) {
    try {
      pointDb = JSON.parse(fs.readFileSync(pointPath));
    } catch {
      pointDb = {};
    }
  }

  // Jika user belum ada → buat default
  if (!pointDb[targetId]) {
    pointDb[targetId] = {
      point_total: 0,
      convert_total: 0,
      history: []
    };
  }

  // Tambahkan point
  pointDb[targetId].point_total += nominal;

  // Catat riwayat
  pointDb[targetId].history.push({
    tipe: "add_point",
    jumlah: nominal,
    tanggal: new Date().toISOString(),
    keterangan: `Point ditambahkan oleh owner (${senderId})`
  });

  // Simpan DB
  fs.writeFileSync(pointPath, JSON.stringify(pointDb, null, 2));

  // ==================
  // ✅ Respon berhasil
  // ==================
  return bot.sendMessage(
    chatId,
    `<b>🟩 Point Berhasil Ditambahkan!</b>

👤 <b>User ID:</b> <code>${targetId}</code>
➕ <b>Point ditambah:</b> <code>${nominal}</code>
💰 <b>Total point sekarang:</b> <code>${pointDb[targetId].point_total}</code>`,
    { parse_mode: "HTML" }
  );
});
// ===============================================
// 🟥 COMMAND: /delpoint <iduser> <nominal>
// ===============================================
bot.onText(/^\/delpoint(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id.toString();
  const fs = require("fs");

  const pointPath = "./database/pointSaldo.json";

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  // 📌 Tutorial jika tanpa argumen
  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      `<b>🟥 Cara Pakai Perintah /delpoint</b>

<b>Format:</b>
<code>/delpoint &lt;iduser&gt; &lt;nominal&gt;</code>

<b>Contoh:</b>
<code>/delpoint 123456789 500</code>

Nominal adalah jumlah point yang akan dikurangi.`,
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Parsing argumen
  // ==================
  const args = match[1].trim().split(/\s+/);
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      `⚠️ <b>Format salah!</b>

Gunakan:
<code>/delpoint &lt;iduser&gt; &lt;nominal&gt;</code>`,
      { parse_mode: "HTML" }
    );
  }

  const targetId = args[0];
  const nominal = parseInt(args[1]);

  // ==================
  // Validasi nominal
  // ==================
  if (isNaN(nominal) || nominal <= 0) {
    return bot.sendMessage(
      chatId,
      "⚠️ <b>Nominal harus berupa angka dan lebih dari 0!</b>",
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Load database
  // ==================
  let pointDb = {};
  if (fs.existsSync(pointPath)) {
    try {
      pointDb = JSON.parse(fs.readFileSync(pointPath));
    } catch {
      pointDb = {};
    }
  }

  // Jika user belum ada → buat default
  if (!pointDb[targetId]) {
    pointDb[targetId] = {
      point_total: 0,
      convert_total: 0,
      history: []
    };
  }

  const current = pointDb[targetId].point_total;

  // ==================
  // Hitung pengurangan
  // ==================
  const finalPoint = Math.max(0, current - nominal); // tidak boleh minus
  const actuallyRemoved = current - finalPoint;

  // Update point
  pointDb[targetId].point_total = finalPoint;

  // Catat history
  pointDb[targetId].history.push({
    tipe: "del_point",
    jumlah: actuallyRemoved,
    tanggal: new Date().toISOString(),
    keterangan: `Point dikurangi oleh owner (${senderId})`
  });

  // Simpan DB
  fs.writeFileSync(pointPath, JSON.stringify(pointDb, null, 2));

  // ==================
  // ✅ Respon berhasil
  // ==================
  return bot.sendMessage(
    chatId,
    `<b>🟥 Point Berhasil Dikurangi!</b>

👤 <b>User ID:</b> <code>${targetId}</code>
➖ <b>Point dikurangi:</b> <code>${actuallyRemoved}</code>
💰 <b>Total point sekarang:</b> <code>${finalPoint}</code>`,
    { parse_mode: "HTML" }
  );
});
// ===============================================
// 🏆 COMMAND: /listtoppoint (Top 10 user point)
// ===============================================
bot.onText(/^\/listpoint$/i, async (msg) => {
  const chatId = msg.chat.id;
  const fs = require("fs");

  const pointPath = "./database/pointSaldo.json";

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Load database
  // ==================
  let pointDb = {};
  if (fs.existsSync(pointPath)) {
    try {
      pointDb = JSON.parse(fs.readFileSync(pointPath));
    } catch {
      pointDb = {};
    }
  }

  const users = Object.entries(pointDb); // [ [userId, data], ... ]

  if (users.length === 0) {
    return bot.sendMessage(
      chatId,
      "📂 <b>Belum ada data point di database!</b>",
      { parse_mode: "HTML" }
    );
  }

  // ==================
  // Sort terbesar → terkecil
  // ==================
  const sorted = users.sort(
    (a, b) => (b[1].point_total || 0) - (a[1].point_total || 0)
  );

  // Ambil Top 10
  const top = sorted.slice(0, 10);

  // ==================
  // Format pesan
  // ==================
  let text = `<b>🏆 TOP 10 USER POINT</b>\n\n`;

  top.forEach(([id, data], i) => {
    text +=
      `<b>${i + 1}. User ID:</b> <code>${id}</code>\n` +
      `💰 <b>Point:</b> <code>${data.point_total || 0}</code>\n` +
      `🔄 <b>Convert:</b> <code>${data.convert_total || 0}</code>\n\n`;
  });

  return bot.sendMessage(chatId, text, { parse_mode: "HTML" });
});

// ==============================================
// 🛒 /listh2h — Cari Produk H2H RumahOTP (Pagination)
// ==============================================
bot.onText(/^\/listh2h(?:@[\w_]+)?\s*(.*)?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const keyword = (match[1] || "").toLowerCase().trim();

  const axios = require("axios");
  const fs = require("fs");
  const config = require("./config.js");

  if (await guardAll(msg)) return;

  // ============= CEK MAINTENANCE =============
  const maintenancePath = "./database/maintenanceDB.json";

  if (!fs.existsSync("./database")) fs.mkdirSync("./database");

  if (!fs.existsSync(maintenancePath)) {
    fs.writeFileSync(
      maintenancePath,
      JSON.stringify({ settings: { maintenance: false } }, null, 2)
    );
  }

  const db = JSON.parse(fs.readFileSync(maintenancePath, "utf-8"));
  if (db.settings.maintenance) {
    const screen = dailyMaintenance.getMaintenanceScreen();
    return bot.sendMessage(chatId, screen.text, screen.options);
  }

  // 🔒 Hanya owner
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      `🚫 <b>Akses ditolak!</b>\nHanya <b>Owner</b> yang dapat menggunakan perintah ini.`,
      { parse_mode: "HTML" }
    );
  }

  // ❗ Tutorial
  if (!keyword) {
    return bot.sendMessage(
      chatId,
      `
❗ <b>Cara Pakai /listh2h</b>

Gunakan format:
<code>/listh2h &lt;kata kunci&gt;</code>

<b>Contoh:</b>
• <code>/listh2h dana</code>
• <code>/listh2h ff</code>
• <code>/listh2h mlbb 86</code>
• <code>/listh2h pulsa</code>
`,
      { parse_mode: "HTML" }
    );
  }

  try {
    const res = await axios.get(
      "https://www.rumahotp.com/api/v1/h2h/product",
      { headers: { "x-apikey": config.RUMAHOTP } }
    );

    let list = res.data.data || [];

    // 🔥 Harga termurah → termahal
    list.sort((a, b) => a.price - b.price);

    const result = list.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.brand.toLowerCase().includes(keyword) ||
      p.note.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword)
    );

    if (result.length === 0) {
      return bot.sendMessage(
        chatId,
        `⚠️ <b>Tidak ada produk ditemukan</b>\nKata kunci: <code>${keyword}</code>`,
        { parse_mode: "HTML" }
      );
    }

    // Simpan ke memory (pagination)
    const pageSize = 5;
    const totalPages = Math.ceil(result.length / pageSize);

    global.h2hPages = global.h2hPages || {};
    global.h2hPages[chatId] = {
      keyword,
      result,
      pageSize,
      totalPages
    };

    sendH2HPage(bot, chatId, 1);

  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      `❌ <b>Gagal mengambil data produk H2H</b>\nSilakan coba lagi.`,
      { parse_mode: "HTML" }
    );
  }
});

// ==============================================
// FUNGSI KIRIM HALAMAN (EDIT MESSAGE) — HTML
// ==============================================
function sendH2HPage(bot, chatId, page, messageId = null) {
  const data = global.h2hPages?.[chatId];
  if (!data) return;

  const { keyword, result, pageSize, totalPages } = data;

  const start = (page - 1) * pageSize;
  const sliced = result.slice(start, start + pageSize);

  let text = `
📦 <b>Hasil Pencarian Produk H2H</b>
🔍 <b>Kata kunci:</b> <code>${keyword}</code>
📊 <b>Total ditemukan:</b> ${result.length}
📄 <b>Halaman:</b> ${page}/${totalPages}
━━━━━━━━━━━━━━━━━━
`;

  for (const p of sliced) {
    text += `
💠 <b>${p.name}</b>
🧩 <b>Code:</b> <code>${p.code}</code>
🏷️ <b>Brand:</b> ${p.brand}
📂 <b>Kategori:</b> ${p.category}
💬 <b>Note:</b> ${p.note || "-"}
💰 <b>Harga:</b> Rp${p.price.toLocaleString("id-ID")}
━━━━━━━━━━━━━━━━━━
`;
  }

  const buttons = [];
  if (page > 1)
    buttons.push({ text: "⬅️ Prev", callback_data: `h2h_prev_${page}` });
  if (page < totalPages)
    buttons.push({ text: "➡️ Next", callback_data: `h2h_next_${page}` });

  const options = {
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [buttons] }
  };

  // Pertama kali kirim
  if (!messageId) {
    bot.sendMessage(chatId, text, options);
  } else {
    // Pagination edit
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [buttons] }
    }).catch(err => {
    });
  }
}

// ==============================================
// CALLBACK NEXT & PREV (EDIT MODE)
// ==============================================
bot.on("callback_query", (cb) => {
    // ✅ FIX: Proper destructuring from callback_query
    const { message, data } = cb;
    if (!message) {
      console.warn("[H2H_GUARD] message is null");
      return;
    }
    
    const chatId = message.chat?.id;
    const messageId = message.message_id;
    
    // Guard: Ensure message data is available
    if (!chatId || !messageId) {
      console.warn("[H2H_GUARD] Missing chatId or messageId");
      return;
    }

    if (data.startsWith("h2h_next_")) {
        let page = Number(data.split("_")[2]);
        sendH2HPage(bot, chatId, page + 1, messageId);
        bot.answerCallbackQuery(cb.id);
    }

    if (data.startsWith("h2h_prev_")) {
        let page = Number(data.split("_")[2]);
        sendH2HPage(bot, chatId, page - 1, messageId);
        bot.answerCallbackQuery(cb.id);
    }
});
// ==============================================
// 💳 /orderh2h <kode> <target> + AUTO STATUS CHECK (HTML)
// ==============================================
bot.onText(/^\/orderh2h(?:@[\w_]+)?(?:\s+(\S+)\s+(\S+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];
  const target = match[2];
  const userId = msg.from.id.toString();

  const axios = require("axios");
  const config = require("./config.js");

  if (await guardAll(msg)) return;

  // ============= CEK MAINTENANCE =============
  const maintenancePath = "./database/maintenanceDB.json";

  if (!fs.existsSync("./database")) fs.mkdirSync("./database");

  if (!fs.existsSync(maintenancePath)) {
    fs.writeFileSync(
      maintenancePath,
      JSON.stringify({ settings: { maintenance: false } }, null, 2)
    );
  }

  const db = JSON.parse(fs.readFileSync(maintenancePath, "utf-8"));
  if (db.settings.maintenance) {
    const screen = dailyMaintenance.getMaintenanceScreen();
    return bot.sendMessage(chatId, screen.text, screen.options);
  }

  // 🔒 Hanya owner
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "🚫 <b>Akses ditolak!</b>Hanya owner yang dapat menggunakan perintah ini.",
      { parse_mode: "HTML" }
    );
  }

  // ❗ Tutorial
  if (!code || !target) {
    return bot.sendMessage(
      chatId,
`❗ <b>Format salah!</b>
<b>Gunakan:</b>
<code>/orderh2h &lt;kode&gt; &lt;target&gt;</code>
<b>Contoh:</b>
<code>/orderh2h pln 1234567890</code>
<code>/orderh2h pulsa 08951234xxxx</code>
📌 <b>kode</b> = kode produk
📌 <b>target</b> = nomor / tujuan`,
      { parse_mode: "HTML" }
    );
  }

  const loading = await bot.sendMessage(
    chatId,
    "⏳ <b>Memproses transaksi...</b>",
    { parse_mode: "HTML" }
  );

  try {
    // 🔥 Create transaksi
    const url = `https://www.rumahotp.com/api/v1/h2h/transaksi/create?id=${code}&target=${target}`;
    const res = await axios.get(url, {
      headers: { "x-apikey": config.RUMAHOTP }
    });

    if (!res.data.success) {
      return bot.editMessageText(
        `❌ <b>Transaksi gagal!</b>Pesan: ${res.data.message || "-"}`,
        { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
      );
    }

    const d = res.data.data;

    // ======================
    // 🟦 ORDER CREATED
    // ======================
    const initialText = `
✅ <b>Transaksi Berhasil Dibuat!</b>

🛒 <b>Produk:</b> ${d.product?.name || "-"}
🏷️ <b>Brand:</b> ${d.product?.brand || "-"}
🧩 <b>Code:</b> <code>${d.product?.code || "-"}</code>
📂 <b>Kategori:</b> ${d.product?.category || "-"}

🎯 <b>Tujuan:</b> ${d.tujuan}

📌 <b>Status Awal:</b> ${d.status}
🆔 <b>ID Transaksi:</b> <code>${d.id}</code>

⏳ <i>Sedang memantau status transaksi...</i>
`;

    await bot.editMessageText(initialText, {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "HTML"
    });

    // ==========================================
    // 🔥 AUTO CHECK STATUS
    // ==========================================
    const orderId = d.id;

    const interval = setInterval(async () => {
      try {
        const s = await axios.get(
          `https://www.rumahotp.com/api/v1/h2h/transaksi/status?transaksi_id=${orderId}`,
          { headers: { "x-apikey": config.RUMAHOTP } }
        );

        if (!s.data.success) return;
        const st = s.data.data;

        // 🟨 PROCESSING
        if (st.status === "processing") {
          return bot.editMessageText(
`⏳ <b>Transaksi Diproses...</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}
📦 <b>Status:</b> processing

<i>Menunggu respon provider...</i>`,
            { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
          );
        }

        // 🟩 SUCCESS
        if (st.status === "success") {
          clearInterval(interval);
          return bot.editMessageText(
`🎉 <b>TRANSAKSI BERHASIL!</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}
📦 <b>Status:</b> SUCCESS

🧾 <b>Produk:</b> ${st.product?.name}
🏷️ <b>Brand:</b> ${st.product?.brand}
💰 <b>Harga:</b> Rp${st.price.toLocaleString("id-ID")}

🔐 <b>SN:</b><code>${st.response?.sn || "-"}</code>

🕒 <b>Waktu:</b> ${st.response?.time || "-"}

✅ <b>Transaksi selesai.</b>`,
            { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
          );
        }

        // 🟥 FAILED / CANCELED
        if (st.status === "failed" || st.status === "canceled") {
          clearInterval(interval);
          return bot.editMessageText(
`❌ <b>TRANSAKSI GAGAL!</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}

📦 <b>Status:</b> ${st.status.toUpperCase()}
💬 <b>Provider:</b> ${st.response?.status || "-"}

🔁 <b>Refund:</b> ${st.refund ? "✔️ Iya" : "❌ Tidak"}`,
            { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
          );
        }

      } catch (e) {
      }
    }, 5000);

  } catch (err) {
    console.error("ORDER H2H ERROR:", err);
    bot.editMessageText(
      "❌ <b>Terjadi kesalahan saat memproses transaksi.</b>",
      { chat_id: chatId, message_id: loading.message_id, parse_mode: "HTML" }
    );
  }
});
// ==============================================
// 💳 /cairkan <nominal>  — AUTO MAP + AUTO STATUS CHECK (HTML)
// ==============================================
bot.onText(/^\/cairkan(?:@[\w_]+)?(?:\s+(\S+))?(?:\s+(\S+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1] ? match[1].trim() : null;
  const target = match[2] ? match[2].trim() : null;

  const axios = require("axios");
  const config = require("./config.js");
  const userId = msg.from.id.toString();

  if (await guardAll(msg)) return;

  // ============= CEK MAINTENANCE =============
  const maintenancePath = "./database/maintenanceDB.json";

  if (!fs.existsSync("./database")) fs.mkdirSync("./database");

  if (!fs.existsSync(maintenancePath)) {
    fs.writeFileSync(
      maintenancePath,
      JSON.stringify({ settings: { maintenance: false } }, null, 2)
    );
  }

  const db = JSON.parse(fs.readFileSync(maintenancePath, "utf-8"));
  if (db.settings.maintenance) {
    const screen = dailyMaintenance.getMaintenanceScreen();
    return bot.sendMessage(chatId, screen.text, screen.options);
  }

  // 🔒 Hanya owner (HTML)
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "🚫 <b>Akses ditolak!</b>Hanya owner yang dapat menggunakan perintah ini.",
      { parse_mode: "HTML" }
    );
  }

  // ==============================================
  // ❗ Jika tanpa argumen → TAMPILKAN TUTORIAL (HTML)
  // ==============================================
  if (!code) {
    return bot.sendMessage(
      chatId,
`❗ <b>Format salah!</b>
<b>Gunakan perintah:</b>
<code>/cairkan &lt;nominal&gt;</code>
<b>Contoh:</b>
<code>/cairkan 2000</code>
<code>/cairkan 5000</code>
<code>/cairkan 10000</code>
📌 <b>Nominal</b> = jumlah pencairan ke e-wallet
📲 <i>Tujuan otomatis ke nomor yang ada di config</i>`,
      { parse_mode: "HTML" }
    );
  }


// ==============================================
// Jika hanya 1 argumen → tetap anggap user cuma input nominal, beri tutorial
// ==============================================
if (code && !target && isNaN(code)) {
  return bot.sendMessage(
    chatId,
`❗ <b>Format salah!</b>
<b>Untuk input manual:</b>
<code>/cairkan &lt;kode_produk&gt; &lt;nomor_tujuan&gt;</code>
Contoh:
<code>/cairkan D1 081234xxxxxx</code>
<b>Untuk input berdasarkan nominal:</b>
<code>/cairkan 2000</code> <i>(otomatis ke nomor pencairan di config)</i>`,
    { parse_mode: "HTML" }
  );
}

// ⏳ Loading (HTML)
const loading = await bot.sendMessage(
  chatId,
  "⏳ <b>Memproses transaksi...</b>",
  { parse_mode: "HTML" }
);

    try {

        // ==============================================
        // AUTO MAP NOMINAL → CODE DARI CONFIG
        // ==============================================
        let finalCode = code;
        let finalTarget = target;

        // Hanya angka = user minta nominal
        if (!isNaN(code)) {

// ==============================================
// ❌ VALIDASI KELIPATAN 1000 (HTML, TANPA )
// ==============================================
const nominalUser = Number(code);
if (nominalUser % 1000 !== 0) {
  return bot.editMessageText(
`❌ <b>Nominal ${code} tidak valid!</b>
Nominal harus kelipatan <b>1000</b>.

<b>Contoh valid:</b>
• 1000
• 2000
• 5000
• 10000`,
    {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "HTML"
    }
  );
}

            // Mapping prefix H2H sesuai layanan
            const prefixMap = {
                dana: "D",
                gopay: "GPY",
                ovo: "OVO",
                shopeepay: "SHOPE",
                linkaja: "LINK"
            };

            const ewallet = config.type_ewallet_RUMAHOTP?.toLowerCase();
            const prefix = prefixMap[ewallet];

            if (!prefix) {
return bot.editMessageText(
`❌ <b>Prefix untuk e-wallet ${config.type_ewallet_RUMAHOTP} tidak ditemukan!</b>`,
  {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  }
);
            }

            const productRes = await axios.get("https://www.rumahotp.com/api/v1/h2h/product", {
                headers: { "x-apikey": config.RUMAHOTP }
            });

            const all = productRes.data.data || [];

            // Filter produk sesuai prefix ewallet
            const filtered = all.filter(x => x.code.startsWith(prefix));

            // Cari produk berdasarkan angka murni (2000, 5000, dst)
            const found = filtered.find(x => {
                const angkaName = Number(String(x.name).replace(/\D/g, ""));
                const angkaNote = Number(String(x.note).replace(/\D/g, ""));
                return angkaName === nominalUser || angkaNote === nominalUser;
            });

            if (!found) {
return bot.editMessageText(
`❌ <b>Produk dengan nominal ${code} tidak ditemukan</b>
untuk <b>${config.type_ewallet_RUMAHOTP}</b>`,
  {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  }
);
            }

            finalCode = found.code; 
            finalTarget = config.nomor_pencairan_RUMAHOTP;
        }

// Jika user manual input: /orderh2h D1 0812…
if (!finalTarget) {
  return bot.editMessageText(
`⚠️ <b>Format salah!</b>
Contoh:
• <code>/orderh2h 2000</code>
• <code>/orderh2h D1 08123xxxx</code>`,
    {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "HTML"
    }
  );
}

        // ==============================================
        // 🔥 CREATE TRANSAKSI
        // ==============================================
        const url = `https://www.rumahotp.com/api/v1/h2h/transaksi/create?id=${finalCode}&target=${finalTarget}`;
        const res = await axios.get(url, {
            headers: {
                "x-apikey": config.RUMAHOTP,
                "Accept": "application/json"
            }
        });

if (!res.data.success) {
  return bot.editMessageText(
`❌ <b>Transaksi gagal!</b>
Pesan: ${res.data.message || "Tidak diketahui."}`,
    {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: "HTML"
    }
  );
}

        const d = res.data.data;

const initialText =
`✅ <b>Transaksi Berhasil Dibuat!</b>

🛒 <b>Produk:</b> ${d.product?.name || "-"}
🏷️ <b>Brand:</b> ${d.product?.brand || "-"}
🧩 <b>Code:</b> <code>${d.product?.code || "-"}</code>
📂 <b>Kategori:</b> ${d.product?.category || "-"}

🎯 <b>Tujuan:</b> ${d.tujuan}

📌 <b>Status Awal:</b> ${d.status}
🆔 <b>ID Transaksi:</b> <code>${d.id}</code>

⏳ <b>Sedang memantau status transaksi...</b>`;

await bot.editMessageText(initialText, {
  chat_id: chatId,
  message_id: loading.message_id,
  parse_mode: "HTML"
});

        // ==============================================
        // 🔥 AUTO CHECK STATUS TIAP 5 DETIK
        // ==============================================
        const orderId = d.id;

        const interval = setInterval(async () => {
            try {
                const s = await axios.get(
                    `https://www.rumahotp.com/api/v1/h2h/transaksi/status?transaksi_id=${orderId}`,
                    {
                        headers: {
                            "x-apikey": config.RUMAHOTP,
                            "Accept": "application/json"
                        }
                    }
                );

                if (!s.data.success) return;

                const st = s.data.data;

                if (st.status === "processing") {
return bot.editMessageText(
`⏳ <b>Transaksi Diproses...</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}
📦 <b>Status:</b> <b>processing</b>

⏳ Menunggu respon provider...`,
  {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  }
);
                }

                if (st.status === "success") {
                    clearInterval(interval);

return bot.editMessageText(
`🎉 <b>TRANSAKSI BERHASIL!</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}
📦 <b>Status:</b> <b>SUCCESS</b>

🧾 <b>Produk:</b> ${st.product?.name || "-"}
🏷 <b>Brand:</b> ${st.product?.brand || "-"}
💰 <b>Harga:</b> Rp${st.price.toLocaleString("id-ID")}

🔐 <b>SN:</b> <code>${st.response?.sn || "-"}</code>
🕒 <b>Waktu Provider:</b> ${st.response?.time || "-"}

✅ Transaksi selesai.`,
  {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  }
);
                }

                if (st.status === "failed" || st.status === "canceled") {
                    clearInterval(interval);

return bot.editMessageText(
`❌ <b>TRANSAKSI GAGAL!</b>

🆔 <b>ID:</b> <code>${st.id}</code>
🎯 <b>Tujuan:</b> ${st.tujuan}

📦 <b>Status:</b> <b>${(st.status || "FAILED").toUpperCase()}</b>
💬 <b>Pesan Provider:</b> ${st.response?.status || "-"}

🔁 <b>Refund:</b> ${st.refund ? "✔️ Iya" : "❌ Tidak"}`,
  {
    chat_id: chatId,
    message_id: loading.message_id,
    parse_mode: "HTML"
  }
);
                }

            } catch (e) {
                console.log("ERROR AUTO CHECK:", e);
            }

        }, 5000);

    } catch (err) {
        console.error("ORDER H2H ERROR:", err);
        bot.editMessageText(`❌ Terjadi kesalahan saat memproses transaksi.`, {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
        });
    }
});

// ===============================================
// ⚙️ SETTING REFERRAL — OWNER ONLY (FINAL FIX)
// ===============================================
bot.onText(/^\/setreferral(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const args = match[1] ? match[1].split(" ") : [];

  const fs = require("fs");
  const config = require("./config.js");

      if (await guardAll(msg)) return;

  const dbPath = "./database/SystemReferral.json";

  // ===== LOADING REFERRAL JSON =====
  function loadReferral() {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  }

  // ===== SAVE REFERRAL JSON =====
  function saveReferral(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  // Load data sekarang
  let ref = loadReferral();

  // ================================
  // 📘 TUTORIAL SAAT TANPA ARGUMEN
  // ================================
  if (args.length === 0) {
return bot.sendMessage(
  chatId,
  `
⚙️ <b>SETTINGS REFERRAL</b>
Atur sistem referral bot kamu dengan mudah.

==============================
<b>📌 FORMAT PERINTAH</b>
==============================

<b>1️⃣ /setreferral peruser &lt;angka&gt;</b>
💰 Bonus yang diterima PEMILIK link referral  
Contoh: <code>/setreferral peruser 500</code>

<b>2️⃣ /setreferral perdaftar &lt;angka&gt;</b>
🎁 Bonus untuk USER yang daftar lewat link  
Contoh: <code>/setreferral perdaftar 300</code>

<b>3️⃣ /setreferral on</b>
🔵 Mengaktifkan sistem referral

<b>4️⃣ /setreferral off</b>
🔴 Menonaktifkan sistem referral

==============================
<b>📊 STATUS SAAT INI</b>
==============================
• Bonus PerUser: <b>${ref.Referral_PerUser}</b>
• Bonus PerDaftar: <b>${ref.Referral_PerDaftar}</b>
• Status Referral: <b>${ref.Referral_Enabled ? "ON 🔵" : "OFF 🔴"}</b>

Gunakan perintah di atas untuk mengubah pengaturan referral.
  `,
  { parse_mode: "HTML" }
);
  }

  const type = args[0].toLowerCase();

  // ====== /setreferral peruser 500 ======
  if (type === "peruser") {
    const value = parseInt(args[1]);

    if (isNaN(value) || value < 0)
      return bot.sendMessage(chatId, "❌ Masukkan angka yang valid.");

    ref.Referral_PerUser = value;
    saveReferral(ref);

    return bot.sendMessage(chatId, `✅ Bonus <b>PerUser</b> diperbarui menjadi: <b>${value}</b>`, {
      parse_mode: "HTML",
    });
  }

  // ====== /setreferral perdaftar 500 ======
  if (type === "perdaftar") {
    const value = parseInt(args[1]);

    if (isNaN(value) || value < 0)
      return bot.sendMessage(chatId, "❌ Masukkan angka yang valid.");

    ref.Referral_PerDaftar = value;
    saveReferral(ref);

    return bot.sendMessage(chatId, `✅ Bonus <b>PerDaftar</b> diperbarui menjadi: <b>${value}</b>`, {
      parse_mode: "HTML",
    });
  }

  // ====== /setreferral on ======
  if (type === "on") {
    ref.Referral_Enabled = true;
    saveReferral(ref);

return bot.sendMessage(
  chatId,
  "✅ Sistem referral telah <b>DI-AKTIFKAN</b>.",
  { parse_mode: "HTML" }
);
  }

  // ====== /setreferral off ======
  if (type === "off") {
    ref.Referral_Enabled = false;
    saveReferral(ref);

return bot.sendMessage(
  chatId,
  "🔴 Sistem referral telah <b>DI-NONAKTIFKAN</b>.",
  { parse_mode: "HTML" }
);
  }

  return bot.sendMessage(chatId, "❌ Format salah. Ketik <b>/setreferral</b> untuk tutorial lengkap.", {
    parse_mode: "HTML",
  });
});
// ======================= 🔒 /SELF =======================
bot.onText(/^\/self$/i, async (msg) => {
  try {
    const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // 📂 Baca status mode sekarang
    let currentMode = { self: false };
    if (fs.existsSync(modeFile)) {
      try {
        currentMode = JSON.parse(fs.readFileSync(modeFile, "utf8"));
      } catch {
        currentMode = { self: false };
      }
    }

    // ⚠️ Jika sudah self mode
    if (currentMode.self === true) {
      return bot.sendMessage(
        chatId,
        "⚠️ Mode <b>Self</b> sudah aktif sebelumnya!\nTidak perlu diaktifkan lagi.",
        { parse_mode: "HTML" }
      );
    }

    // ✅ Aktifkan mode self
    fs.writeFileSync(modeFile, JSON.stringify({ self: true }, null, 2));
    await bot.sendMessage(
      chatId,
      "🔒 Mode <b>Self</b> berhasil diaktifkan!\nSekarang hanya <b>owner</b> yang bisa menggunakan bot.",
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/self");
  }
});

// ======================= 🌍 /PUBLIC =======================
bot.onText(/^\/public$/i, async (msg) => {
  try {
    const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // 📂 Baca status mode sekarang
    let currentMode = { self: false };
    if (fs.existsSync(modeFile)) {
      try {
        currentMode = JSON.parse(fs.readFileSync(modeFile, "utf8"));
      } catch {
        currentMode = { self: false };
      }
    }

    // ⚠️ Jika sudah mode public
    if (currentMode.self === false) {
      return bot.sendMessage(
        chatId,
        "⚠️ Mode <b>Public</b> sudah aktif sebelumnya!\nTidak perlu diaktifkan lagi.",
        { parse_mode: "HTML" }
      );
    }

    // ✅ Aktifkan mode public
    fs.writeFileSync(modeFile, JSON.stringify({ self: false }, null, 2));
    await bot.sendMessage(
      chatId,
      "🌍 Mode <b>Public</b> berhasil diaktifkan!\nSekarang <b>semua user</b> dapat menggunakan bot.",
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/public");
  }
});

// ======================= ⚙️ /JOINCH =======================
bot.onText(/^\/joinch(?:\s*(on|off))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const arg = match[1];

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // =======================
    // 📌 FIX JSON AUTO-REPAIR
    // =======================
    let current = { status: false };

    try {
      const raw = fs.existsSync(joinChFile)
        ? fs.readFileSync(joinChFile, "utf8").trim()
        : "";

      if (!raw) {
        fs.writeFileSync(joinChFile, JSON.stringify(current, null, 2));
      } else {
        current = JSON.parse(raw);
      }
    } catch {
      current = { status: false };
      fs.writeFileSync(joinChFile, JSON.stringify(current, null, 2));
    }

    const currentStatus = current.status
      ? "Aktif ✅"
      : "Nonaktif ❌";

    // ❓ Tanpa argumen → tampilkan status
    if (!arg) {
      return bot.sendMessage(
        chatId,
`🔐 <b>WAJIB JOIN CHANNEL</b>

Status saat ini: <b>${currentStatus}</b>

Gunakan perintah:
• <code>/joinch on</code>  → Aktifkan wajib join
• <code>/joinch off</code> → Nonaktifkan wajib join`,
        { parse_mode: "HTML" }
      );
    }

    // 🔄 Ubah status
    const status = arg.toLowerCase() === "on";
    fs.writeFileSync(joinChFile, JSON.stringify({ status }, null, 2));

    await bot.sendMessage(
      chatId,
      `🔐 Fitur <b>wajib join channel</b> sekarang <b>${status ? "AKTIF ✅" : "NONAKTIF ❌"}</b>.`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/joinch");
  }
});

// ======================= ⚙️ /MAINTENANCE =======================
bot.onText(/^\/maintenance(?:\s*(on|off))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const arg = match[1];
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // ============================
    // 📌 AUTO-REPAIR JSON (ANTI ERROR)
    // ============================
    let current = { status: false };

    try {
      const raw = fs.existsSync(maintenanceFile)
        ? fs.readFileSync(maintenanceFile, "utf8").trim()
        : "";

      if (!raw) {
        fs.writeFileSync(maintenanceFile, JSON.stringify(current, null, 2));
      } else {
        current = JSON.parse(raw);
      }
    } catch {
      current = { status: false };
      fs.writeFileSync(maintenanceFile, JSON.stringify(current, null, 2));
    }

    const currentStatus = current.status ? "Aktif ✅" : "Nonaktif ❌";

    // ❓ Jika tanpa argumen → tampilkan status
    if (!arg) {
      return bot.sendMessage(
        chatId,
`🛠️ <b>MAINTENANCE MODE</b>

Status saat ini: <b>${currentStatus}</b>

Gunakan perintah:
• <code>/maintenance on</code>  → Aktifkan maintenance
• <code>/maintenance off</code> → Nonaktifkan maintenance`,
        { parse_mode: "HTML" }
      );
    }

    // 🔄 Ubah status
    const status = arg.toLowerCase() === "on";
    fs.writeFileSync(maintenanceFile, JSON.stringify({ status }, null, 2));

    await bot.sendMessage(
      chatId,
      `⚙️ <b>Maintenance mode</b> sekarang <b>${status ? "AKTIF ✅" : "NONAKTIF ❌"}</b>.`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/maintenance");
  }
});

// ======================= ⚙️ /GROUPONLY =======================
bot.onText(/^\/grouponly(?:\s*(on|off))?$/i, async (msg, match) => {
  try {
    const arg = match[1];
    const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // 📂 Lokasi file
    const groupOnlyFile = path.join(__dirname, "./database/grouponly.json");

    // ============================
    // 📌 AUTO-REPAIR JSON (ANTI ERROR)
    // ============================
    let current = { status: false };

    try {
      const raw = fs.existsSync(groupOnlyFile)
        ? fs.readFileSync(groupOnlyFile, "utf8").trim()
        : "";

      if (!raw) {
        fs.writeFileSync(groupOnlyFile, JSON.stringify(current, null, 2));
      } else {
        current = JSON.parse(raw);
      }
    } catch {
      current = { status: false };
      fs.writeFileSync(groupOnlyFile, JSON.stringify(current, null, 2));
    }

    const currentStatus = current.status ? "Aktif ✅" : "Nonaktif ❌";

    // ❓ Tanpa argumen → tampilkan status
    if (!arg) {
      return bot.sendMessage(
        chatId,
`👥 <b>GROUP ONLY MODE</b>

Status saat ini: <b>${currentStatus}</b>

Gunakan perintah:
• <code>/grouponly on</code>  → Bot hanya merespon di grup
• <code>/grouponly off</code> → Bot aktif di semua chat`,
        { parse_mode: "HTML" }
      );
    }

    // 🔄 Update status
    const status = arg.toLowerCase() === "on";
    fs.writeFileSync(groupOnlyFile, JSON.stringify({ status }, null, 2));

    await bot.sendMessage(
      chatId,
      `👥 <b>GroupOnly mode</b> sekarang <b>${status ? "AKTIF ✅" : "NONAKTIF ❌"}</b> ${
        status
          ? "Bot <b>tidak akan merespon chat private</b>."
          : "Bot <b>bisa digunakan di grup & private</b>."
      }`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/grouponly");
  }
});

// ====================== ⚫ /BL & /BLACKLIST (Owner Only) ======================
bot.onText(/^\/(?:bl|blacklist|bluser)(?:\s+(.*))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    // 🔐 STEP 1: GUARD GLOBAL
    if (await guardAll(msg)) return;

    // 🔒 STEP 2: OWNER ONLY
    if (userId !== config.OWNER_ID.toString()) {
      return bot.sendMessage(
        chatId,
        "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
        { parse_mode: "HTML" }
      );
    }

    // ❓ Tanpa argumen → tutorial
    if (!match[1]) {
      return bot.sendMessage(
        chatId,
`📝 <b>CARA MENAMBAHKAN BLACKLIST</b>

Format:
<code>/bl &lt;user_id&gt;[, alasan]</code>

Contoh:
<code>/bl 123456789</code>
<code>/bl 123456789, Melanggar aturan bot</code>

Catatan:
Alasan bersifat <b>opsional</b>.`,
        { parse_mode: "HTML" }
      );
    }

    // ============================
    // 🧩 PARSING ARGUMEN (FIX)
    // ============================
    const args = match[1].split(",");
    const targetId = args[0].trim();
    const alasan = args.slice(1).join(",").trim() || "-";

    // ❌ User ID kosong
    if (!targetId) {
      return bot.sendMessage(
        chatId,
        "❌ <b>User ID wajib diisi!</b>",
        { parse_mode: "HTML" }
      );
    }

    // ============================
    // 📌 AUTO-REPAIR JSON
    // ============================
    let blacklist = [];

    try {
      const raw = fs.existsSync(blacklistFile)
        ? fs.readFileSync(blacklistFile, "utf8").trim()
        : "";

      if (!raw) {
        fs.writeFileSync(blacklistFile, JSON.stringify([], null, 2));
      } else {
        blacklist = JSON.parse(raw);
        if (!Array.isArray(blacklist)) throw new Error("Invalid format");
      }
    } catch {
      blacklist = [];
      fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));
    }

    // 🚫 Cek sudah ada
    if (blacklist.find(u => u.id === targetId)) {
      return bot.sendMessage(
        chatId,
        `⚠️ User <code>${targetId}</code> sudah ada di <b>blacklist</b>.`,
        { parse_mode: "HTML" }
      );
    }

    const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    // ➕ Tambahkan blacklist
    blacklist.push({ id: targetId, alasan, waktu });
    fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));

    await bot.sendMessage(
      chatId,
`🚫 <b>BLACKLIST BERHASIL DITAMBAHKAN</b>

👤 <b>User ID:</b> <code>${targetId}</code>
📋 <b>Alasan:</b> ${alasan}
🕒 <b>Waktu:</b> ${waktu}

User ini <b>tidak dapat menggunakan bot</b> lagi.`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.error(err);
    logError(err, "/bl");
  }
});

// ====================== ⚪ /UNBL & /UNBLACKLIST (Owner Only) ======================
bot.onText(/^\/(?:unbl|unblacklist|unbluser)(?:\s+(.*))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    // 📂 Lokasi file blacklist
    const blacklistFile = path.join(__dirname, "./database/blacklist.json");

    // ============================
    // 📌 AUTO-REPAIR JSON
    // ============================
    let blacklist = [];

    try {
      const raw = fs.existsSync(blacklistFile)
        ? fs.readFileSync(blacklistFile, "utf8").trim()
        : "";

      if (!raw) {
        fs.writeFileSync(blacklistFile, JSON.stringify([], null, 2));
      } else {
        blacklist = JSON.parse(raw);
        if (!Array.isArray(blacklist)) throw new Error("Invalid format");
      }
    } catch {
      blacklist = [];
      fs.writeFileSync(blacklistFile, JSON.stringify([], null, 2));
    }

    // ❓ Tanpa argumen → tutorial
    if (!match[1]) {
      return bot.sendMessage(
        chatId,
`📝 <b>CARA MENGHAPUS BLACKLIST</b>

Gunakan format:
<code>/unbl &lt;user_id&gt;</code>

Contoh:
<code>/unbl 123456789</code>

User yang dihapus dari blacklist akan bisa menggunakan bot kembali.`,
        { parse_mode: "HTML" }
      );
    }

    const targetId = match[1].trim();

    // 🔍 Cari user
    const index = blacklist.findIndex(u => String(u.id) === String(targetId));

    if (index === -1) {
      return bot.sendMessage(
        chatId,
        `ℹ️ User <code>${targetId}</code> <b>tidak ditemukan</b> di daftar blacklist.`,
        { parse_mode: "HTML" }
      );
    }

    const removedUser = blacklist[index];
    blacklist.splice(index, 1);
    fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));

    await bot.sendMessage(
      chatId,
`✅ <b>BLACKLIST BERHASIL DIHAPUS</b>

👤 <b>User ID:</b> <code>${targetId}</code>
📋 <b>Alasan Sebelumnya:</b> ${removedUser.alasan || "-"}
🕒 <b>Diblacklist Pada:</b> ${removedUser.waktu || "-"}

User ini sekarang <b>sudah bisa menggunakan bot kembali</b>.`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    logError(err, "/unbl");
  }
});

// =====================================================
// 💰 /ADDSALDO <idUser> <nominal> (OWNER ONLY)
// Auto tutorial + auto repair + notifikasi lengkap
// =====================================================
bot.onText(/^\/addsaldo(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    const targetId = match[1];
    const nominal = Number(match[2]);

    // ❓ Tutorial
    if (!targetId || !nominal) {
      return bot.sendMessage(
        chatId,
`📘 <b>CARA PAKAI /ADDSALDO</b>

Format:
<code>/addsaldo &lt;id_user&gt; &lt;nominal&gt;</code>

Contoh:
<code>/addsaldo 8333063872 5000</code>

• ID User = ID Telegram
• Nominal = angka tanpa titik`,
        { parse_mode: "HTML" }
      );
    }

    if (isNaN(nominal) || nominal <= 0) {
      return bot.sendMessage(
        chatId,
        "❌ <b>Nominal tidak valid!</b>Harus berupa angka lebih dari 0.",
        { parse_mode: "HTML" }
      );
    }

    const saldoPath = "./database/saldoOtp.json";

    // ============================
    // 📌 AUTO-REPAIR FILE SALDO
    // ============================
    let saldoData = {};

    try {
      if (!fs.existsSync(saldoPath)) {
        fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
      }
      const raw = fs.readFileSync(saldoPath, "utf8").trim();
      saldoData = raw ? JSON.parse(raw) : {};
    } catch {
      saldoData = {};
      fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
    }

    const before = Number(saldoData[targetId] || 0);
    saldoData[targetId] = before + nominal;
    fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));

    const after = saldoData[targetId];

    // ============================
    // 🔔 1️⃣ NOTIFIKASI ADMIN
    // ============================
    await bot.sendMessage(
      chatId,
`✅ <b>SALDO BERHASIL DITAMBAHKAN</b>

👤 <b>User ID:</b> <code>${targetId}</code>
➕ <b>Tambah:</b> Rp${toRupiah(nominal)}
💵 <b>Sebelumnya:</b> Rp${toRupiah(before)}
💼 <b>Sekarang:</b> Rp${toRupiah(after)}`,
      { parse_mode: "HTML" }
    );

    // ============================
    // 🔔 2️⃣ NOTIFIKASI USER
    // ============================
    bot.sendMessage(
      targetId,
`🎉 <b>SALDO ANDA BERTAMBAH</b>

➕ <b>Tambahan:</b> Rp${toRupiah(nominal)}
💵 <b>Sebelumnya:</b> Rp${toRupiah(before)}
💼 <b>Total Sekarang:</b> Rp${toRupiah(after)}

Terima kasih telah menggunakan layanan kami 🙏`,
      { parse_mode: "HTML" }
    ).catch(() => {});

  } catch (err) {
    logError(err, "/addsaldo");
  }
});
// =====================================================
// ❌ /DELSALDO <idUser> <nominal> (OWNER ONLY)
// Auto tutorial + auto repair + notifikasi lengkap
// =====================================================
bot.onText(/^\/delsaldo(?:\s+(\d+))?(?:\s+(\d+))?$/i, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    const targetId = match[1];
    const nominal = Number(match[2]);

    // ❓ Tutorial
    if (!targetId || !nominal) {
      return bot.sendMessage(
        chatId,
`📘 <b>CARA PAKAI /DELSALDO</b>

Format:
<code>/delsaldo &lt;id_user&gt; &lt;nominal&gt;</code>

Contoh:
<code>/delsaldo 8333063872 5000</code>

• ID User = ID Telegram
• Nominal = angka tanpa titik`,
        { parse_mode: "HTML" }
      );
    }

    if (isNaN(nominal) || nominal <= 0) {
      return bot.sendMessage(
        chatId,
        "❌ <b>Nominal tidak valid!</b>Harus berupa angka lebih dari 0.",
        { parse_mode: "HTML" }
      );
    }

    const saldoPath = "./database/saldoOtp.json";

    // ============================
    // 📌 AUTO-REPAIR FILE SALDO
    // ============================
    let saldoData = {};

    try {
      if (!fs.existsSync(saldoPath)) {
        fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
      }
      const raw = fs.readFileSync(saldoPath, "utf8").trim();
      saldoData = raw ? JSON.parse(raw) : {};
    } catch {
      saldoData = {};
      fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
    }

    const before = Number(saldoData[targetId] || 0);

    // ❌ Saldo tidak cukup
    if (before < nominal) {
      return bot.sendMessage(
        chatId,
`❌ <b>SALDO TIDAK MENCUKUPI</b>

👤 <b>User ID:</b> <code>${targetId}</code>
💵 <b>Saldo Saat Ini:</b> Rp${toRupiah(before)}
➖ <b>Diminta:</b> Rp${toRupiah(nominal)}`,
        { parse_mode: "HTML" }
      );
    }

    // Kurangi saldo
    saldoData[targetId] = before - nominal;
    fs.writeFileSync(saldoPath, JSON.stringify(saldoData, null, 2));

    const after = saldoData[targetId];

    // ============================
    // 🔔 1️⃣ NOTIFIKASI ADMIN
    // ============================
    await bot.sendMessage(
      chatId,
`❌ <b>SALDO BERHASIL DIKURANGI</b>

👤 <b>User ID:</b> <code>${targetId}</code>
➖ <b>Dikurangi:</b> Rp${toRupiah(nominal)}
💵 <b>Sebelumnya:</b> Rp${toRupiah(before)}
💼 <b>Sekarang:</b> Rp${toRupiah(after)}`,
      { parse_mode: "HTML" }
    );

    // ============================
    // 🔔 2️⃣ NOTIFIKASI USER
    // ============================
    bot.sendMessage(
      targetId,
`⚠️ <b>SALDO ANDA DIKURANGI</b>

➖ <b>Pengurangan:</b> Rp${toRupiah(nominal)}
💵 <b>Sebelumnya:</b> Rp${toRupiah(before)}
💼 <b>Total Sekarang:</b> Rp${toRupiah(after)}

Jika ada kesalahan, silakan hubungi admin.`,
      { parse_mode: "HTML" }
    ).catch(() => {});

  } catch (err) {
    logError(err, "/delsaldo");
  }
});
// =====================================================
// 📋 /LISTSALDO — LIST SEMUA SALDO USER (OWNER ONLY)
// Fast | Safe | HTML | Auto limit
// =====================================================
bot.onText(/^\/listsaldo$/i, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();
    const saldoPath = "./database/saldoOtp.json";
    const fs = require("fs");

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    if (!fs.existsSync(saldoPath)) {
      return bot.sendMessage(chatId, "📭 <b>Data saldo belum tersedia.</b>", {
        parse_mode: "HTML",
      });
    }

    const saldoData = JSON.parse(fs.readFileSync(saldoPath, "utf8") || "{}");
    const entries = Object.entries(saldoData);

    if (entries.length === 0) {
      return bot.sendMessage(chatId, "📭 <b>Belum ada user yang memiliki saldo.</b>", {
        parse_mode: "HTML",
      });
    }

    let totalSaldo = 0;
    let teks = `📋 <b>DAFTAR SALDO USER</b>\n━━━━━━━━━━━━━━\n\n`;

    // ⚡ Ambil username paralel
    const results = await Promise.all(
      entries.map(async ([id, saldo]) => {
        let nama = "Tidak diketahui";
        try {
          const user = await bot.getChat(id);
          if (user.username) nama = `@${user.username}`;
          else if (user.first_name) nama = user.first_name;
        } catch {}
        return { id, saldo: Number(saldo), nama };
      })
    );

    for (const u of results) {
      totalSaldo += u.saldo;

      const row =
`🆔 <code>${u.id}</code>
👤 ${u.nama}
💰 Rp${toRupiah(u.saldo)}

`;

      // ✂️ Cegah kepanjangan pesan
      if ((teks + row).length > 3800) {
        teks += "⚠️ <i>Data terpotong karena terlalu panjang.</i>\n";
        break;
      }

      teks += row;
    }

    teks += `━━━━━━━━━━━━━━
👥 <b>Total User:</b> ${results.length}
💰 <b>Total Saldo:</b> Rp${toRupiah(totalSaldo)}`;

    bot.sendMessage(chatId, teks, { parse_mode: "HTML" });

  } catch (err) {
    logError(err, "/listsaldo");
  }
});
// ===========================================================
// 📢 /broadcast & /bcbot — SAFE BROADCAST SYSTEM (OWNER ONLY)
// Anti Flood | Lock | Progress | Delete Support
// ===========================================================
bot.onText(/^\/(broadcast|bcbot|bc|fw|forward|bcf)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id.toString();
  const cmd = match[1];

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  if (!msg.reply_to_message) {
 return bot.sendMessage(
      chatId,
      `❗ <b>Reply pesan yang ingin dikirim</b>\nLalu ketik <code>/${cmd}</code>`,
      { parse_mode: "HTML" }
    );
  }

  const fs = require("fs");
  const crypto = require("crypto");

  const userPath = "./users.json";
  const lockPath = "./temp/broadcast.lock";
  const failedPath = "./temp/broadcast_failed.json";
  const logPath = "./temp/broadcast_logs.json";

  if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");

  if (fs.existsSync(lockPath)) {
    return bot.sendMessage(
      chatId,
      "⚠️ <b>Broadcast sedang berjalan!</b>\nGunakan <code>/stopbc</code> untuk menghentikan.",
      { parse_mode: "HTML" }
    );
  }

  if (!fs.existsSync(userPath)) {
    return bot.sendMessage(chatId, "❌ users.json tidak ditemukan.");
  }

  let users = JSON.parse(fs.readFileSync(userPath));
  if (!Array.isArray(users) || users.length === 0) {
    return bot.sendMessage(chatId, "📭 Tidak ada user terdaftar.");
  }

  // 🔑 Generate BC ID
  const bcId = "BC-" + crypto.randomBytes(3).toString("hex");

  // Init log
  if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "{}");
  const bcLogs = JSON.parse(fs.readFileSync(logPath));
  bcLogs[bcId] = [];
  fs.writeFileSync(logPath, JSON.stringify(bcLogs, null, 2));

  // 🔐 Lock
  fs.writeFileSync(lockPath, Date.now().toString());

  let success = 0;
  let failed = 0;
  let failedIds = [];

  const delay = 600;
  const start = Date.now();

  const statusMsg = await bot.sendMessage(
    chatId,
    `🚀 <b>Broadcast dimulai</b>\n` +
    `🆔 BC ID: <code>${bcId}</code>\n` +
    `📊 Total: 0/${users.length}`,
    { parse_mode: "HTML" }
  );

  for (let i = 0; i < users.length; i++) {
    if (!fs.existsSync(lockPath)) break;

    const uid = users[i].toString();

    try {
      const sent = await bot.forwardMessage(
        uid,
        chatId,
        msg.reply_to_message.message_id
      );

      success++;

      const logs = JSON.parse(fs.readFileSync(logPath));
      logs[bcId].push({
        userId: uid,
        messageId: sent.message_id
      });
      fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    } catch {
      failed++;
      failedIds.push(uid);
    }

    const done = success + failed;

    if (done % 10 === 0 || done === users.length) {
      const percent = Math.floor((done / users.length) * 100);
      await bot.editMessageText(
        `📢 <b>Broadcast berjalan</b>\n\n` +
        `🆔 BC ID: <code>${bcId}</code>\n` +
        `📊 Progress: <b>${percent}%</b>\n` +
        `🟢 Berhasil: ${success}\n` +
        `🔴 Gagal: ${failed}\n` +
        `📬 Total: ${done}/${users.length}\n\n` +
        `🧹 Hentikan broadcast:\n<code>/stopbc</code>`,
        {
          chat_id: statusMsg.chat.id,
          message_id: statusMsg.message_id,
          parse_mode: "HTML"
        }
      ).catch(() => {});
    }

    await new Promise(r => setTimeout(r, delay));
  }

  // Cleanup
  if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  if (failedIds.length > 0) {
    fs.writeFileSync(failedPath, JSON.stringify(failedIds, null, 2));
  }

  const durasi = ((Date.now() - start) / 1000).toFixed(1);

  await bot.sendMessage(
    chatId,
    `✅ <b>Broadcast selesai!</b>\n\n` +
    `🆔 <b>BC ID:</b> <code>${bcId}</code>\n` +
    `📬 Total: ${users.length}\n` +
    `🟢 Berhasil: ${success}\n` +
    `🔴 Gagal: ${failed}\n` +
    `⏱ Durasi: ${durasi} detik\n\n` +
    `🧹 Hapus broadcast:\n<code>/delbc ${bcId}</code>`,
    { parse_mode: "HTML" }
  );

  bot.deleteMessage(statusMsg.chat.id, statusMsg.message_id).catch(() => {});
});
bot.onText(/^\/stopbc$/i, async (msg) => {
  if (msg.from.id.toString() !== config.OWNER_ID.toString()) return;

  const fs = require("fs");
    const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }
  const lockPath = "./temp/broadcast.lock";

  if (!fs.existsSync(lockPath)) {
    return bot.sendMessage(msg.chat.id, "⚠️ Tidak ada broadcast berjalan.");
  }

  fs.unlinkSync(lockPath);
  bot.sendMessage(msg.chat.id, "⛔ Broadcast dihentikan paksa.");
});
// ===========================================================
// 🧹 /delbc <BC_ID> — Delete broadcast message from all users
// ===========================================================
bot.onText(/^\/delbc(?:\s+(.+))?$/i, async (msg, match) => {
  const fromId = msg.from.id.toString();
  const chatId = msg.chat.id;
  const bcId = match[1];

  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }
  // 📘 Tutorial jika tanpa argumen
  if (!bcId) {
    return bot.sendMessage(
      chatId,
      `<b>🧹 TUTORIAL HAPUS BROADCAST</b>\n\n` +
      `Gunakan perintah ini untuk <b>menghapus pesan broadcast</b> dari semua user.\n\n` +
      `<b>📌 Cara pakai:</b>\n<code>/delbc BC-ID</code>\n\n` +
      `<b>📍 Contoh:</b>\n<code>/delbc BC-a3f91c</code>`,
      { parse_mode: "HTML" }
    );
  }

  const fs = require("fs");
  const logPath = "./temp/broadcast_logs.json";

  if (!fs.existsSync(logPath)) {
    return bot.sendMessage(chatId, "❌ Data broadcast tidak ditemukan.");
  }

  const logs = JSON.parse(fs.readFileSync(logPath));
  if (!logs[bcId]) {
    return bot.sendMessage(
      chatId,
      `❌ <b>BC ID tidak valid</b>\nGunakan <code>/delbc</code> untuk tutorial.`,
      { parse_mode: "HTML" }
    );
  }

  const targets = logs[bcId];
  const total = targets.length;

  let success = 0;
  let failed = 0;

  // 🚀 Kirim status awal
  const statusMsg = await bot.sendMessage(
    chatId,
    `🧹 <b>Menghapus broadcast...</b>\n\n` +
    `🆔 BC ID: <code>${bcId}</code>\n` +
    `📊 Progress: 0%\n` +
    `🟢 Terhapus: 0\n` +
    `🔴 Gagal: 0\n` +
    `📬 Total: 0/${total}`,
    { parse_mode: "HTML" }
  );

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];

    try {
      await bot.deleteMessage(item.userId, item.messageId);
      success++;
    } catch {
      failed++;
    }

    const done = success + failed;

    // ✨ Update animasi tiap 5 user / terakhir
    if (done % 5 === 0 || done === total) {
      const percent = Math.floor((done / total) * 100);
      await bot.editMessageText(
        `🧹 <b>Menghapus broadcast...</b>\n\n` +
        `🆔 BC ID: <code>${bcId}</code>\n` +
        `📊 Progress: <b>${percent}%</b>\n` +
        `🟢 Terhapus: ${success}\n` +
        `🔴 Gagal: ${failed}\n` +
        `📬 Total: ${done}/${total}`,
        {
          chat_id: statusMsg.chat.id,
          message_id: statusMsg.message_id,
          parse_mode: "HTML"
        }
      ).catch(() => {});
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // 🧹 Hapus log BC
  delete logs[bcId];
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  // ✅ Final result
  await bot.editMessageText(
    `✅ <b>Broadcast berhasil dihapus!</b>\n\n` +
    `🆔 BC ID: <code>${bcId}</code>\n` +
    `🟢 Terhapus: ${success}\n` +
    `🔴 Gagal: ${failed}\n` +
    `📬 Total: ${total}`,
    {
      chat_id: statusMsg.chat.id,
      message_id: statusMsg.message_id,
      parse_mode: "HTML"
    }
  );
});
// ===============================================
// 🔧 /setbackup <menit> — Atur Interval Auto-Backup
// Alias: /settime, /setautobackup
// ===============================================
bot.onText(/^\/(?:setbackup|settime|setautobackup)(?:\s+(\d+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

    const minutes = Number(match[1]);
    const dataFile = "./database/lastBackup.json";

    // ===========================
    // 📌 TANPA ARGUMEN → TAMPILKAN TUTORIAL
    // ===========================
    if (!minutes) {
        const data = fs.existsSync(dataFile)
            ? JSON.parse(fs.readFileSync(dataFile, "utf8"))
            : {};

        const interval = data.interval_minutes || (backupManager.intervalMs / 60000);

        return bot.sendMessage(
            chatId,
            `<b>📦 TUTORIAL AUTO BACKUP</b>\n\n` +
            `Perintah ini digunakan untuk mengatur <b>interval auto-backup</b>.\n\n` +
            `<b>⏱ Status saat ini:</b>\n` +
            `• Interval: <b>${interval} menit</b>\n` +
            `• Backup terakhir: <b>${data.last_backup || "-"}</b>\n` +
            `• Backup selanjutnya: <b>${data.next_backup || "-"}</b>\n\n` +
            `<b>📌 Cara pakai:</b>\n` +
            `<code>/setbackup &lt;menit&gt;</code>\n\n` +
            `<b>📍 Contoh:</b>\n` +
            `• <code>/setbackup 30</code> → backup setiap 30 menit\n` +
            `• <code>/setbackup 120</code> → backup setiap 2 jam\n\n` +
            `<b>ℹ️ Catatan:</b>\n` +
            `• Minimal interval: 1 menit\n` +
            `• Hanya Owner yang bisa mengubah\n` +
            `• Backup selanjutnya akan dihitung ulang setelah perubahan`,
            { parse_mode: "HTML" }
        );
    }

    // ===========================
    // ❌ VALIDASI INPUT
    // ===========================
    if (minutes < 1) {
        return bot.sendMessage(
            chatId,
            "❌ <b>Minimal interval adalah 1 menit.</b>",
            { parse_mode: "HTML" }
        );
    }

    // ===========================
    // ✔ SIMPAN INTERVAL BARU
    // ===========================
    backupManager.setIntervalMinutes(minutes);

    // ===========================
    // 🔁 RESTART AUTO BACKUP
    // ===========================
    backupManager.startAutoBackup();

    // ===========================
    // ✅ NOTIFIKASI
    // ===========================
    return bot.sendMessage(
        chatId,
        `✅ <b>Interval auto-backup berhasil diubah!</b>\n\n` +
        `⏱ Interval baru: <b>${minutes} menit</b>`,
        { parse_mode: "HTML" }
    );
});
// ============================================================
// 📦 BACKUP SYSTEM — RajaOTP (FINAL FIX V3)
// ✔ Backup folder + file campuran (support spasi)
// ============================================================
bot.onText(/^\/backup$/i, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const OWNER_ID = config.OWNER_ID;

 // 🔐 STEP 1: GUARD GLOBAL (JOIN, BL, MAINT, DLL)
  if (await guardAll(msg)) return;

  // 🔒 STEP 2: OWNER ONLY
  if (userId !== config.OWNER_ID.toString()) {
    return bot.sendMessage(
      chatId,
      "❌ <b>Akses ditolak!</b>\nCommand ini hanya untuk <b>Owner</b>.",
      { parse_mode: "HTML" }
    );
  }

  const path = require("path");
  const fs = require("fs");
  const archiver = require("archiver");

  // Folder yang ingin di-backup
  const foldersToBackup = [
    "./database",
    "./ALL-TUTOR"
  ];

  // File yang ingin di-backup
  const filesToBackup = [
    "./config.js",
    "./settings.js",
    "./package.json",
    "./sessioncs.json",
    "./users.json",
    "./index.js"
  ];

  const backupName = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
  const backupPath = path.join(__dirname, backupName);

  // Pesan loading backup
  const loadingMsg = await bot.sendMessage(
    chatId,
    "⏳ <b>Sedang membuat backup...</b>\nMohon tunggu sebentar.",
    { parse_mode: "HTML" }
  );

  try {
    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    // Tambahkan folder (fix spasi dengan resolve)
    for (const folder of foldersToBackup) {
      if (fs.existsSync(folder)) {
        archive.directory(path.resolve(folder), path.basename(folder));
      }
    }

    // Tambahkan file
    for (const file of filesToBackup) {
      if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
      }
    }

    await archive.finalize();

    output.on("close", async () => {
      const sizeMB = (output.bytesWritten / 1024 / 1024).toFixed(2);

      // Hapus pesan loading
      bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});

      // Kirim file ZIP ke user
      await bot.sendDocument(chatId, backupPath, {
        caption: `📦 <b>BACKUP BERHASIL!</b>\n\n` +
                 `🗂️ File: <code>${backupName}</code>\n` +
                 `💾 Size: <b>${sizeMB} MB</b>\n\n` +
                 `— 👑 RajaOTP • Secure OTP Automation`,
        parse_mode: "HTML"
      });

      // Hapus ZIP setelah terkirim
      fs.unlinkSync(backupPath);

      // Log ke Owner
      bot.sendMessage(
        OWNER_ID,
        `🛡️ <b>Backup Log</b>\nBackup berhasil dibuat.\n📁 File: <code>${backupName}</code>`,
        { parse_mode: "HTML" }
      );
    });

  } catch (err) {
    console.error(err);
    bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    bot.sendMessage(chatId, "❌ <b>Gagal membuat backup.</b>", { parse_mode: "HTML" });
  }
});
bot.on("callback_query", async (cb) => {
    // ✅ FIX: Proper destructuring from callback_query
    const { message, data } = cb;
    if (!message) {
      console.warn("[MAINTENANCE_GUARD] message is null");
      return;
    }

    if (data === "maintenance_check_status") {
        const screen = dailyMaintenance.getMaintenanceScreen();

        // HILANGKAN LOADING TELEGRAM
        await bot.answerCallbackQuery(cb.id);

        const chatId = message.chat?.id;
        const messageId = message.message_id;
        
        // Guard: Ensure message data is available
        if (!chatId || !messageId) {
          console.warn("[MAINTENANCE_GUARD] Missing chatId or messageId");
          return;
        }

        // EDIT PESAN YANG SAMA (BUKAN KIRIM BARU)
        return bot.editMessageText(
            screen.text,
            {
                chat_id: chatId,
                message_id: messageId,
                ...screen.options
            }
        ).catch(err => {
          console.warn("[MAINTENANCE_EDIT] Edit failed, sending new message:", err.message);
          return bot.sendMessage(chatId, screen.text, screen.options).catch(() => {});
        });
    }
});
bot.on("message", async (msg) => {
    const userId = String(msg.from.id);

    // Pastikan user sedang dalam mode search
    if (!global.waitingSearch || !global.waitingSearch[userId]) return;

    const keyword = msg.text?.toLowerCase();
    if (!keyword) return;

    const searchTarget = global.waitingSearch[userId];
    const services = global.cachedServices || [];

    // Filter services yang mengandung keyword
    const results = services.filter(s =>
        s.service_name.toLowerCase().includes(keyword)
    );

    const keyboard = [];

    if (results.length === 0) {
        keyboard.push([{ text: "❌ Tidak ditemukan — Coba lagi", callback_data: "search_service" }]);
    } else {
        // Batasi max 40 hasil
        results.slice(0, 40).forEach(s => {
            keyboard.push([
                { text: `${s.service_name} | ID ${s.service_code}`, callback_data: `service_${s.service_code}` }
            ]);
        });
    }

    // Tombol tambahan
    keyboard.push([{ text: "🔄 Cari Lagi", callback_data: "search_service" }]);
    keyboard.push([{ text: "🏠 Kembali Ke Menu Utama", callback_data: "back_home" }]);

    // Caption HTML
    const caption = `
🔎 <b>Hasil Pencarian:</b> <code>${keyword}</code>

${results.length === 0 ? "❌ Tidak ada hasil." : `📦 Ditemukan <b>${results.length}</b> layanan:`}
`;

    try {
        await bot.editMessageCaption(caption, {
            chat_id: searchTarget.chatId,
            message_id: searchTarget.messageId,
            parse_mode: "HTML",
            reply_markup: { inline_keyboard: keyboard }
        });
    } catch (e) {
        console.error("Gagal update caption:", e.message);
    }

    // Hapus state search user
    delete global.waitingSearch[userId];
});
bot.on("message", async (msg) => {
  const userId = String(msg.from.id);

  // Pastikan user sedang dalam mode search country
  if (!global.waitingCountrySearch || !global.waitingCountrySearch[userId]) return;

  const keyword = msg.text?.toLowerCase();
  if (!keyword) return;

  const { serviceId, chatId, messageId } = global.waitingCountrySearch[userId];
  const countries = global.cachedCountries?.[serviceId] || [];

  // Filter negara sesuai keyword
  const results = countries.filter(c =>
    c.name.toLowerCase().includes(keyword)
  );

  const keyboard = [];

  if (results.length === 0) {
    keyboard.push([
      { text: "❌ Tidak ditemukan — Coba lagi", callback_data: `search_country_${serviceId}` }
    ]);
  } else {
    // Inline keyboard 2 kolom
    for (let i = 0; i < results.slice(0, 40).length; i += 2) {
      const row = [];

      row.push({
        text: `${results[i].name} (${results[i].prefix})`,
        callback_data: `country_${serviceId}_${results[i].iso_code}_${results[i].number_id}`
      });

      if (results[i + 1]) {
        row.push({
          text: `${results[i + 1].name} (${results[i + 1].prefix})`,
          callback_data: `country_${serviceId}_${results[i + 1].iso_code}_${results[i + 1].number_id}`
        });
      }

      keyboard.push(row);
    }
  }

  // Tombol tambahan
  keyboard.push([{ text: "🔄 Cari Lagi", callback_data: `search_country_${serviceId}` }]);
  keyboard.push([{ text: "⬅️ Kembali", callback_data: `countrylist_${serviceId}_1` }]);

  // Caption HTML
  const caption = `
🔎 <b>Hasil Pencarian Negara</b>
<b>Kata kunci:</b> <code>${keyword}</code>

${results.length === 0 ? "❌ Tidak ada negara ditemukan." : `🌍 Ditemukan <b>${results.length}</b> negara:`}
`;

  try {
    await bot.editMessageCaption(caption, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (e) {
    console.error("Gagal update caption:", e.message);
  }

  // Hapus state search user
  delete global.waitingCountrySearch[userId];
});

// ====================================================
// 🧠 AUTO RESTART (ANTI HANG)
// ====================================================
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (used > 500) {
    process.exit(1);
  }
}, 30000);

//##################################//

bot.getMe().then(async () => {
  console.clear();

  const developer = config.authorName;
  const botversion = config.version;

  // 🌌 Tampilan Cyber Boot Logo (WOW Style)
  console.log(chalk.cyanBright(`
⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣀⡴⢧⣀⠀⠀⣀⣠⠤⠤⠤⠤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⠏⢀⡴⠊⠁⠀⠀⠀⠀⠀⠀⠈⠙⠦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢶⣶⣒⣶⠦⣤⣀⠀
⠀⠀⠀⠀⠀⠀⢀⣰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣟⠲⡌⠙⢦⠈⢧
⠀⠀⠀⣠⢴⡾⢟⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡴⢃⡠⠋⣠⠋
⠐⠀⠞⣱⠋⢰⠁⢿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠤⢖⣋⡥⢖⣫⠔⠋
⠈⠠⡀⠹⢤⣈⣙⠚⠶⠤⠤⠤⠴⠶⣒⣒⣚⣩⠭⢵⣒⣻⠭⢖⠏⠁⢀⣀
⠠⠀⠈⠓⠒⠦⠭⠭⠭⣭⠭⠭⠭⠭⠿⠓⠒⠛⠉⠉⠀⠀⣠⠏⠀⠀⠘⠞
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⣀⠀⠀⠀⠀⠀⠀⣀⡤⠞⠁⠀⣰⣆⠀
⠀⠀⠀⠀⠀⠘⠿⠀⠀⠀⠀⠀⠈⠉⠙⠒⠒⠛⠉⠁⠀⠀⠀⠉⢳⡞⠉
`));
  console.log(chalk.bold.white("        𝐍𝐃𝐘 - 𝐎𝐅𝐅𝐂\n"));
  console.log(chalk.white.bold("DEVELOPER    : ") + chalk.cyan(developer));
  console.log(chalk.white.bold("VERSION      : ") + chalk.green(botversion));
  console.log(chalk.greenBright("\nBot Berhasil Tersambung [✓]\n"));

  // 🔔 Kirim notifikasi ke owner
  bot.sendMessage(config.OWNER_ID, "*✅ Bot Telegram Berhasil Tersambung!*", { parse_mode: "Markdown" });

});

// ==================== ⚡ SYSTEM LOG : USER COMMAND DETECTED (RAJAOTP EDITION) ====================
bot.on("message", async (msg) => {
  try {
    if (!msg.text || !msg.from) return;
    const text = msg.text.trim();

    // Hanya notif untuk command "/"
    if (!text.startsWith("/")) return;

    const command = text.split(" ")[0].toLowerCase();
    const userId = msg.from.id.toString();
    const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const fullName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();
    const fiturDipakai = command;

    const moment = require("moment-timezone");
    const waktu = moment().tz("Asia/Jakarta").format("DD-MM-YYYY HH:mm:ss");

    const chatType =
      msg.chat.type === "private"
        ? "📩 Private Chat"
        : msg.chat.title
        ? `👥 Group: ${msg.chat.title}`
        : "🌐 Unknown Zone";

    const locationInfo =
      msg.chat.type === "private"
        ? "📩 Mode     : Private Chat"
        : `👥 Grup     : ${msg.chat.title}\n┃ 🆔 Group ID : ${msg.chat.id}`;

    // Skip notif untuk owner
    if (userId === config.OWNER_ID.toString()) return;

    const notifText = `
<b>╔═══ 𓆩⚡𓆪 USER BARU TERDETEKSI 𓆩⚡𓆪 ═══╗</b>

📥 <b>Seseorang baru saja mengakses bot!</b>

┣━ <b>PROFIL USER</b>
┃ 🧍 Nama     : ${fullName}
┃ 🔗 Username : ${msg.from.username ? `<a href="https://t.me/${msg.from.username}">@${msg.from.username}</a>` : "Tidak tersedia"}
┃ 🆔 User ID  : <code>${msg.from.id}</code>
┃ 🕐 Waktu    : ${waktu}
┃ 📡 Status   : LIVE CONNECTED
┃ ${locationInfo.split("\n").join("\n┃ ")}
┃ 💬 Command : <code>${fiturDipakai}</code>

┣━ <b>SYSTEM LOG</b>
┃ 🤖 Bot     : ${config.botName}
┃ 🔋 Mode    : Public + Real-Time
┃ 🚀 Access  : Premium Service
┃ 🧠 Logger  : Aktif ✅
┃ 🛰️ Channel : ${chatType}

<b>╚═══ ✦ RajaOTP SYSTEM ✦ ═══╝</b>
`;

    await bot.sendMessage(config.OWNER_ID, notifText, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("❌ Gagal kirim notif ke owner:", err);
  }
});

// =====================================================
// 🧾 /CEK_SALDO <userId> — OWNER ONLY BALANCE CHECK
// =====================================================
bot.onText(/^\/cek_saldo(?:\s+(\d+))?$/i, async (msg, match) => {
  try {
    const userId = msg.from.id;
    const owner = config.OWNER_ID.toString();
    const chatId = msg.chat.id;
    const targetUserIdArg = match[1]; // Optional: /cek_saldo 123456789

    // ========================================
    // 🔒 AUTHORIZATION: OWNER ONLY (SILENT DENY)
    // ========================================
    if (userId.toString() !== owner) {
      // Silent return — jangan kirim pesan apapun ke non-owner
      return;
    }

    // ========================================
    // 🔹 DETERMINE TARGET USER
    // ========================================
    let targetUserId;
    if (targetUserIdArg) {
      // Jika ada argument: /cek_saldo 123456789
      targetUserId = targetUserIdArg;
    } else {
      // Jika tidak ada argument: /cek_saldo (cek saldo sendiri)
      targetUserId = userId.toString();
    }

    // ========================================
    // 📊 READ SALDO DARI JSON
    // ========================================
    const saldoPath = path.join(__dirname, "./database/saldoOtp.json");

    let saldoData = {};
    if (fs.existsSync(saldoPath)) {
      try {
        saldoData = JSON.parse(fs.readFileSync(saldoPath, "utf-8"));
      } catch (e) {
        console.error("[CEK_SALDO_JSON_ERROR]", e.message);
        return bot.sendMessage(chatId, 
          "❌ <b>Error: Database saldo rusak</b>\n\nTidak dapat membaca file saldoOtp.json",
          { parse_mode: "HTML" }
        );
      }
    }

    // ========================================
    // 💰 AMBIL SALDO USER (DEFAULT 0 JIKA BELUM ADA)
    // ========================================
    const saldo = Number(saldoData[targetUserId]) || 0;
    const saldoFormatted = saldo.toLocaleString("id-ID");

    // ========================================
    // ✅ FORMAT OUTPUT PROFESIONAL
    // ========================================
    const caption = `🧾 <b>CEK SALDO USER</b>

━━━━━━━━━━━━━━━━━━━━━━━━

User ID : <code>${targetUserId}</code>
Saldo   : <b>Rp ${saldoFormatted}</b>

━━━━━━━━━━━━━━━━━━━━━━━━
👑 RajaOTP • Secure OTP Automation`;

    // ========================================
    // 📤 KIRIM RESPONSE
    // ========================================
    await bot.sendMessage(chatId, caption, {
      parse_mode: "HTML"
    });

    // ========================================
    // 📝 LOG ADMIN ACTIVITY (OPTIONAL)
    // ========================================
    const logTime = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta"
    });
    console.log(`[CEK_SALDO] ${logTime} | Owner ${userId} checked saldo of ${targetUserId} = Rp${saldoFormatted}`);

  } catch (err) {
    console.error("[CEK_SALDO_ERROR]", err.message);
    
    // Graceful error handling
    try {
      await bot.sendMessage(msg.chat.id,
        "❌ <b>Gagal mengecek saldo</b>\n\nTerjadi kesalahan sistem.",
        { parse_mode: "HTML" }
      );
    } catch {}
  }
});

//##################################//

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log("Update File:", __filename);
  delete require.cache[file];
  require(file);
});
