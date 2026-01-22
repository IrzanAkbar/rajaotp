/*
👑 RajaOTP • Secure OTP Automation
Config Resmi Produksi
*/

const fs = require("fs");
const chalk = require("chalk");

module.exports = {
  // ==============================
  // 🔐 BOT CORE
  // ==============================
  TOKEN: "7977103989:AAFVFvtPasLxlDeNXysNuV7aYZ1JJv36dzw", // Token dari @BotFather
  OWNER_ID: "6026252942", // ID Telegram owner

  botName: "RajaOTP",
  version: "2.0.0",

  ownerName: "Andi Irzan Akbar Hasanuddin",
  authorName: "@maoum",

  // ==============================
  // 🔗 LINK & CHANNEL
  // ==============================
  urladmin: "https://t.me/maoum",
  urlchannel: "https://t.me/RajaOTPOfficial",
  urlpricechannel: "https://t.me/RajaOTPPrice",

  // Channel notifikasi pembelian & deposit
  idchannel: "-1003696262953",

  // Channel monitoring harga (jika masih dipakai)
  idmonitoringprice: "-1003560063649",

  // ==============================
  // 💸 SETTING SCRIPT (DISABLE JUAL SCRIPT)
  // ==============================
  hargaScriptNokos: 0, // DISABLE (tidak jual script)

  // ==============================
  // 🖼️ SETTING FOTO (LOCAL)
  // ==============================
  fotothumbnail: "assets/images/thumbnail.jpg",
  fotothumbnailQris: "assets/images/qriscustom.jpg",
  fotoNotificationProsesMaintenance: "assets/images/ProsesMaintenance.jpg",
  fotoNotificationCompleteMaintenance: "assets/images/CompleteMaintenance.jpg",
  fotoNotificationOrderOTP: "assets/images/orderOtp.jpg",
  fotoNotificationDeposit: "assets/images/deposit.jpg",

  // ==============================
  // 🌐 SETTING IMAGE LINK (REMOTE)
  // ==============================
  linkthumbnail: "https://h.top4top.io/p_3661b5jir1.png",
  linkthumbnailQris: "https://i.top4top.io/p_3646kzpl51.jpg",
  linkNotificationDailyMaintenanceProses: "https://c.top4top.io/p_3658s6q5m1.jpg",
  linkNotificationDailyMaintenanceComplete: "https://b.top4top.io/p_3658uc1ik1.jpg",
  linkNotificationOrderOTP: "https://h.top4top.io/p_36580zu9e1.png",
  linkNotificationDeposit: "https://l.top4top.io/p_3658amxtx1.jpg",

  // ==============================
  // 📱 RUMAHOTP
  // ==============================
  RUMAHOTP: "otp_TVsuTstLZEPUKzNU", // Apikey RumahOtp

  UNTUNG_NOKOS: 1500,
  UNTUNG_DEPOSIT: 500,

  type_ewallet_RUMAHOTP: "dana",
  nomor_pencairan_RUMAHOTP: "082291992583",

  // ==============================
  // 💳 PAKASIR
  // ==============================
  pakasir: {
    slug: "rajaotp",
    apiKey: "uJSo5GFlaDu1UL2krUKiXqI6kPaM5QGE"
  }
};

// 🔁 Auto reload jika file config.js diubah
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(
    chalk.blue(">> Update File :"),
    chalk.black.bgWhite(`${__filename}`)
  );
  delete require.cache[file];
  require(file);
});
