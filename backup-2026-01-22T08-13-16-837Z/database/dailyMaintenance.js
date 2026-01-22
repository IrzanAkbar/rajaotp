const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const config = require("../config.js");

class DailyMaintenanceManager {
    constructor(bot, dbPath, ownerId, channelId) {
        this.bot = bot;
        this.ownerId = ownerId;
        this.channelId = channelId;
        this.dbPath = dbPath;

        this.maintenanceSchedule = {
            start: "23:00",
            end: "00:10",
            enabled: true,
        };

        this.interval = null;
        this.isMaintenance = false;
    }

    // ======== LOAD DATABASE ========
    loadDB() {
        if (!fs.existsSync(this.dbPath)) {
            return { settings: { maintenance: false } };
        }
        return JSON.parse(fs.readFileSync(this.dbPath));
    }

    saveDB(data) {
        fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    }

    // ======== TIME HANDLING ========
    nowJakarta() {
        const now = moment().tz("Asia/Jakarta");
        return {
            full: now.format("HH:mm:ss"),
            hm: now.format("HH:mm"),
            hour: Number(now.format("HH")),
            minute: Number(now.format("mm")),
        };
    }

start() {
    console.log("⏳ Daily Maintenance Scheduler Started…");

    // 🔑 Sinkron status awal dari database
    const db = this.loadDB();
    this.isMaintenance = !!db.settings?.maintenance;

    console.log(
        `🔄 Initial maintenance state: ${this.isMaintenance ? "ACTIVE" : "INACTIVE"}`
    );

    this.checkSchedule();

    this.interval = setInterval(() => {
        this.checkSchedule();
    }, 30000);
}

    // ======== CHECK SCHEDULE ========
    checkSchedule() {
        const now = this.nowJakarta();
        const [sh, sm] = this.maintenanceSchedule.start.split(":").map(Number);
        const [eh, em] = this.maintenanceSchedule.end.split(":").map(Number);

        const nowMin = now.hour * 60 + now.minute;
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        let active = false;

        if (endMin < startMin) {
            active = nowMin >= startMin || nowMin <= endMin;
        } else {
            active = nowMin >= startMin && nowMin <= endMin;
        }

        if (active !== this.isMaintenance) {
            this.isMaintenance = active;

            if (active) this.activateMaintenance();
            else this.deactivateMaintenance();
        }
    }

// ======== ACTIVATE ========
activateMaintenance() {
    console.log("🔧 Maintenance Mode ACTIVATED!");

    const db = this.loadDB();
    db.settings.maintenance = true;
    this.saveDB(db);

    const caption = `
<b>🤖 BOT SEDANG MAINTENANCE</b>

🔧 <b>MAINTENANCE DIMULAI</b>

Bot sementara <b>offline</b> untuk perawatan sistem otomatis.

⏰ <b>Waktu Maintenance:</b> ${this.maintenanceSchedule.start} - ${this.maintenanceSchedule.end} WIB
📅 <b>Bot aktif kembali:</b> ${this.maintenanceSchedule.end} WIB

📋 <b>Alasan:</b> Pemeliharaan rutin sistem dan database.

Mohon maaf atas ketidaknyamanannya 🙏
Terima kasih atas kesabaran Anda.

<b>#Maintenance #Auto</b>
`;

    // OWNER (TEXT)
    this.bot.sendMessage(this.ownerId, caption, {
        parse_mode: "HTML"
    });

    // CHANNEL (PHOTO)
    if (this.channelId) {
        const photoPath = path.resolve(config.fotoNotificationProsesMaintenance);

        this.bot.sendPhoto(
            this.channelId,
            photoPath,
            {
                caption,
                parse_mode: "HTML"
            }
        ).catch(err => {
            console.error("Gagal kirim foto maintenance:", err.message);
        });
    }
}

// ======== DEACTIVATE ========
deactivateMaintenance() {
    console.log("✅ Maintenance Mode DEACTIVATED!");

    const db = this.loadDB();
    db.settings.maintenance = false;
    this.saveDB(db);

    const caption = `
<b>✅ MAINTENANCE SELESAI</b>

Bot sudah <b>aktif kembali</b> dan siap digunakan!

🚀 <b>Semua fitur sudah tersedia.</b>
💰 Silakan lakukan transaksi seperti biasa.

Terima kasih atas kesabaran Anda! 🙏

<b>#MaintenanceComplete</b>
`;

    // OWNER (TEXT)
    this.bot.sendMessage(this.ownerId, caption, {
        parse_mode: "HTML"
    });

    // CHANNEL (PHOTO)
    if (this.channelId) {
        const photoPath = path.resolve(config.fotoNotificationCompleteMaintenance);

        this.bot.sendPhoto(
            this.channelId,
            photoPath,
            {
                caption,
                parse_mode: "HTML"
            }
        ).catch(err => {
            console.error("Gagal kirim foto selesai maintenance:", err.message);
        });
    }
}

// ============================================================
// ======== MAINTENANCE SCREEN (HTML VERSION) =================
// ============================================================
getMaintenanceScreen() {
    const now = this.nowJakarta().full;

    const text = `
<b>🤖 BOT SEDANG MAINTENANCE</b>

🔧 <b>MAINTENANCE DIMULAI</b>

Bot sementara <b>offline</b> untuk perawatan sistem otomatis.

⏰ <b>Waktu Maintenance:</b> ${this.maintenanceSchedule.start} - ${this.maintenanceSchedule.end} WIB
📅 <b>Bot aktif kembali:</b> ${this.maintenanceSchedule.end} WIB

🕒 <b>Waktu Sekarang:</b> ${now} WIB

📋 <b>Alasan:</b> Pemeliharaan rutin sistem dan database.

Mohon maaf atas ketidaknyamanannya 🙏
Terima kasih atas kesabaran Anda.

<b>#Maintenance #Auto</b>
`;

    return {
        text,
        options: {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 Cek Status", callback_data: "maintenance_check_status" }
                    ],
                    [
                        { text: "📢 Join Channel", url: config.urlchannel }
                    ]
                    ]
                }
            }
        };
    }
}

module.exports = DailyMaintenanceManager;