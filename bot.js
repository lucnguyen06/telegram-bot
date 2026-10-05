/**
 * HyperUR Telegram Bot - Bill Management System
 * Nhận và xử lý bill đăng ký ROM từ user
 */

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const { format } = require('date-fns');
const config = require('./config');
const Database = require('./database');
const BillHandler = require('./handlers/billHandler');
const AdminHandler = require('./handlers/adminHandler');
const UserHandler = require('./handlers/userHandler');
const CallbackHandler = require('./callbackHandler');
const CronJobs = require('./cronJobs');
const Logger = require('./logger');

// Validate config
try {
  config.validate();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Khởi tạo logger
const logger = new Logger(config.storage.logs.folder);

// Khởi tạo bot
const bot = new Telegraf(config.bot.token);

// Khởi tạo database
const db = new Database(config.database.path);

// Khởi tạo handlers
const billHandler = new BillHandler(db);
const adminHandler = new AdminHandler(db);
const userHandler = new UserHandler(db);

// Danh sách admin IDs
const ADMIN_IDS = config.admin.ids;

// Middleware kiểm tra admin
const isAdmin = (ctx) => {
  return ADMIN_IDS.includes(ctx.from.id);
};

// Setup callback handler
const callbackHandler = new CallbackHandler(bot, db);

// Setup cron jobs (nếu enabled)
let cronJobs = null;
if (config.features.cronJobs) {
  cronJobs = new CronJobs(bot, db);
}

/**
 * ========================================
 * COMMAND HANDLERS
 * ========================================
 */

// /start - Bắt đầu đăng ký ROM
bot.command('start', async (ctx) => {
  const firstName = ctx.from.first_name || 'bạn';
  const userId = ctx.from.id;
  
  await ctx.reply(
    `🚀 *Chào mừng ${firstName} đến với HyperUR Bot!*\n\n` +
    `Bot hỗ trợ đăng ký ROM HyperOS cho thiết bị Xiaomi/Redmi.\n\n` +
    `📋 *Quy trình đăng ký:*\n` +
    `1️⃣ Điền thông tin thiết bị\n` +
    `2️⃣ Nhận QR code thanh toán\n` +
    `3️⃣ Quét QR và thanh toán\n` +
    `4️⃣ Gửi bill cho bot\n` +
    `5️⃣ Nhận ROM sau khi được duyệt\n\n` +
    `💡 Bấm nút bên dưới để bắt đầu!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Bắt Đầu Đăng Ký', 'start_registration')],
        [Markup.button.callback('📤 Gửi Bill', 'send_bill')],
        [Markup.button.callback('🔍 Tra Cứu Đơn', 'check_status')],
        [Markup.button.url('🌐 Website HyperUR', process.env.HYPERUR_WEBSITE_URL || 'https://t.me/hypermodupdate')]
      ])
    }
  );
});

// /help - Hướng dẫn
bot.command('help', async (ctx) => {
  await ctx.reply(
    `📚 *HƯỚNG DẪN SỬ DỤNG BOT*\n\n` +
    `*Lệnh cơ bản:*\n` +
    `/start - Khởi động bot\n` +
    `/help - Xem hướng dẫn\n` +
    `/payment - Xem QR thanh toán\n` +
    `/mybills - Xem danh sách bill của bạn\n` +
    `/cancel - Hủy thao tác hiện tại\n\n` +
    `*Cách gửi bill:*\n` +
    `1. Dùng /payment để xem QR thanh toán\n` +
    `2. Quét QR và thanh toán qua app ngân hàng\n` +
    `3. Chụp màn hình bill giao dịch\n` +
    `4. Gửi ảnh bill cho bot\n` +
    `5. Nhập thông tin: email, codename, serial, mã GD\n` +
    `6. Xác nhận và chờ admin duyệt\n\n` +
    `*Tra cứu:*\n` +
    `Dùng /mybills để xem tất cả bill đã gửi`,
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💳 Xem QR Thanh Toán', 'show_payment_qr')],
        [Markup.button.callback('📤 Gửi Bill', 'send_bill')],
        [Markup.button.callback('🔍 Tra Cứu Đơn', 'check_status')]
      ])
    }
  );
});

// /mybills - Xem danh sách bill của user
bot.command('mybills', async (ctx) => {
  await userHandler.showUserBills(ctx);
});

// /payment - Xem QR thanh toán
bot.command('payment', async (ctx) => {
  await ctx.replyWithPhoto(
    { url: 'https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom' },
    {
      caption: `💳 *THÔNG TIN THANH TOÁN*\n\n` +
        `🏦 *Ngân hàng:* MB Bank (Quân Đội)\n` +
        `👤 *Chủ tài khoản:* NGUYEN TAN LUC\n` +
        `💳 *Số tài khoản:* 0562903904\n` +
        `🏪 *Nội dung:* HyperUR Rom\n\n` +
        `📸 *Hướng dẫn:*\n` +
        `1. Quét mã QR bằng app ngân hàng\n` +
        `2. Kiểm tra thông tin và thanh toán\n` +
        `3. Chụp màn hình bill giao dịch\n` +
        `4. Gửi bill cho bot để đăng ký ROM\n\n` +
        `💡 Sau khi thanh toán, bấm nút bên dưới để gửi bill.`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📤 Gửi Bill Ngay', 'send_bill')]
      ])
    }
  );
});

// /cancel - Hủy thao tác
bot.command('cancel', async (ctx) => {
  await billHandler.cancelCurrentAction(ctx);
  await ctx.reply('❌ Đã hủy thao tác hiện tại.', Markup.removeKeyboard());
});

/**
 * ========================================
 * ADMIN COMMANDS
 * ========================================
 */

// /admin - Panel admin
bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('⛔ Bạn không có quyền truy cập lệnh này.');
  }
  
  await adminHandler.showAdminPanel(ctx);
});

// /pending - Xem bill chờ duyệt
bot.command('pending', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('⛔ Bạn không có quyền truy cập lệnh này.');
  }
  
  await adminHandler.showPendingBills(ctx);
});

// /stats - Thống kê
bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('⛔ Bạn không có quyền truy cập lệnh này.');
  }
  
  await adminHandler.showStats(ctx);
});

/**
 * ========================================
 * CALLBACK QUERY HANDLERS
 * ========================================
 */

// Start registration flow (new flow: get info first, then show QR)
bot.action('start_registration', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `🚀 *BẮT ĐẦU ĐĂNG KÝ ROM*\n\n` +
    `Hãy điền đầy đủ thông tin để nhận QR thanh toán.\n\n` +
    `📧 *Bước 1/3:* Nhập email liên hệ của bạn:\n\n` +
    `Ví dụ: \`example@gmail.com\``,
    { parse_mode: 'Markdown' }
  );
  
  billHandler.setUserState(ctx.from.id, 'awaiting_email_for_qr');
});

bot.action('send_bill', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `📤 *Gửi Bill Đăng Ký ROM*\n\n` +
    `Vui lòng gửi ảnh bill thanh toán của bạn.\n\n` +
    `✅ Chấp nhận: JPG, PNG\n` +
    `📌 Lưu ý: Ảnh phải rõ ràng, đầy đủ thông tin`,
    { parse_mode: 'Markdown' }
  );
  
  billHandler.setUserState(ctx.from.id, 'awaiting_bill');
});

bot.action('check_status', async (ctx) => {
  await ctx.answerCbQuery();
  await userHandler.showUserBills(ctx);
});

// Show payment QR callback
bot.action('show_payment_qr', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithPhoto(
    { url: 'https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom' },
    {
      caption: `💳 *QR THANH TOÁN HYPERUR*\n\n` +
        `🏦 MB Bank - 0562903904\n` +
        `👤 NGUYEN TAN LUC\n\n` +
        `Quét mã để thanh toán và gửi bill cho bot!`,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📤 Gửi Bill', 'send_bill')]
      ])
    }
  );
});

// Confirm bill callback
bot.action('confirm_send_bill', async (ctx) => {
  await ctx.answerCbQuery();
  await billHandler.processBillPhoto(ctx);
});

bot.action('cancel_send_bill', async (ctx) => {
  await ctx.answerCbQuery('Đã hủy');
  await ctx.reply('❌ Đã hủy gửi bill.');
  billHandler.clearUserState(ctx.from.id);
});

// Submit bill final callback
bot.action('submit_bill_final', async (ctx) => {
  await ctx.answerCbQuery();
  await billHandler.submitBill(ctx);
});

bot.action('cancel_submit', async (ctx) => {
  await ctx.answerCbQuery('Đã hủy');
  await ctx.reply('❌ Đã hủy gửi đơn.');
  billHandler.clearUserState(ctx.from.id);
});

// Admin approve/reject callbacks
bot.action(/^approve_(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.answerCbQuery('⛔ Không có quyền');
  }
  
  const billId = ctx.match[1];
  await adminHandler.approveBill(ctx, billId);
});

bot.action(/^reject_(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.answerCbQuery('⛔ Không có quyền');
  }
  
  const billId = ctx.match[1];
  await adminHandler.rejectBill(ctx, billId);
});

bot.action(/^view_bill_(.+)$/, async (ctx) => {
  const billId = ctx.match[1];
  await userHandler.showBillDetail(ctx, billId);
});

/**
 * ========================================
 * MESSAGE HANDLERS
 * ========================================
 */

// Nhận ảnh bill
bot.on('photo', async (ctx) => {
  await billHandler.handlePhotoUpload(ctx);
});

// Nhận text response
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const state = billHandler.getUserState(userId);
  
  if (state === 'awaiting_email' || state === 'awaiting_email_for_qr') {
    await billHandler.handleEmailInput(ctx);
  } else if (state === 'awaiting_device' || state === 'awaiting_device_for_qr') {
    await billHandler.handleDeviceInput(ctx);
  } else if (state === 'awaiting_serial' || state === 'awaiting_serial_for_qr') {
    await billHandler.handleSerialInput(ctx);
  } else if (state === 'awaiting_transaction') {
    await billHandler.handleTransactionInput(ctx);
  } else {
    // Default text handler
    await ctx.reply(
      'Sử dụng /start để bắt đầu hoặc /help để xem hướng dẫn.'
    );
  }
});

/**
 * ========================================
 * ERROR HANDLING
 * ========================================
 */

bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}`, { error: err.message, userId: ctx.from?.id });
  ctx.reply('⚠️ Đã xảy ra lỗi. Vui lòng thử lại sau.');
});

/**
 * ========================================
 * BOT LAUNCH
 * ========================================
 */

// Tạo thư mục lưu trữ
fs.ensureDirSync(config.storage.bills.folder);
fs.ensureDirSync(path.dirname(config.database.path));
if (config.storage.logs.enabled) {
  fs.ensureDirSync(config.storage.logs.folder);
}

// Khởi động bot
bot.launch({
  dropPendingUpdates: true
}).then(() => {
  logger.info('HyperUR Telegram Bot started successfully');
  console.log('🚀 HyperUR Telegram Bot đã khởi động!');
  console.log(`👥 Admin IDs: ${ADMIN_IDS.join(', ')}`);
  console.log(`📁 Bills folder: ${config.storage.bills.folder}`);
  console.log(`🗄️  Database: ${config.database.path}`);
  console.log(`🌐 Website: ${config.hyperur.websiteUrl}`);
  
  // Start cron jobs
  if (cronJobs) {
    cronJobs.start();
  }
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  if (cronJobs) {
    cronJobs.stop();
  }
  
  bot.stop(signal);
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

module.exports = bot;
