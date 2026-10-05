# 🚀 Quick Test - Payment QR Integration

## ✅ Đã Tích Hợp Thành Công

### Files đã chỉnh sửa:
1. ✅ `bot.js` - Thêm QR code và commands
2. ✅ `config.js` - Thêm payment configuration
3. ✅ `.env` - Thêm payment environment variables
4. ✅ `PAYMENT_INTEGRATION.md` - Documentation đầy đủ

---

## 🧪 Cách Test Bot

### Bước 1: Cài đặt dependencies (nếu chưa)
```bash
npm install
```

### Bước 2: Cấu hình Bot Token
Mở file `.env` và thêm:
```env
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_IDS=your_telegram_user_id
```

**Lấy Bot Token:**
1. Mở Telegram, tìm [@BotFather](https://t.me/BotFather)
2. Gửi `/newbot`
3. Đặt tên bot
4. Copy token và paste vào `.env`

**Lấy User ID:**
1. Mở [@userinfobot](https://t.me/userinfobot)
2. Gửi bất kỳ tin nhắn
3. Copy ID và paste vào `.env`

### Bước 3: Khởi động bot
```bash
npm start
```

Hoặc development mode (auto-reload):
```bash
npm run dev
```

---

## 📱 Test Scenarios

### Test 1: Command /start
```
Gửi: /start
```
**Kỳ vọng:**
- ✅ Bot hiển thị QR code thanh toán
- ✅ Có thông tin: MB Bank, STK 0562903904, NGUYEN TAN LUC
- ✅ Có 4 nút: 💳 Xem QR | 📤 Gửi Bill | 🔍 Tra Cứu | 🌐 Website

### Test 2: Command /payment
```
Gửi: /payment
```
**Kỳ vọng:**
- ✅ Bot hiển thị QR code riêng
- ✅ Có hướng dẫn chi tiết
- ✅ Có nút "📤 Gửi Bill Ngay"

### Test 3: Command /help
```
Gửi: /help
```
**Kỳ vọng:**
- ✅ Có thêm lệnh `/payment` trong danh sách
- ✅ Có nút "💳 Xem QR Thanh Toán"
- ✅ Bấm nút → hiển thị QR popup

### Test 4: Button Callback
```
Gửi /help → Bấm nút "💳 Xem QR Thanh Toán"
```
**Kỳ vọng:**
- ✅ Bot reply với QR code
- ✅ Caption: "💳 QR THANH TOÁN HYPERUR"
- ✅ Có nút "📤 Gửi Bill"

### Test 5: QR Code Quét Được
```
Mở app ngân hàng → Quét QR code trong bot
```
**Kỳ vọng:**
- ✅ Ngân hàng: MB Bank
- ✅ STK: 0562903904
- ✅ Người nhận: NGUYEN TAN LUC
- ✅ Nội dung: HyperUR Rom (tự động điền)

---

## 🎯 Features Mới

### 1. QR Code trong /start ✨
- Thay ảnh profile cũ bằng QR code VietQR
- Hiển thị đầy tiên thông tin thanh toán
- User không cần tìm kiếm thông tin TK

### 2. Command /payment ✨
- Lệnh riêng để xem QR bất cứ lúc nào
- Không cần quay lại /start
- Hướng dẫn rõ ràng từng bước

### 3. Button "💳 Xem QR" ✨
- Trong /help và /start
- Quick access không cần gõ lệnh
- UX tốt hơn với inline keyboard

### 4. Configuration ✨
- Payment info trong config.js
- Dễ thay đổi thông tin
- Environment variables support

---

## 📊 QR Code Details

**URL hiện tại:**
```
https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom
```

**Parameters:**
- `bank=MBBank` - Ngân hàng MB (Quân Đội)
- `acc=0562903904` - Số tài khoản
- `template=` - Template mặc định (có thể đổi: compact, print, etc)
- `showinfo=true` - Hiển thị thông tin trên QR
- `holder=NGUYEN%20TAN%20LUC` - Tên chủ TK
- `store=HyperUR%20Rom` - Nội dung chuyển khoản

---

## 🔧 Troubleshooting

### Bot không start?
```bash
# Check Node.js version
node -v  # Cần >= 14.x

# Check dependencies
npm install

# Check .env file
# Đảm bảo có BOT_TOKEN và ADMIN_IDS
```

### QR code không hiển thị?
- Kiểm tra URL trong config.js
- Test URL trực tiếp trong browser
- Kiểm tra internet connection

### Button không hoạt động?
- Restart bot sau khi sửa code
- Check console logs để xem lỗi
- Verify callback actions đã đăng ký đúng

---

## 📝 Checklist

Trước khi deploy production:

- [ ] Điền BOT_TOKEN trong .env
- [ ] Điền ADMIN_IDS trong .env
- [ ] Test /start command
- [ ] Test /payment command
- [ ] Test /help command
- [ ] Test button callbacks
- [ ] Quét QR code bằng app ngân hàng
- [ ] Test gửi bill workflow
- [ ] Test admin approval workflow
- [ ] Kiểm tra logs
- [ ] Backup database

---

## 🎉 Summary

**Đã thêm:**
- ✅ QR code VietQR vào /start
- ✅ Command /payment để xem QR
- ✅ Button "💳 Xem QR Thanh Toán"
- ✅ Payment configuration
- ✅ Full documentation

**Files modified:**
- `bot.js` (+50 lines)
- `config.js` (+10 lines)
- `.env` (+5 lines)
- `PAYMENT_INTEGRATION.md` (new, 297 lines)
- `QUICK_TEST.md` (new, this file)

**Ready to test!** 🚀

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs
2. Đọc `PAYMENT_INTEGRATION.md`
3. Đọc `README.md`
4. Contact: @lcnguy06 hoặc @Usagi79

---

**Version:** 1.0.0  
**Date:** 2026-10-05  
**Status:** ✅ Ready to Test
