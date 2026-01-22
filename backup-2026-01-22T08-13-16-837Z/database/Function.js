// ========== Function Utility NDY OFFC ========== //
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const moment = require("moment-timezone");

// Lokasi saldo.json
const saldoPath = path.join(__dirname, "../database/saldoOtp.json");

function getRuntime() {
  const uptime = process.uptime(); // waktu hidup dalam detik
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${seconds} Detik`;
}

// ================= TOTAL USERS =================
function getTotalUsers() {
  try {
    const usersData = fs.readFileSync("./users.json", "utf-8");
    const users = JSON.parse(usersData);
    return users.length;
  } catch (err) {
    console.error("❌ Error membaca users.json:", err.message);
    return 0;
  }
}

// ================= SALDO HANDLER =================
function getUserSaldo(userId) {
  try {
    if (!fs.existsSync(saldoPath)) {
      fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(saldoPath, "utf-8"));
    
    // 🛡️ Validasi saldo adalah number
    const saldo = Number(data[userId]) || 0;
    if (saldo < 0) {
      console.warn(`⚠️ Saldo negatif detected untuk user ${userId}: ${saldo}, reset ke 0`);
      data[userId] = 0;
      fs.writeFileSync(saldoPath, JSON.stringify(data, null, 2), "utf-8");
      return 0;
    }
    
    return saldo;
  } catch (e) {
    console.error("❌ Gagal baca saldo:", e.message);
    // 🛡️ Auto-recovery: tulis ulang file dengan default
    try {
      fs.writeFileSync(saldoPath, JSON.stringify({}, null, 2), "utf-8");
      console.log("✅ File saldo direset ke default kosong");
    } catch (errWrite) {
      console.error("❌ Gagal reset saldo file:", errWrite.message);
    }
    return 0;
  }
}

function setUserSaldo(userId, saldo) {
  try {
    // 🛡️ Validasi input
    const validSaldo = Number(saldo) || 0;
    if (validSaldo < 0) {
      console.error(`❌ Attempt saldo negatif untuk user ${userId}: ${saldo}, ditolak`);
      return false;
    }

    let data = {};
    if (fs.existsSync(saldoPath)) {
      try {
        data = JSON.parse(fs.readFileSync(saldoPath, "utf-8"));
        if (!data || typeof data !== 'object') {
          data = {};
        }
      } catch (parseErr) {
        console.warn(`⚠️ File saldo corrupt, reset ke empty object`);
        data = {};
      }
    }

    data[userId] = validSaldo;

    // 🛡️ Atomic write dengan tmp file
    const tmpPath = `${saldoPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, saldoPath);

    console.log(`✅ Saldo user ${userId} disimpan: ${validSaldo}`);
    return true;
  } catch (e) {
    console.error("❌ Gagal simpan saldo:", e.message);
    return false;
  }
}

// Fungsi waktu Indonesia
function getWaktuIndonesia() {
  return moment().tz("Asia/Jakarta").format("DD MMMM YYYY • HH:mm:ss [WIB]");
}

// ================= FORMAT =================
function toIDR(number) {
  return Number(number).toLocaleString("id-ID");
}

function toRupiah(number) {
  return Number(number).toLocaleString("id-ID");
}

function toIDRSimple(num) {
  return Number(num).toLocaleString("id-ID");
}

function toRupiah(nominal) {
  return nominal.toLocaleString("id-ID");
}
function toRupiah(angka) {
  if (!angka || isNaN(angka)) return "0";
  return angka.toLocaleString("id-ID");
}

function formatRupiah(angka) {
  return `Rp${Number(angka).toLocaleString("id-ID")}`;
}

// ================= RANDOM GENERATOR =================
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex(len = 8) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
}

function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890!@#$%^&*()";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// ================= WAKTU =================
function dateTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

// ================= TRANSACTION HANDLER =================
const trxPath = path.join(__dirname, "../database/transaksi.json");

function generateTXID() {
  const date = moment().format("YYYYMMDD");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ROTP-${date}-${rand}`;
}

function recordTransaction(userId, service, country, price, status) {
  try {
    // Ensure file exists
    if (!fs.existsSync(trxPath)) {
      fs.writeFileSync(trxPath, JSON.stringify([], null, 2), "utf-8");
    }

    let transactions = JSON.parse(fs.readFileSync(trxPath, "utf-8")) || [];
    if (!Array.isArray(transactions)) {
      console.warn("⚠️ File transaksi corrupt, reset ke array kosong");
      transactions = [];
    }

    const txid = generateTXID();
    const newTx = {
      txid,
      userId: String(userId),
      service: service || "Unknown",
      country: country || "Unknown",
      price: Number(price) || 0,
      status: status || "pending",
      created_at: moment().format("YYYY-MM-DD HH:mm:ss")
    };

    transactions.push(newTx);

    // 🛡️ Atomic write
    const tmpPath = `${trxPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(transactions, null, 2), "utf-8");
    fs.renameSync(tmpPath, trxPath);
    
    return txid;
  } catch (err) {
    console.error("❌ Error recording transaction:", err.message);
    return null;
  }
}

function getUserTransactions(userId, limit = 5) {
  try {
    if (!fs.existsSync(trxPath)) {
      fs.writeFileSync(trxPath, JSON.stringify([], null, 2), "utf-8");
      return [];
    }

    let transactions = JSON.parse(fs.readFileSync(trxPath, "utf-8")) || [];
    if (!Array.isArray(transactions)) {
      console.warn("⚠️ File transaksi corrupt, return empty array");
      return [];
    }

    const userTx = transactions
      .filter(tx => String(tx.userId) === String(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    return userTx;
  } catch (err) {
    console.error("❌ Error getting user transactions:", err.message);
    return [];
  }
}

// ========== EXPORT SEMUA FUNCTION ==========
module.exports = {
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
  dateTime,
  recordTransaction,
  getUserTransactions,
  generateTXID,
};