/**
 * Bill Handler - Xử lý bill upload và quản lý
 */

const fs = require('fs-extra');
const path = require('path');
const { Markup } = require('telegraf');

class BillHandler {
  constructor(database) {
    this.db = database;
    this.userStates = new Map(); // Track user conversation state
    this.tempBills = new Map(); // Temporary bill data during conversation
  }

  /**
   * STATE MANAGEMENT
   */

  getUserState(userId) {
    return this.userStates.get(userId) || null;
  }

  setUserState(userId, state) {
    this.userStates.set(userId, state);
  }

  clearUserState(userId) {
    this.userStates.delete(userId);
    this.tempBills.delete(userId);
  }

  /**
   * HANDLE PHOTO UPLOAD
   */

  async handlePhotoUpload(ctx) {
    const userId = ctx.from.id;
    const state = this.getUserState(userId);

    // Nếu user đã đăng ký và có đầy đủ thông tin
    if (state === 'awaiting_bill_with_info') {
      await this.processBillWithInfo(ctx);
      return;
    }

    // Nếu user không trong flow gửi bill, hỏi xem có muốn gửi không
    if (state !== 'awaiting_bill' && state !== 'awaiting_bill_after_register') {
      await ctx.reply(
        '📸 Bạn muốn gửi ảnh này làm bill đăng ký ROM?',
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Có, gửi bill này', 'confirm_send_bill')],
          [Markup.button.callback('❌ Không, hủy', 'cancel_send_bill')]
        ])
      );
      
      // Lưu tạm photo info
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      this.tempBills.set(userId, {
        photoFileId: photo.file_id,
        photoUniqueId: photo.file_unique_id
      });
      
      this.setUserState(userId, 'confirm_bill');
      return;
    }

    // Tiếp tục xử lý bill
    await this.processBillPhoto(ctx);
  }

  async processBillPhoto(ctx) {
    const userId = ctx.from.id;
    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    try {
      // Tải ảnh về server
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const billsFolder = process.env.BILLS_FOLDER || './bills';
      const fileName = `bill_${userId}_${Date.now()}.jpg`;
      const filePath = path.join(billsFolder, fileName);

      // Download ảnh
      const fetch = require('node-fetch');
      const response = await fetch(fileLink.href);
      const buffer = await response.buffer();
      await fs.writeFile(filePath, buffer);

      // Lưu thông tin tạm thời
      this.tempBills.set(userId, {
        photoFileId: photo.file_id,
        photoPath: filePath
      });

      // Hỏi email trước
      await ctx.reply(
        `✅ *Đã nhận bill!*\n\n` +
        `Bây giờ hãy điền đầy đủ thông tin để đăng ký.\n\n` +
        `📧 *Bước 1/4:* Nhập email liên hệ của bạn:\n\n` +
        `Ví dụ: \`example@gmail.com\``,
        { parse_mode: 'Markdown' }
      );

      this.setUserState(userId, 'awaiting_email');

    } catch (error) {
      console.error('Error processing bill photo:', error);
      await ctx.reply('❌ Lỗi khi xử lý ảnh. Vui lòng thử lại.');
      this.clearUserState(userId);
    }
  }

  /**
   * PROCESS BILL WITH INFO (user already registered)
   */
  async processBillWithInfo(ctx) {
    const userId = ctx.from.id;
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const tempBill = this.tempBills.get(userId);

    if (!tempBill || !tempBill.email) {
      await ctx.reply('❌ Thông tin đăng ký đã hết hạn. Vui lòng đăng ký lại.');
      this.clearUserState(userId);
      return;
    }

    try {
      // Tải ảnh về server
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      const billsFolder = process.env.BILLS_FOLDER || './bills';
      const fileName = `bill_${userId}_${Date.now()}.jpg`;
      const filePath = path.join(billsFolder, fileName);

      // Download ảnh
      const fetch = require('node-fetch');
      const response = await fetch(fileLink.href);
      const buffer = await response.buffer();
      await fs.writeFile(filePath, buffer);

      // Cập nhật thông tin bill
      tempBill.photoFileId = photo.file_id;
      tempBill.photoPath = filePath;
      this.tempBills.set(userId, tempBill);

      // Hiển thị xác nhận cuối
      await ctx.reply(
        `📋 *XÁC NHẬN THÔNG TIN ĐĂNG KÝ*\n\n` +
        `👤 Tên: ${ctx.from.first_name}\n` +
        `📧 Email: \`${tempBill.email}\`\n` +
        `📱 Thiết bị: \`${tempBill.deviceCode}\`\n` +
        `🔢 Serial: \`${tempBill.serial}\`\n` +
        `💳 Mã GD: \`${tempBill.transaction}\`\n` +
        `📸 Bill: Đã tải lên\n\n` +
        `Xác nhận gửi đăng ký?`,
        {
          parse_mode: 'Markdown',
          ...require('telegraf').Markup.inlineKeyboard([
            [require('telegraf').Markup.button.callback('✅ Xác nhận gửi', 'submit_bill_final')],
            [require('telegraf').Markup.button.callback('❌ Hủy', 'cancel_submit')]
          ])
        }
      );

      this.setUserState(userId, 'confirming_final');

    } catch (error) {
      console.error('Error processing bill photo:', error);
      await ctx.reply('❌ Lỗi khi xử lý ảnh. Vui lòng thử lại.');
      this.clearUserState(userId);
    }
  }

  /**
   * HANDLE ALL INFO AT ONCE (new registration flow)
   */
  async handleAllInfoInput(ctx) {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    // Validate có đủ 4 dòng không
    if (lines.length !== 4) {
      await ctx.reply(
        `⚠️ *Thông tin chưa đủ!*\n\n` +
        `Vui lòng gửi đầy đủ 4 dòng theo format:\n\n` +
        `📧 Email\n` +
        `📱 Codename\n` +
        `🔢 Serial\n` +
        `💳 Mã giao dịch\n\n` +
        `*Ví dụ:*\n` +
        `\`\`\`\n` +
        `lucnguyen0562@gmail.com\n` +
        `houji\n` +
        `ABC123456789\n` +
        `MGD123456\n` +
        `\`\`\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const [email, deviceCode, serial, transaction] = lines;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await ctx.reply(
        `⚠️ *Email không hợp lệ!*\n\n` +
        `Email: \`${email}\`\n\n` +
        `Vui lòng gửi lại với email đúng format.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate device code
    if (deviceCode.length < 3 || deviceCode.length > 20) {
      await ctx.reply(
        `⚠️ *Codename không hợp lệ!*\n\n` +
        `Codename: \`${deviceCode}\`\n\n` +
        `Codename phải từ 3-20 ký tự.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate serial
    if (serial.length < 5 || serial.length > 50) {
      await ctx.reply(
        `⚠️ *Serial không hợp lệ!*\n\n` +
        `Serial: \`${serial}\`\n\n` +
        `Serial phải từ 5-50 ký tự.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate transaction
    if (transaction.length < 3) {
      await ctx.reply(
        `⚠️ *Mã giao dịch không hợp lệ!*\n\n` +
        `Mã GD: \`${transaction}\`\n\n` +
        `Mã giao dịch phải ít nhất 3 ký tự.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Lưu thông tin tạm
    const tempBill = this.tempBills.get(userId) || {};
    tempBill.email = email;
    tempBill.deviceCode = deviceCode.toLowerCase();
    tempBill.serial = serial;
    tempBill.transaction = transaction;
    this.tempBills.set(userId, tempBill);

    // Tạo QR code với nội dung động
    const transferContent = `UR ${deviceCode} ${serial}`;
    const qrUrl = `https://img.vietqr.io/image/MB-0562903904-compact2.jpg?amount=&addInfo=${encodeURIComponent(transferContent)}&accountName=NGUYEN%20TAN%20LUC`;

    // Hiển thị xác nhận và QR
    await ctx.replyWithPhoto(
      { url: qrUrl },
      {
        caption:
          `✅ *THÔNG TIN ĐĂNG KÝ HOÀN TẤT!*\n\n` +
          `📧 Email: \`${email}\`\n` +
          `📱 Device: \`${deviceCode}\`\n` +
          `🔢 Serial: \`${serial}\`\n` +
          `💳 Mã GD: \`${transaction}\`\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💳 *THÔNG TIN THANH TOÁN*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🏦 Ngân hàng: *MB Bank* (Quân Đội)\n` +
          `👤 Chủ TK: *NGUYEN TAN LUC*\n` +
          `💳 STK: *0562903904*\n\n` +
          `💬 *Nội dung CK:*\n` +
          `\`${transferContent}\`\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `📱 *HƯỚNG DẪN:*\n` +
          `1️⃣ Quét mã QR bằng app ngân hàng\n` +
          `2️⃣ Kiểm tra nội dung CK: "${transferContent}"\n` +
          `3️⃣ Hoàn tất thanh toán\n` +
          `4️⃣ Chụp màn hình bill giao dịch\n` +
          `5️⃣ Gửi bill cho bot để được duyệt\n\n` +
          `💡 Bấm nút bên dưới để gửi bill sau khi thanh toán!`,
        parse_mode: 'Markdown',
        ...require('telegraf').Markup.inlineKeyboard([
          [require('telegraf').Markup.button.callback('📤 Gửi Bill Ngay', 'send_bill_with_info')],
          [require('telegraf').Markup.button.callback('🔄 Đăng Ký Lại', 'start_registration')]
        ])
      }
    );

    // Clear state, chuyển sang đợi bill
    this.setUserState(userId, 'awaiting_bill_after_register');
  }

  /**
   * HANDLE EMAIL INPUT (for QR generation flow)
   */

  async handleEmailInput(ctx) {
    const userId = ctx.from.id;
    const state = this.getUserState(userId);
    const email = ctx.message.text.trim();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await ctx.reply(
        '⚠️ Email không hợp lệ. Vui lòng nhập lại.\n\n' +
        'Ví dụ: example@gmail.com'
      );
      return;
    }

    const tempBill = this.tempBills.get(userId) || {};
    
    // Lưu email
    tempBill.email = email;
    this.tempBills.set(userId, tempBill);

    // Check if this is for QR generation or bill submission
    if (state === 'awaiting_email_for_qr') {
      // New flow: Ask for device code to generate QR
      await ctx.reply(
        `✅ Email đã lưu: ${email}\n\n` +
        `📱 *Bước 2/3:* Nhập mã thiết bị (codename):\n\n` +
        `📌 Ví dụ: \`houji\`, \`garnet\`, \`marble\`, \`mona\`\n` +
        `💡 Tìm codename tại: ${process.env.HYPERUR_WEBSITE_URL}/download.html`,
        { parse_mode: 'Markdown' }
      );
      this.setUserState(userId, 'awaiting_device_for_qr');
    } else {
      // Old flow: Bill already uploaded
      await ctx.reply(
        `✅ Email đã lưu!\n\n` +
        `📱 *Bước 2/4:* Nhập mã thiết bị (codename):\n\n` +
        `📌 Ví dụ: \`houji\`, \`garnet\`, \`marble\`, \`mona\`\n` +
        `💡 Tìm codename tại: ${process.env.HYPERUR_WEBSITE_URL}/download.html`,
        { parse_mode: 'Markdown' }
      );
      this.setUserState(userId, 'awaiting_device');
    }
  }

  /**
   * HANDLE DEVICE INPUT (for QR generation flow)
   */

  async handleDeviceInput(ctx) {
    const userId = ctx.from.id;
    const state = this.getUserState(userId);
    const deviceCode = ctx.message.text.trim().toLowerCase();

    // Validate device code
    if (deviceCode.length < 3 || deviceCode.length > 20) {
      await ctx.reply(
        '⚠️ Codename không hợp lệ. Vui lòng nhập lại.\n\n' +
        'Ví dụ: houji, garnet, marble'
      );
      return;
    }

    const tempBill = this.tempBills.get(userId);
    if (!tempBill) {
      await ctx.reply('❌ Phiên làm việc hết hạn. Vui lòng bắt đầu lại.');
      this.clearUserState(userId);
      return;
    }

    // Lưu device code
    tempBill.deviceCode = deviceCode;
    this.tempBills.set(userId, tempBill);

    // Check if this is for QR generation or bill submission
    if (state === 'awaiting_device_for_qr') {
      // New flow: Ask for serial then show QR
      await ctx.reply(
        `✅ Codename đã lưu: ${deviceCode}\n\n` +
        `🔢 *Bước 3/3:* Nhập số serial thiết bị:\n\n` +
        `📌 Ví dụ: \`ABC123456789\`\n` +
        `💡 Tìm serial tại: Cài đặt → Giới thiệu thiết bị → Số serial`,
        { parse_mode: 'Markdown' }
      );
      this.setUserState(userId, 'awaiting_serial_for_qr');
    } else {
      // Old flow: Bill already uploaded
      await ctx.reply(
        `✅ Codename đã lưu!\n\n` +
        `🔢 *Bước 3/4:* Nhập số serial thiết bị:\n\n` +
        `📌 Ví dụ: \`ABC123456789\`\n` +
        `💡 Tìm serial tại: Cài đặt → Giới thiệu thiết bị → Số serial`,
        { parse_mode: 'Markdown' }
      );
      this.setUserState(userId, 'awaiting_serial');
    }
  }

  /**
   * HANDLE SERIAL INPUT
   */

  async handleSerialInput(ctx) {
    const userId = ctx.from.id;
    const state = this.getUserState(userId);
    const serial = ctx.message.text.trim();

    // Validate serial
    if (serial.length < 5 || serial.length > 50) {
      await ctx.reply(
        '⚠️ Số serial không hợp lệ. Vui lòng nhập lại.\n\n' +
        'Serial thường dài 10-20 ký tự.'
      );
      return;
    }

    const tempBill = this.tempBills.get(userId);
    if (!tempBill) {
      await ctx.reply('❌ Phiên làm việc hết hạn. Vui lòng bắt đầu lại.');
      this.clearUserState(userId);
      return;
    }

    // Lưu serial
    tempBill.serial = serial;
    this.tempBills.set(userId, tempBill);

    // Check if this is for QR generation or bill submission
    if (state === 'awaiting_serial_for_qr') {
      // NEW FLOW: Generate QR code with dynamic transfer content
      const { email, deviceCode, serial } = tempBill;
      const transferContent = `UR ${deviceCode} ${serial}`;
      const qrUrl = `https://img.vietqr.io/image/MB-0562903904-compact2.jpg?amount=&addInfo=${encodeURIComponent(transferContent)}&accountName=NGUYEN%20TAN%20LUC`;
      
      await ctx.replyWithPhoto(
        { url: qrUrl },
        {
          caption: 
            `✅ *THÔNG TIN ĐĂNG KÝ HOÀN TẤT!*\n\n` +
            `📧 Email: ${email}\n` +
            `📱 Device: ${deviceCode}\n` +
            `🔢 Serial: ${serial}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💳 *THÔNG TIN THANH TOÁN*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🏦 Ngân hàng: *MB Bank* (Quân Đội)\n` +
            `👤 Chủ TK: *NGUYEN TAN LUC*\n` +
            `💳 STK: *0562903904*\n\n` +
            `💬 *Lời nhắn CK:*\n` +
            `📝 Nội dung ủng hộ gợi ý:\n` +
            `\`${transferContent}\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📱 *HƯỚNG DẪN:*\n` +
            `1️⃣ Quét mã QR bằng app ngân hàng\n` +
            `2️⃣ Kiểm tra nội dung CK đã điền đúng\n` +
            `3️⃣ Hoàn tất thanh toán\n` +
            `4️⃣ Chụp màn hình bill giao dịch\n` +
            `5️⃣ Gửi bill cho bot để được duyệt\n\n` +
            `💡 Bấm nút bên dưới để gửi bill sau khi thanh toán!`,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📤 Gửi Bill Ngay', 'send_bill')],
            [Markup.button.callback('🔄 Đăng Ký Lại', 'start_registration')]
          ])
        }
      );
      
      // Clear state, ready for bill upload
      this.clearUserState(userId);
      
    } else {
      // OLD FLOW: Bill already uploaded, ask for transaction code
      await ctx.reply(
        `✅ Serial đã lưu!\n\n` +
        `💳 *Bước 4/4:* Nhập mã giao dịch hoặc lời nhắn chuyển khoản:\n\n` +
        `📌 Ví dụ: \`MGD123456789\` hoặc \`UR ${tempBill.deviceCode} ${serial}\`\n` +
        `💡 Tìm mã giao dịch trong thông báo SMS/Email từ ngân hàng`,
        { parse_mode: 'Markdown' }
      );
      this.setUserState(userId, 'awaiting_transaction');
    }
  }

  /**
   * HANDLE TRANSACTION INPUT
   */

  async handleTransactionInput(ctx) {
    const userId = ctx.from.id;
    const transaction = ctx.message.text.trim();

    // Validate transaction
    if (transaction.length < 3) {
      await ctx.reply(
        '⚠️ Mã giao dịch quá ngắn. Vui lòng nhập lại.'
      );
      return;
    }

    const tempBill = this.tempBills.get(userId);
    if (!tempBill) {
      await ctx.reply('❌ Phiên làm việc hết hạn. Vui lòng gửi lại bill.');
      this.clearUserState(userId);
      return;
    }

    // Lưu transaction
    tempBill.transaction = transaction;
    this.tempBills.set(userId, tempBill);

    // Hiển thị xác nhận
    await ctx.reply(
      `📋 *XÁC NHẬN THÔNG TIN ĐĂNG KÝ*\n\n` +
      `👤 Tên: ${ctx.from.first_name}\n` +
      `📧 Email: \`${tempBill.email}\`\n` +
      `📱 Thiết bị: \`${tempBill.deviceCode}\`\n` +
      `🔢 Serial: \`${tempBill.serial}\`\n` +
      `💳 Mã GD: \`${transaction}\`\n` +
      `📸 Bill: Đã tải lên\n\n` +
      `Xác nhận gửi đăng ký?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Xác nhận gửi', 'submit_bill_final')],
          [Markup.button.callback('❌ Hủy', 'cancel_submit')]
        ])
      }
    );

    this.setUserState(userId, 'confirming_final');
  }

  /**
   * SUBMIT BILL TO DATABASE
   */

  async submitBill(ctx) {
    const userId = ctx.from.id;
    const tempBill = this.tempBills.get(userId);

    if (!tempBill) {
      await ctx.answerCbQuery('❌ Không tìm thấy thông tin bill');
      return;
    }

    try {
      // Tạo bill trong database
      const bill = this.db.createBill({
        userId: userId,
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || 'User',
        photoPath: tempBill.photoPath,
        photoFileId: tempBill.photoFileId,
        deviceCode: tempBill.deviceCode,
        email: tempBill.email,
        serial: tempBill.serial,
        transaction: tempBill.transaction
      });

      // Tăng bill count của user
      this.db.incrementUserBillCount(userId);

      // Thông báo cho user
      await ctx.editMessageText(
        `✅ *ĐĂNG KÝ THÀNH CÔNG!*\n\n` +
        `📝 Mã đơn: \`${bill.id}\`\n` +
        `📧 Email: \`${tempBill.email}\`\n` +
        `📱 Thiết bị: \`${tempBill.deviceCode}\`\n` +
        `🔢 Serial: \`${tempBill.serial}\`\n` +
        `⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n` +
        `✨ Admin sẽ duyệt đơn của bạn trong vòng 24h.\n` +
        `📬 Bạn sẽ nhận được thông báo khi đơn được duyệt.\n\n` +
        `🔍 Tra cứu đơn: Gửi \`/status ${bill.id}\``,
        { parse_mode: 'Markdown' }
      );

      // Gửi thông báo cho admin
      await this.notifyAdmins(ctx, bill);

      // Clear state
      this.clearUserState(userId);

    } catch (error) {
      console.error('Error submitting bill:', error);
      await ctx.answerCbQuery('❌ Lỗi khi gửi đơn');
    }
  }

  /**
   * NOTIFY ADMINS
   */

  async notifyAdmins(ctx, bill) {
    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim()));

    const message = `
🔔 *ĐƠN ĐĂNG KÝ MỚI*

📝 Mã đơn: \`${bill.id}\`
👤 User: ${bill.firstName}${bill.username ? ` (@${bill.username})` : ''}
👤 User ID: \`${bill.userId}\`
📧 Email: \`${bill.email}\`
📱 Thiết bị: \`${bill.deviceCode}\`
🔢 Serial: \`${bill.serial}\`
💳 Mã GD: \`${bill.transaction}\`
⏰ Thời gian: ${new Date(bill.createdAt).toLocaleString('vi-VN')}

Vui lòng kiểm tra và duyệt đơn.
`;

    for (const adminId of adminIds) {
      try {
        await ctx.telegram.sendPhoto(
          adminId,
          bill.photoFileId,
          {
            caption: message,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback('✅ Duyệt', `approve_${bill.id}`),
                Markup.button.callback('❌ Từ chối', `reject_${bill.id}`)
              ],
              [Markup.button.callback('📊 Xem chi tiết', `admin_bill_${bill.id}`)]
            ])
          }
        );
      } catch (error) {
        console.error(`Error notifying admin ${adminId}:`, error);
      }
    }
  }

  /**
   * CANCEL ACTION
   */

  async cancelCurrentAction(ctx) {
    const userId = ctx.from.id;
    this.clearUserState(userId);
  }
}

module.exports = BillHandler;
