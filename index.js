require('dotenv').config();
const { Telegraf, Markup, session, Scenes } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(token);

const fs = require('fs');
const dbFile = 'pending.json';
let pendingRegistrations = [];
if (fs.existsSync(dbFile)) {
  try { pendingRegistrations = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) { }
}
const savePending = () => fs.writeFileSync(dbFile, JSON.stringify(pendingRegistrations, null, 2));

// Hàm chuẩn hóa chuỗi để so sánh: chỉ giữ lại chữ/số, viết thường
const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// Hàm gọi API thêm serial
async function callApiAddSerial(serial, isTrial) {
  const apiUrl = 'https://hypermods.id.vn/check_serial2.php?serial=43890701';

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
        `- Người dùng: ${ctx.from.first_name} (@${ctx.from.username || 'không có'})\n` +
        `- Email: ${email}\n` +
        `- Codename: ${codename}\n` +
        `- Serial: ${serial}\n` +
        `- Ngày đăng ký: ${dateStr}\n\n` +
        `✅ **ĐANG TỰ ĐỘNG KÍCH HOẠT API...**`;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error('Lỗi gửi thông báo admin:', err));

      const trialInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${email}\n` +
        `- Codename: ${codename}\n` +
        `- Serial: ${serial}\n\n` +
        `⏳ Hệ thống đang kích hoạt trên Server, vui lòng chờ trong giây lát...`;
      ctx.reply(trialInfo, { parse_mode: 'Markdown' });

      // Gọi API tự động luôn
      callApiAddSerial(serial, true).then((success) => {
        if (success) {
          ctx.reply(`🎉 **Hoàn tất!** Thiết bị (Serial: ${serial}) đã được kích hoạt dùng thử 36 ngày thành công trên hệ thống.`, { parse_mode: 'Markdown' });
          ctx.telegram.sendMessage(adminGroupId, `✅ API Kích hoạt thành công cho Serial: ${serial} (Dùng thử 36 ngày).`);
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
        `- Người dùng: ${ctx.from.first_name} (@${ctx.from.username || 'không có'})\n` +
        `- Email: ${email}\n` +
        `- Codename: ${codename}\n` +
        `- Serial: ${serial}\n` +
        `- Ngày đăng ký: ${dateStr}\n` +
        `- Nội dung CK: \`${paymentContent}\``;
      ctx.telegram.sendMessage(adminGroupId, notificationToAdmin, { parse_mode: 'Markdown' }).catch(err => console.error('Lỗi gửi thông báo admin:', err));

      const paymentInfo = `✅ **Đăng ký Serial HyperUR thành công!**\n\n` +
        `📋 **Thông tin của bạn:**\n` +
        `- Gói đăng ký: ${typeText}\n` +
        `- Email: ${email}\n` +
        `- Codename: ${codename}\n` +
        `- Serial: ${serial}\n` +
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

// Khởi tạo Stage chứa scene vừa tạo
const stage = new Scenes.Stage([registerWizard]);

// Đăng ký middleware session và stage cho bot
bot.use(session());
bot.use(stage.middleware());

// Xử lý lệnh /start
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'bạn';

  const welcomeMessage = `Chào mừng ${firstName} đến với bot đăng ký HyperUR rom! 🚀\n\nVui lòng nhấn nút bên dưới để tiến hành đăng ký.`;

  return ctx.reply(
    welcomeMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback('Đăng ký dùng thử 36 ngày ⏳', 'register_trial')],
      [Markup.button.callback('Đăng ký vĩnh viễn ♾️', 'register_permanent')]
    ])
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

// Đã xóa phần approve_trial_ do Trial giờ được xử lý hoàn toàn tự động

// Xử lý khi người dùng gửi ảnh (bill thanh toán)
bot.on('photo', (ctx) => {
  if (ctx.chat.type === 'private') {
    const adminGroupId = '-1004429951125';
    // Chuyển tiếp bill vào group admin
    ctx.telegram.forwardMessage(adminGroupId, ctx.chat.id, ctx.message.message_id)
      .catch(err => console.error('Lỗi forward bill:', err));
    // Báo kèm thông tin người gửi
    const userInfo = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
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

        // Tìm xem có đơn đăng ký nào khớp không
        const regIndex = pendingRegistrations.findIndex(r => sepayContent.includes(r.paymentContent));
        if (regIndex !== -1) {
          const reg = pendingRegistrations[regIndex];

          // Báo vào group admin
          const successMsg = `✅ **XÁC NHẬN THÀNH CÔNG!**\n` +
            `Nội dung CK và nội dung đăng ký đã khớp với nhau.\n` +
            `- Người dùng: ${reg.firstName} (@${reg.username || 'không có'})\n` +
            `- Email: ${reg.email}\n` +
            `- Serial: ${reg.serial}\n` +
            `- Ngày đăng ký: ${reg.dateStr}`;
          ctx.reply(successMsg, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });

          // Báo cho người dùng trong private chat
          bot.telegram.sendMessage(reg.userId, `🎉 **Thanh toán của bạn đã được hệ thống xác nhận!**\nAdmin sẽ kiểm tra và cấp quyền cho thiết bị của bạn sớm nhất có thể.`, { parse_mode: 'Markdown' }).catch(console.error);

          // Xóa đơn đã duyệt khỏi danh sách chờ
          pendingRegistrations.splice(regIndex, 1);
          savePending();

          // Gọi API tự động thêm Serial vĩnh viễn
          callApiAddSerial(reg.serial, false).then((success) => {
            if (success) {
              bot.telegram.sendMessage(reg.userId, `✅ **Thiết bị của bạn đã được kích hoạt Vĩnh Viễn trên hệ thống!**`, { parse_mode: 'Markdown' }).catch(console.error);
              ctx.reply(`✅ Đã gọi API kích hoạt VĨNH VIỄN thành công cho serial: ${reg.serial}`, { reply_to_message_id: ctx.message.message_id });
            } else {
              ctx.reply(`❌ Lỗi gọi API cho serial: ${reg.serial}. Vui lòng tự thêm tay trên server!`, { reply_to_message_id: ctx.message.message_id });
            }
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
