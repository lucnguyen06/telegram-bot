require('dotenv').config();
const { Telegraf, Markup, session, Scenes } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);
const express = require('express');
const app = express();

const fs = require('fs');
const dbFile = 'pending.json';
let pendingRegistrations = [];
if (fs.existsSync(dbFile)) {
  try { pendingRegistrations = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) { }
}
const savePending = () => fs.writeFileSync(dbFile, JSON.stringify(pendingRegistrations, null, 2));

// Hàm chuẩn hóa chuỗi để so sánh: chỉ giữ lại chữ/số, viết thường
const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// Hàm escape ký tự đặc biệt của Markdown V1 để tránh lỗi parse entities
const escapeMd = (str) => {
  if (!str) return '';
  return String(str).replace(/([_*`\[\\])/g, '\\$1');
};

// Hàm gọi API thêm serial
async function callApiAddSerial(serial, isTrial) {
  const apiUrl = 'https://hypermods.id.vn/check_serial2.php';

  let expireDate = '';
  if (isTrial) {
    const date = new Date();
    date.setDate(date.getDate() + 36);
    // Format thành dạng ngày YYYY-MM-DD (Ví dụ: 2026-11-11)
    expireDate = date.toISOString().split('T')[0];
  }

  try {
    // Truyền dữ liệu qua phương thức GET trực tiếp trên URL
    let finalUrl = `${apiUrl}?serial=${encodeURIComponent(serial)}`;

    // Nếu bạn cần truyền thêm ngày hết hạn vào URL cho PHP nhận, có thể mở comment dòng dưới:
    // finalUrl += `&is_trial=${isTrial ? '1' : '0'}` + (isTrial ? `&expire_date=${expireDate}` : '');

    const response = await fetch(finalUrl);

    const resultText = await response.text();
    console.log(`[API] Gọi URL: ${finalUrl}`);
    console.log(`[API] Phản hồi từ Server:`, resultText);

    return response.ok;
  } catch (err) {
    console.error('[API] Lỗi khi gọi API:', err);
    return false;
  }
}

// URL hình ảnh QR Code thanh toán
const qrUrl = 'https://vietqr.app/img?bank=MBBank&acc=VQRQAMNWP9901&template=&showinfo=false&holder=NGUYEN%20TAN%20LUC';

// Tạo Wizard Scene cho quá trình đăng ký gồm các bước thu thập thông tin
const registerWizard = new Scenes.WizardScene(
  'REGISTER_SCENE',
  (ctx) => {
    ctx.reply('Email liên hệ của bạn?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    ctx.wizard.state.email = ctx.message.text;
    ctx.reply('Mã thiết bị của bạn (codename)?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    ctx.wizard.state.codename = ctx.message.text;
    ctx.reply('Số serial thiết bị của bạn?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    ctx.wizard.state.serial = ctx.message.text;

    const email = ctx.wizard.state.email;
    const codename = ctx.wizard.state.codename;
    const serial = ctx.wizard.state.serial;
    const isTrial = ctx.wizard.state.isTrial;
    const typeText = isTrial ? 'Dùng thử 36 ngày' : 'Vĩnh viễn';

    const paymentContent = `UR ${serial} ${codename}`;

    // Thoát khỏi scene
    ctx.scene.leave();

    const adminGroupId = '-1004429951125';
    const dateStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    if (isTrial) {
      // 1. Nếu là Trial: Báo admin và Gọi API lập tức (Không lưu pending)
      const notificationToAdmin = `📝 **Có người đăng ký mới (Dùng thử 36 ngày)!**\n` +
        `- Người dùng: ${escapeMd(ctx.from.first_name)} (@${escapeMd(ctx.from.username) || 'không có'})\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Codename: ${escapeMd(codename)}\n` +
        `- Serial: ${escapeMd(serial)}\n` +
        `- Ngày đăng ký: ${dateStr}\n\n` +
        `✅ **ĐANG TỰ ĐỘNG KÍCH HOẠT API...**`;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error('Lỗi gửi thông báo admin:', err));

      const trialInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Codename: ${escapeMd(codename)}\n` +
        `- Serial: ${escapeMd(serial)}\n\n` +
        `⏳ Hệ thống đang kích hoạt trên Server, vui lòng chờ trong giây lát...`;
      ctx.reply(trialInfo, { parse_mode: 'Markdown' });

      // Gọi API tự động luôn
      callApiAddSerial(serial, true).then((success) => {
        if (success) {
          ctx.reply(`🎉 **Hoàn tất!** Thiết bị (Serial: ${escapeMd(serial)}) đã được kích hoạt dùng thử 36 ngày thành công trên hệ thống.`, { parse_mode: 'Markdown' });
          ctx.telegram.sendMessage(adminGroupId, `✅ API Kích hoạt thành công (Dùng thử 36 ngày).\n- Email: ${email}\n- Codename: ${codename}\n- Serial: ${serial}`);
        } else {
          ctx.reply(`❌ Quá trình gọi API bị lỗi. Vui lòng liên hệ admin để hỗ trợ thêm.`, { parse_mode: 'Markdown' });
          ctx.telegram.sendMessage(adminGroupId, `❌ Lỗi khi tự động gọi API cho Serial: ${serial} (Dùng thử). Vui lòng kiểm tra Server!`);
        }
      });
      return;
    } else {
      // 2. Nếu là Vĩnh viễn: Lưu pending và hiển thị mã QR
      pendingRegistrations.push({
        isTrial: false,
        userId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        email,
        codename,
        serial,
        paymentContent: normalize(paymentContent),
        dateStr
      });
      savePending();

      const notificationToAdmin = `📝 **Có người đăng ký mới (Vĩnh viễn)!**\n` +
        `- Người dùng: ${escapeMd(ctx.from.first_name)} (@${escapeMd(ctx.from.username) || 'không có'})\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Codename: ${escapeMd(codename)}\n` +
        `- Serial: ${escapeMd(serial)}\n` +
        `- Ngày đăng ký: ${dateStr}\n` +
        `- Nội dung CK: \`${paymentContent}\``;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error('Lỗi gửi thông báo admin:', err));

      const paymentInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Codename: ${escapeMd(codename)}\n` +
        `- Serial: ${escapeMd(serial)}\n` +
        `- Ngày đăng ký: ${dateStr}\n\n` +
        `Để hoàn tất, vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới:\n\n` +
        `🏦 *Ngân hàng:* MBBank\n` +
        `💳 *Số tài khoản:* VQRQAMNWP9901\n` +
        `👤 *Chủ tài khoản:* NGUYEN TAN LUC\n` +
        `📝 *Nội dung ủng hộ gợi ý:* \`${paymentContent}\`\n\n` +
        `⏳ *Hệ thống sẽ tự động đối chiếu khi bạn thanh toán xong, KHÔNG CẦN gửi ảnh bill.* (Trừ khi sau 5-10 phút chưa thấy thông báo thì bạn có thể gửi ảnh bill vào đây để admin kiểm tra thủ công).`;

      const dynamicQrUrl = `https://img.vietqr.io/image/MB-VQRQAMNWP9901-qr_only.png?addInfo=${encodeURIComponent(paymentContent)}&accountName=NGUYEN%20TAN%20LUC`;
      return ctx.replyWithPhoto(
        { url: dynamicQrUrl },
        {
          caption: paymentInfo,
          parse_mode: 'Markdown'
        }
      ).catch(err => {
        console.error("Error sending photo:", err);
        return ctx.reply(paymentInfo, { parse_mode: 'Markdown' });
      });
    }
  }
);

// Tạo Wizard Scene cho đăng ký số lượng
const registerBulkWizard = new Scenes.WizardScene(
  'REGISTER_BULK_SCENE',
  (ctx) => {
    ctx.reply('Email liên hệ của bạn?');
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    ctx.wizard.state.email = ctx.message.text;
    ctx.reply(
      'Nhập danh sách mã thiết bị (codename) và số serial của bạn. (Tối đa 10 thiết bị)\n\n' +
      '*Lưu ý khi đăng ký số lượng:*\n' +
      'Vui lòng nhập mỗi thiết bị trên một dòng theo định dạng: `Codename - Serial`\n\n' +
      'Ví dụ:\n' +
      '`Phone1 - 123456789`\n' +
      '`Phone2 - 987654321`',
      { parse_mode: 'Markdown' }
    );
    return ctx.wizard.next();
  },
  (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const text = ctx.message.text;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length < 2) {
      ctx.reply('Bạn cần nhập ít nhất 2 thiết bị cho đăng ký số lượng. Vui lòng nhập lại danh sách hoặc dùng lệnh /start để quay lại.');
      return; 
    }
    
    if (lines.length > 10) {
      ctx.reply('Bạn chỉ được nhập tối đa 10 thiết bị. Vui lòng nhập lại.');
      return;
    }

    const devices = [];
    for (const line of lines) {
      const parts = line.split(/[-|,]/);
      if (parts.length < 2) {
        ctx.reply(`Dòng "${line}" không đúng định dạng. Vui lòng nhập lại toàn bộ danh sách theo định dạng: Codename - Serial`);
        return;
      }
      
      const codename = parts[0].trim();
      const serial = parts.slice(1).join('-').trim(); // reconnect if serial has -
      if (!codename || !serial) {
          ctx.reply(`Dòng "${line}" không hợp lệ. Vui lòng nhập lại toàn bộ danh sách.`);
          return;
      }
      devices.push({ codename, serial });
    }

    ctx.wizard.state.devices = devices;

    ctx.reply('Bạn muốn đăng ký số lượng cho gói nào?', Markup.inlineKeyboard([
      [Markup.button.callback('Dùng thử 36 ngày ⏳', 'bulk_trial')],
      [Markup.button.callback('Vĩnh viễn ♾️', 'bulk_permanent')]
    ]));
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.callbackQuery) return;
    await ctx.answerCbQuery().catch(console.error);
    const data = ctx.callbackQuery.data;
    const isTrial = data === 'bulk_trial';
    
    const email = ctx.wizard.state.email;
    const devices = ctx.wizard.state.devices;
    const typeText = isTrial ? 'Dùng thử 36 ngày (Số lượng)' : 'Vĩnh viễn (Số lượng)';
    
    const firstSerial = devices[0].serial;
    const paymentContent = `UR BULK ${firstSerial.substring(0, 5)} ${devices.length}`;

    ctx.scene.leave();

    const adminGroupId = '-1004429951125';
    const dateStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    let deviceListStr = devices.map((d, i) => `${i+1}. ${d.codename} - ${d.serial}`).join('\n');

    if (isTrial) {
      const notificationToAdmin = `📝 **Có người đăng ký mới (${typeText})!**\n` +
        `- Người dùng: ${escapeMd(ctx.from.first_name)} (@${escapeMd(ctx.from.username) || 'không có'})\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Số lượng: ${devices.length} thiết bị\n` +
        `- Danh sách:\n${escapeMd(deviceListStr)}\n` +
        `- Ngày đăng ký: ${dateStr}\n\n` +
        `✅ **ĐANG TỰ ĐỘNG KÍCH HOẠT API...**`;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error(err));

      const trialInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Số lượng: ${devices.length} thiết bị\n\n` +
        `⏳ Hệ thống đang kích hoạt trên Server, vui lòng chờ trong giây lát...`;
      ctx.reply(trialInfo, { parse_mode: 'Markdown' });

      let successCount = 0;
      let failCount = 0;

      for (const d of devices) {
        const success = await callApiAddSerial(d.serial, true);
        if (success) successCount++;
        else failCount++;
      }

      ctx.reply(`🎉 **Hoàn tất!** Đã xử lý ${devices.length} thiết bị.\nThành công: ${successCount}\nThất bại: ${failCount}`, { parse_mode: 'Markdown' });
      ctx.telegram.sendMessage(adminGroupId, `✅ API Kích hoạt hoàn tất cho đơn Bulk của ${email}.\nThành công: ${successCount}, Thất bại: ${failCount}.`);
    } else {
      devices.forEach(d => {
        pendingRegistrations.push({
          isTrial: false,
          userId: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          email,
          codename: d.codename,
          serial: d.serial,
          paymentContent: normalize(paymentContent),
          dateStr
        });
      });
      savePending();

      const notificationToAdmin = `📝 **Có người đăng ký mới (${typeText})!**\n` +
        `- Người dùng: ${escapeMd(ctx.from.first_name)} (@${escapeMd(ctx.from.username) || 'không có'})\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Số lượng: ${devices.length} thiết bị\n` +
        `- Danh sách:\n${escapeMd(deviceListStr)}\n` +
        `- Ngày đăng ký: ${dateStr}\n` +
        `- Nội dung CK: \`${paymentContent}\``;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error(err));

      const paymentInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${escapeMd(email)}\n` +
        `- Số lượng: ${devices.length} thiết bị\n` +
        `- Ngày đăng ký: ${dateStr}\n\n` +
        `Để hoàn tất, vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới:\n\n` +
        `🏦 *Ngân hàng:* MBBank\n` +
        `💳 *Số tài khoản:* VQRQAMNWP9901\n` +
        `👤 *Chủ tài khoản:* NGUYEN TAN LUC\n` +
        `📝 *Nội dung ủng hộ gợi ý:* \`${paymentContent}\`\n\n` +
        `⏳ *Hệ thống sẽ tự động đối chiếu khi bạn thanh toán xong, KHÔNG CẦN gửi ảnh bill.* (Trừ khi sau 5-10 phút chưa thấy thông báo thì bạn có thể gửi ảnh bill vào đây để admin kiểm tra thủ công).`;

      const dynamicQrUrl = `https://img.vietqr.io/image/MB-VQRQAMNWP9901-qr_only.png?addInfo=${encodeURIComponent(paymentContent)}&accountName=NGUYEN%20TAN%20LUC`;
      ctx.replyWithPhoto({ url: dynamicQrUrl }, { caption: paymentInfo, parse_mode: 'Markdown' }).catch(err => {
        console.error("Error sending photo:", err);
        ctx.reply(paymentInfo, { parse_mode: 'Markdown' });
      });
    }
  }
);

// Khởi tạo Stage chứa scene vừa tạo
const stage = new Scenes.Stage([registerWizard, registerBulkWizard]);

// Đăng ký middleware session và stage cho bot
bot.use(session());
bot.use(stage.middleware());

// Xử lý lệnh /start
bot.start((ctx) => {
  const firstName = escapeMd(ctx.from.first_name) || 'bạn';

  const welcomeMessage = `Chào mừng ${firstName} đến với bot đăng ký HyperUR rom! 🚀\n\n` +
    `*Lưu ý:*\n` +
    `- Đăng ký dùng thử: Đăng ký 1 thiết bị\n` +
    `- Đăng ký vĩnh viễn: Đăng ký 1 thiết bị\n` +
    `- Đăng ký số lượng: Đăng ký từ 2 đến 10 thiết bị cùng lúc\n\n` +
    `Vui lòng nhấn nút bên dưới để tiến hành đăng ký.`;

  return ctx.reply(
    welcomeMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback('Đăng ký dùng thử 36 ngày ⏳', 'register_trial')],
      [Markup.button.callback('Đăng ký vĩnh viễn ♾️', 'register_permanent')],
      [Markup.button.callback('Đăng ký số lượng 📦', 'register_bulk')]
    ]),
    { parse_mode: 'Markdown' }
  );
});

bot.action('register_trial', async (ctx) => {
  await ctx.answerCbQuery().catch(console.error);
  await ctx.scene.enter('REGISTER_SCENE', { isTrial: true });
});

bot.action('register_permanent', async (ctx) => {
  await ctx.answerCbQuery().catch(console.error);
  await ctx.scene.enter('REGISTER_SCENE', { isTrial: false });
});

bot.action('register_bulk', async (ctx) => {
  await ctx.answerCbQuery().catch(console.error);
  await ctx.scene.enter('REGISTER_BULK_SCENE');
});

// Đã xóa phần approve_trial_ do Trial giờ được xử lý hoàn toàn tự động

// Xử lý khi người dùng gửi ảnh (bill thanh toán)
bot.on('photo', (ctx) => {
  if (ctx.chat.type === 'private') {
    const adminGroupId = '-1004429951125';
    // Chuyển tiếp bill vào group admin
    ctx.telegram.forwardMessage(adminGroupId, ctx.chat.id, ctx.message.message_id)
      .catch(err => console.error('Lỗi forward bill:', err));
    // Báo kèm thông tin người gửi
    const userInfo = ctx.from.username ? `@${escapeMd(ctx.from.username)}` : escapeMd(ctx.from.first_name);
    ctx.telegram.sendMessage(adminGroupId, `💸 **Bill thanh toán mới** từ người dùng: ${userInfo}`, { parse_mode: 'Markdown' }).catch(console.error);

    return ctx.reply('Cảm ơn bạn! Đã nhận được ảnh thanh toán. Admin sẽ kiểm tra và cấp quyền/phản hồi lại trong vòng 5 phút đến 1 tiếng.');
  }
});

// Xử lý các tin nhắn văn bản rác và tự động đối chiếu bill từ Sepay
bot.on('text', (ctx) => {
  const text = ctx.message.text || '';
  const adminGroupId = '-1004429951125';

  // Nếu tin nhắn là từ group admin
  if (ctx.chat.id.toString() === adminGroupId) {
    // DO TELEGRAM CẤM BOT ĐỌC TIN NHẮN CỦA BOT KHÁC, HyperUR Bot không thể tự động thấy tin nhắn của SePay Bot.
    // Giải pháp: Admin chỉ cần Reply (trả lời) tin nhắn của SePay Bot bằng bất kỳ chữ gì (ví dụ: "ok", ".", "/duyet")
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.text && ctx.message.reply_to_message.text.includes('Có giao dịch mới!')) {
      const repliedText = ctx.message.reply_to_message.text;
      const match = repliedText.match(/- Nội dung CK:\s*(.+)/);
      if (match) {
        const sepayContent = normalize(match[1]);

        // Tìm TẤT CẢ đơn đăng ký khớp với nội dung CK
        const matchedRegs = pendingRegistrations.filter(r => sepayContent.includes(r.paymentContent));
        
        if (matchedRegs.length > 0) {
          const firstReg = matchedRegs[0];

          // Báo vào group admin
          const successMsg = `✅ **XÁC NHẬN THÀNH CÔNG!**\n` +
            `Nội dung CK và nội dung đăng ký đã khớp với nhau.\n` +
            `- Người dùng: ${escapeMd(firstReg.firstName)} (@${escapeMd(firstReg.username) || 'không có'})\n` +
            `- Email: ${escapeMd(firstReg.email)}\n` +
            `- Số lượng: ${matchedRegs.length} thiết bị\n` +
            `- Ngày đăng ký: ${firstReg.dateStr}`;
          ctx.reply(successMsg, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });

          // Báo cho người dùng trong private chat
          bot.telegram.sendMessage(firstReg.userId, `🎉 **Thanh toán của bạn đã được hệ thống xác nhận!**\nHệ thống đang kích hoạt ${matchedRegs.length} thiết bị của bạn...`, { parse_mode: 'Markdown' }).catch(console.error);

          // Xóa các đơn đã duyệt khỏi danh sách chờ
          pendingRegistrations = pendingRegistrations.filter(r => !sepayContent.includes(r.paymentContent));
          savePending();

          // Gọi API tự động
          matchedRegs.forEach(reg => {
            callApiAddSerial(reg.serial, false).then((success) => {
              if (success) {
                bot.telegram.sendMessage(reg.userId, `✅ **Thiết bị (Serial: ${escapeMd(reg.serial)}) đã được kích hoạt Vĩnh Viễn trên hệ thống!**`, { parse_mode: 'Markdown' }).catch(console.error);
                ctx.reply(`✅ Đã gọi API kích hoạt VĨNH VIỄN thành công (Serial: ${reg.serial}).\n- Email: ${reg.email}\n- Codename: ${reg.codename}`, { reply_to_message_id: ctx.message.message_id });
              } else {
                ctx.reply(`❌ Lỗi gọi API cho serial: ${reg.serial}. Vui lòng tự thêm tay trên server!`, { reply_to_message_id: ctx.message.message_id });
              }
            });
          });
        } else {
          ctx.reply('❌ Không tìm thấy đơn đăng ký nào khớp với Nội dung CK này trong dữ liệu chờ duyệt.', { reply_to_message_id: ctx.message.message_id });
        }
      }
    }
    return; // Dừng xử lý tiếp
  }

  // Nếu là tin nhắn rác trong chat riêng với bot
  if (ctx.chat.type === 'private' && !text.startsWith('/')) {
    ctx.reply('Bạn có thể dùng lệnh /start để bắt đầu đăng ký, hoặc gửi ảnh bill nếu đã thanh toán xong và chờ lâu chưa được duyệt tự động.');
  }
});

bot.launch().then(() => {
  console.log('Bot is running with Telegraf scenes...');
});

// Xử lý lỗi toàn cục để bot không bị crash (ví dụ: lỗi TimeoutError khi mạng lag)
bot.catch((err, ctx) => {
  console.error(`[Lỗi] Có lỗi xảy ra khi xử lý update ${ctx.updateType}:`, err);
});

// Kích hoạt tính năng dừng bot an toàn
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Tạo dummy web server để Render.com nhận diện dịch vụ chạy thành công
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web server is running on port ${PORT}`);
});
