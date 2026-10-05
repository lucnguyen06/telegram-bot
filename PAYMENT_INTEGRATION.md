# 💳 Payment Integration - VietQR

Tích hợp QR thanh toán VietQR vào HyperUR Telegram Bot.

---

## 🎯 Tính Năng Đã Tích Hợp

### 1. **QR Code trong /start**
- Hiển thị QR code ngay khi user khởi động bot
- Kèm đầy đủ thông tin thanh toán
- Hướng dẫn chi tiết từng bước

### 2. **Lệnh /payment**
- Xem lại QR code bất cứ lúc nào
- Thông tin tài khoản đầy đủ
- Nút "Gửi Bill Ngay" để chuyển tiếp nhanh

### 3. **Button QR trong /help**
- Nút "💳 Xem QR Thanh Toán" 
- Callback action: `show_payment_qr`
- Popup QR code tiện lợi

### 4. **QR Configuration**
- Lưu trong `config.js` → `payment` section
- Environment variables trong `.env`
- Dễ dàng thay đổi thông tin

---

## 📋 Thông Tin Thanh Toán

```
🏦 Ngân hàng: MB Bank (Ngân hàng TMCP Quân Đội)
👤 Chủ tài khoản: NGUYEN TAN LUC
💳 Số tài khoản: 0562903904
🏪 Nội dung: HyperUR Rom
```

**QR Code URL:**
```
https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom
```

---

## 🔧 Cấu Hình

### File `config.js`

```javascript
payment: {
  qrCodeUrl: 'https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom',
  bankName: 'MB Bank',
  bankFullName: 'Ngân hàng TMCP Quân Đội',
  accountNumber: '0562903904',
  accountHolder: 'NGUYEN TAN LUC',
  storeName: 'HyperUR Rom'
}
```

### File `.env`

```env
PAYMENT_QR_URL=https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom
PAYMENT_BANK_NAME=MB Bank
PAYMENT_ACCOUNT_NUMBER=0562903904
PAYMENT_ACCOUNT_HOLDER=NGUYEN TAN LUC
```

---

## 📱 User Flow

```
User gửi /start
    ↓
Bot hiển thị QR code VietQR
    ↓
User quét QR bằng app ngân hàng
    ↓
User thanh toán
    ↓
User chụp màn hình bill
    ↓
User bấm "📤 Gửi Bill"
    ↓
Bot nhận ảnh bill
    ↓
Bot hỏi thông tin (email, device, serial, mã GD)
    ↓
User điền thông tin
    ↓
Bot lưu đơn và thông báo admin
    ↓
Admin duyệt
    ↓
User nhận ROM link
```

---

## 🎨 UI Components

### 1. Start Command với QR
```javascript
bot.command('start', async (ctx) => {
  await ctx.replyWithPhoto(
    { url: config.payment.qrCodeUrl },
    {
      caption: '...',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💳 Xem QR Thanh Toán', 'show_payment_qr')],
        [Markup.button.callback('📤 Gửi Bill', 'send_bill')],
        [Markup.button.callback('🔍 Tra Cứu Đơn', 'check_status')]
      ])
    }
  );
});
```

### 2. Payment Command
```javascript
bot.command('payment', async (ctx) => {
  await ctx.replyWithPhoto(
    { url: config.payment.qrCodeUrl },
    {
      caption: 'Thông tin thanh toán...',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📤 Gửi Bill Ngay', 'send_bill')]
      ])
    }
  );
});
```

### 3. Callback Action
```javascript
bot.action('show_payment_qr', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithPhoto(
    { url: config.payment.qrCodeUrl },
    {
      caption: '💳 QR THANH TOÁN HYPERUR',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📤 Gửi Bill', 'send_bill')]
      ])
    }
  );
});
```

---

## ✨ Lợi Ích

### Cho User:
- ✅ Thanh toán nhanh chóng với QR code
- ✅ Không cần nhập thủ công thông tin TK
- ✅ Xem lại QR bất cứ lúc nào với `/payment`
- ✅ Nội dung chuyển khoản tự động điền sẵn

### Cho Admin:
- ✅ Giảm sai sót thông tin chuyển khoản
- ✅ Dễ đối chiếu với mã GD trong bill
- ✅ Tăng tỷ lệ chuyển đổi (user dễ thanh toán hơn)

### Kỹ Thuật:
- ✅ QR code động từ VietQR API
- ✅ Không cần lưu file QR local
- ✅ Luôn cập nhật thông tin mới nhất
- ✅ Giảm storage footprint

---

## 🔄 Cập Nhật Thông Tin

### Thay đổi thông tin thanh toán:

1. **Chỉnh sửa `.env`:**
   ```env
   PAYMENT_ACCOUNT_NUMBER=0562903904
   PAYMENT_ACCOUNT_HOLDER=NGUYEN TAN LUC
   ```

2. **Tạo URL QR mới:**
   - Truy cập: https://vietqr.app/
   - Chọn ngân hàng: MB Bank
   - Nhập STK: 0562903904
   - Nhập tên: NGUYEN TAN LUC
   - Nội dung: HyperUR Rom
   - Copy URL

3. **Cập nhật `config.js`:**
   ```javascript
   payment: {
     qrCodeUrl: 'URL_MỚI_TỪ_VIETQR',
     // ...
   }
   ```

4. **Restart bot:**
   ```bash
   npm start
   ```

---

## 🧪 Testing

### Test QR Code:

1. **Test /start command:**
   ```
   Gửi: /start
   Kỳ vọng: Bot hiển thị QR code + thông tin thanh toán
   ```

2. **Test /payment command:**
   ```
   Gửi: /payment
   Kỳ vọng: Bot hiển thị QR code + nút "Gửi Bill Ngay"
   ```

3. **Test callback button:**
   ```
   Bấm: "💳 Xem QR Thanh Toán" trong /help
   Kỳ vọng: Bot popup QR code
   ```

4. **Test QR quét được:**
   ```
   Mở app ngân hàng → Quét QR
   Kỳ vọng: Thông tin tự động điền đầy đủ
   ```

---

## 📊 Analytics Ideas

### Có thể tracking:

1. **Số lần xem QR:**
   - `/start` executions
   - `/payment` executions
   - `show_payment_qr` callback triggers

2. **Conversion rate:**
   - Users xem QR vs users gửi bill
   - Time từ xem QR đến gửi bill

3. **Popular commands:**
   - `/payment` vs `/start` usage
   - Button clicks tracking

---

## 🚀 Future Enhancements

### V1.1 - Có thể thêm:

- [ ] QR code với amount động (nhập số tiền)
- [ ] Multiple payment methods (Momo, ZaloPay)
- [ ] Auto-verify payment via bank API
- [ ] Payment confirmation webhook
- [ ] Discount codes / promotions

### V1.2 - Advanced:

- [ ] Payment gateway integration
- [ ] Automatic bill verification
- [ ] Real-time payment notifications
- [ ] Monthly subscription support

---

## 📝 Notes

- VietQR API là free và không giới hạn requests
- QR code được tạo dynamic, không cần cache
- Support tất cả app ngân hàng Việt Nam
- Template `compact` hoặc `print` có thể customize

---

## 🔗 References

- **VietQR API:** https://vietqr.app/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Telegraf Framework:** https://telegraf.js.org/

---

**Status:** ✅ Completed & Deployed  
**Version:** 1.0.0  
**Last Updated:** 2026-10-05
