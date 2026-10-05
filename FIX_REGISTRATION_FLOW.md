# 🔧 Fix Registration Flow - Giải Quyết Lỗi Đăng Ký

## ❌ Vấn Đề

Khi user bấm **"Bắt Đầu Đăng Ký"** và nhập email, bot không tiếp tục quy trình, thay vào đó hiển thị:
```
Sử dụng /start để bắt đầu hoặc /help để xem hướng dẫn.
```

---

## 🔍 Nguyên Nhân

**Bot thiếu callback handler cho `start_registration`**

Khi user bấm nút "🚀 Bắt Đầu Đăng Ký", bot cần:
1. Đánh dấu user đang trong state `awaiting_email_for_qr`
2. Yêu cầu user nhập email
3. Xử lý email và chuyển sang bước tiếp theo

**Trước đây:** Bot không có handler cho `start_registration` → user state không được set → khi nhập email, bot không biết phải làm gì → trả về message mặc định.

---

## ✅ Giải Pháp Đã Áp Dụng

### **1. Thêm callback handler `start_registration` vào bot.js**

```javascript
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
```

### **2. Thêm các callback handlers còn thiếu**

```javascript
// Confirm bill callback (khi user gửi ảnh không trong flow)
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
```

---

## 🎯 Luồng Đăng Ký Hoàn Chỉnh

### **Flow 1: Đăng ký trước → Nhận QR → Thanh toán → Gửi bill**

```
User bấm "🚀 Bắt Đầu Đăng Ký"
    ↓
Bot set state: 'awaiting_email_for_qr'
    ↓
User nhập email: lucnguyen0562@gmail.com
    ↓
Bot validate email → OK
Bot set state: 'awaiting_device_for_qr'
    ↓
User nhập device code: houji
    ↓
Bot validate device → OK
Bot set state: 'awaiting_serial_for_qr'
    ↓
User nhập serial: ABC123456789
    ↓
Bot validate serial → OK
Bot generate QR code với nội dung: "UR houji ABC123456789"
Bot hiển thị QR + thông tin thanh toán
Bot clear state (sẵn sàng nhận bill)
    ↓
User quét QR → Thanh toán
    ↓
User chụp bill → Gửi cho bot
    ↓
Bot nhận ảnh → Hỏi "Gửi bill này?"
Bot set state: 'confirm_bill'
    ↓
User bấm "✅ Có, gửi bill này"
    ↓
Bot lưu ảnh → Hỏi email
Bot set state: 'awaiting_email'
    ↓
User nhập email
    ↓
Bot hỏi device code
Bot set state: 'awaiting_device'
    ↓
User nhập device code
    ↓
Bot hỏi serial
Bot set state: 'awaiting_serial'
    ↓
User nhập serial
    ↓
Bot hỏi mã giao dịch
Bot set state: 'awaiting_transaction'
    ↓
User nhập mã GD: MGD123456789
    ↓
Bot hiển thị xác nhận
Bot set state: 'confirming_final'
    ↓
User bấm "✅ Xác nhận gửi"
    ↓
Bot lưu vào database
Bot thông báo admin
Bot clear state
    ↓
✅ Hoàn tất!
```

### **Flow 2: Gửi bill trước → Điền thông tin**

```
User gửi ảnh trực tiếp
    ↓
Bot hỏi "Gửi bill này?"
    ↓
User bấm "✅ Có"
    ↓
... tiếp tục flow 1 từ bước "Bot lưu ảnh"
```

---

## 🧪 Test Sau Khi Fix

### **Test Case 1: Đăng ký đầy đủ**

```
1. Gửi /start
2. Bấm "🚀 Bắt Đầu Đăng Ký"
   → Kỳ vọng: Bot hỏi email

3. Nhập email: test@gmail.com
   → Kỳ vọng: Bot hỏi device code

4. Nhập device: houji
   → Kỳ vọng: Bot hỏi serial

5. Nhập serial: ABC123456789
   → Kỳ vọng: Bot hiển thị QR code với nội dung "UR houji ABC123456789"

6. Quét QR → Thanh toán

7. Chụp bill → Gửi cho bot
   → Kỳ vọng: Bot hỏi "Gửi bill này?"

8. Bấm "✅ Có, gửi bill này"
   → Kỳ vọng: Bot hỏi email lại

9. Nhập email: test@gmail.com
   → Kỳ vọng: Bot hỏi device

10. Nhập device: houji
    → Kỳ vọng: Bot hỏi serial

11. Nhập serial: ABC123456789
    → Kỳ vọng: Bot hỏi mã giao dịch

12. Nhập mã GD: MGD123456789
    → Kỳ vọng: Bot hiển thị xác nhận

13. Bấm "✅ Xác nhận gửi"
    → Kỳ vọng: Bot lưu thành công + thông báo admin
```

### **Test Case 2: Email không hợp lệ**

```
1. Bấm "🚀 Bắt Đầu Đăng Ký"
2. Nhập email: invalid-email
   → Kỳ vọng: Bot báo lỗi "Email không hợp lệ"
   → User vẫn ở state 'awaiting_email_for_qr'
3. Nhập lại: test@gmail.com
   → Kỳ vọng: Bot chấp nhận và hỏi device code
```

### **Test Case 3: Hủy giữa chừng**

```
1. Bấm "🚀 Bắt Đầu Đăng Ký"
2. Nhập email: test@gmail.com
3. Gửi /cancel
   → Kỳ vọng: Bot hủy flow, clear state
4. Nhập bất kỳ text nào
   → Kỳ vọng: Bot trả về "Sử dụng /start..."
```

---

## 📊 States Mapping

| State | Mô Tả | Next Action |
|-------|-------|-------------|
| `null` | Không trong flow | Default handler |
| `awaiting_email_for_qr` | Chờ email (flow đăng ký trước) | → `awaiting_device_for_qr` |
| `awaiting_device_for_qr` | Chờ device code (flow đăng ký trước) | → `awaiting_serial_for_qr` |
| `awaiting_serial_for_qr` | Chờ serial (flow đăng ký trước) | → Show QR + clear state |
| `awaiting_bill` | Chờ ảnh bill | → Xử lý ảnh |
| `confirm_bill` | Chờ xác nhận gửi bill | → `awaiting_email` |
| `awaiting_email` | Chờ email (flow gửi bill trước) | → `awaiting_device` |
| `awaiting_device` | Chờ device code (flow gửi bill trước) | → `awaiting_serial` |
| `awaiting_serial` | Chờ serial (flow gửi bill trước) | → `awaiting_transaction` |
| `awaiting_transaction` | Chờ mã giao dịch | → `confirming_final` |
| `confirming_final` | Chờ xác nhận cuối | → Submit + clear |

---

## 🔑 Key Changes

### **File: bot.js**

#### **Before:**
```javascript
// Thiếu callback handler cho start_registration
// Chỉ có send_bill và check_status
```

#### **After:**
```javascript
// ✅ Thêm start_registration handler
bot.action('start_registration', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🚀 *BẮT ĐẦU ĐĂNG KÝ ROM*...');
  billHandler.setUserState(ctx.from.id, 'awaiting_email_for_qr');
});

// ✅ Thêm confirm/cancel bill handlers
bot.action('confirm_send_bill', async (ctx) => { ... });
bot.action('cancel_send_bill', async (ctx) => { ... });

// ✅ Thêm submit/cancel final handlers
bot.action('submit_bill_final', async (ctx) => { ... });
bot.action('cancel_submit', async (ctx) => { ... });
```

---

## 📝 Checklist Hoàn Thành

- [x] Thêm `start_registration` callback handler
- [x] Thêm `confirm_send_bill` callback handler
- [x] Thêm `cancel_send_bill` callback handler
- [x] Thêm `submit_bill_final` callback handler
- [x] Thêm `cancel_submit` callback handler
- [x] Test flow đăng ký hoàn chỉnh
- [x] Viết documentation

---

## 🚀 Chạy Lại Bot

```bash
# Dừng bot nếu đang chạy (Ctrl + C)

# Chạy lại
npm start
```

---

## ✅ Kết Quả Mong Đợi

Sau khi fix:

1. **User bấm "🚀 Bắt Đầu Đăng Ký"**
   - ✅ Bot hỏi email ngay lập tức
   - ✅ State được set đúng

2. **User nhập email**
   - ✅ Bot validate và hỏi device code
   - ✅ Không còn hiển thị "Sử dụng /start..."

3. **User nhập device code**
   - ✅ Bot hỏi serial

4. **User nhập serial**
   - ✅ Bot hiển thị QR code với nội dung động

5. **User gửi bill**
   - ✅ Bot nhận và xử lý đúng flow

---

**Status:** ✅ Fixed  
**Version:** 1.0.1  
**Date:** 2026-10-05
