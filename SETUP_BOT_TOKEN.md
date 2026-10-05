# 🚀 Setup Bot Token - Hướng Dẫn Chi Tiết

## ⚠️ Lỗi: 404 Not Found

Nếu bạn thấy lỗi này:
```
TelegramError: 404: Not Found
```

**Nguyên nhân:** BOT_TOKEN chưa được cấu hình đúng trong file `.env`

---

## 📝 Hướng Dẫn Từng Bước

### **Bước 1: Tạo Telegram Bot**

1. **Mở Telegram**, tìm kiếm: `@BotFather`
   - Link: https://t.me/BotFather

2. **Gửi lệnh:** `/newbot`

3. **BotFather hỏi tên bot:**
   ```
   Alright, a new bot. How are we going to call it?
   Please choose a name for your bot.
   ```
   - Nhập: `HyperUR Bot` (hoặc tên bạn thích)

4. **BotFather hỏi username:**
   ```
   Good. Now let's choose a username for your bot.
   It must end in `bot`.
   ```
   - Nhập: `hyperur_rom_bot` (phải kết thúc bằng `bot`)
   - Hoặc: `hyperur_support_bot`, `hyperur_bill_bot`, etc.

5. **BotFather trả về token:**
   ```
   Done! Congratulations on your new bot.
   You will find it at t.me/hyperur_rom_bot
   
   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE
   ```
   - ✅ **Copy toàn bộ token này**

---

### **Bước 2: Lấy Admin User ID**

1. **Tìm kiếm:** `@userinfobot` trên Telegram
   - Link: https://t.me/userinfobot

2. **Gửi bất kỳ tin nhắn nào** (ví dụ: `hello`)

3. **Bot trả về thông tin:**
   ```
   👤 Your Info:
   ID: 123456789
   First name: Your Name
   Username: @yourusername
   ```
   - ✅ **Copy số ID** (ví dụ: `123456789`)

---

### **Bước 3: Cập Nhật File .env**

Mở file `.env` trong thư mục bot và sửa:

**Trước:**
```env
BOT_TOKEN=your_bot_token_here
ADMIN_IDS=123456789,987654321
```

**Sau:**
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE
ADMIN_IDS=123456789
```

> **Lưu ý:** Thay `1234567890:ABC...` bằng token thật của bạn từ BotFather!

---

### **Bước 4: Lưu File và Chạy Lại Bot**

```bash
# Ctrl + S để lưu file .env

# Chạy lại bot
npm start
```

**Kết quả mong đợi:**
```
✅ Bot started successfully!
✅ Bot username: @hyperur_rom_bot
✅ Listening for messages...
```

---

## 🎯 Ví Dụ Cụ Thể

### **File .env hoàn chỉnh:**

```env
# Telegram Bot Configuration
BOT_TOKEN=7123456789:AAFHj3kL9mN0pQrStUvWxYz-AbCdEfGhI
ADMIN_IDS=987654321

# HyperUR API Configuration
HYPERUR_API_URL=http://localhost:3000/api
HYPERUR_WEBSITE_URL=https://hyperur.com

# Storage Configuration
BILLS_FOLDER=./bills
DATABASE_FILE=./database/bot-data.json

# Webhook Configuration (optional)
WEBHOOK_DOMAIN=
WEBHOOK_PORT=3000

# Payment Information
PAYMENT_QR_URL=https://vietqr.app/img?bank=MBBank&acc=0562903904&template=&showinfo=true&holder=NGUYEN%20TAN%20LUC&store=HyperUR%20Rom
PAYMENT_BANK_NAME=MB Bank
PAYMENT_ACCOUNT_NUMBER=0562903904
PAYMENT_ACCOUNT_HOLDER=NGUYEN TAN LUC
```

---

## 🔍 Kiểm Tra Token Hợp Lệ

### **Cách 1: Test bằng browser**

Mở browser và truy cập:
```
https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

Thay `<YOUR_TOKEN>` bằng token của bạn, ví dụ:
```
https://api.telegram.org/bot7123456789:AAFHj3kL9mN0pQrStUvWxYz-AbCdEfGhI/getMe
```

**Kết quả hợp lệ:**
```json
{
  "ok": true,
  "result": {
    "id": 7123456789,
    "is_bot": true,
    "first_name": "HyperUR Bot",
    "username": "hyperur_rom_bot"
  }
}
```

**Kết quả lỗi:**
```json
{
  "ok": false,
  "error_code": 404,
  "description": "Not Found"
}
```
→ Token sai, kiểm tra lại!

---

### **Cách 2: Test bằng curl (Windows PowerShell)**

```powershell
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

---

## ❌ Các Lỗi Thường Gặp

### **1. Lỗi: 404 Not Found**
```
TelegramError: 404: Not Found
```
- ✅ **Giải pháp:** Token sai hoặc không tồn tại
- Kiểm tra lại token từ BotFather
- Copy đầy đủ token, không thiếu ký tự

### **2. Lỗi: 401 Unauthorized**
```
TelegramError: 401: Unauthorized
```
- ✅ **Giải pháp:** Token đúng nhưng bot đã bị revoke
- Tạo lại token: gửi `/token` cho @BotFather

### **3. Lỗi: Token có khoảng trắng**
```env
# SAI ❌
BOT_TOKEN= 7123456789:AAFHj...

# ĐÚNG ✅
BOT_TOKEN=7123456789:AAFHj...
```

### **4. Lỗi: File .env không được load**
- Kiểm tra file tên đúng là `.env` (không phải `.env.txt`)
- File phải ở thư mục root của project
- Restart lại terminal sau khi sửa

---

## 🎬 Video Hướng Dẫn (Text)

```
📱 Mở Telegram
    ↓
🔍 Tìm @BotFather
    ↓
💬 Gửi /newbot
    ↓
✏️ Nhập tên bot: HyperUR Bot
    ↓
✏️ Nhập username: hyperur_rom_bot
    ↓
📋 Copy token: 7123456789:AAFHj...
    ↓
📁 Mở file .env
    ↓
✏️ Paste token vào BOT_TOKEN=...
    ↓
💾 Lưu file (Ctrl + S)
    ↓
▶️ Chạy: npm start
    ↓
✅ Bot hoạt động!
```

---

## 🎉 Sau Khi Bot Chạy Thành Công

### **Test các tính năng:**

1. **Tìm bot trên Telegram:** `@hyperur_rom_bot`
2. **Gửi:** `/start`
3. **Xem:** QR code thanh toán hiển thị
4. **Gửi:** `/payment`
5. **Test:** Button "💳 Xem QR"
6. **Quét QR:** Bằng app ngân hàng

---

## 📞 Cần Thêm Trợ Giúp?

### **Nếu vẫn lỗi:**

1. **Check file .env:**
   ```bash
   cat .env
   # hoặc
   Get-Content .env
   ```

2. **Xem logs chi tiết:**
   ```bash
   npm start
   ```

3. **Test token trực tiếp:**
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

4. **Đọc QUICK_START.md** để biết thêm chi tiết

---

## 📚 Files Liên Quan

- `README.md` - Hướng dẫn tổng quan
- `QUICK_START.md` - Hướng dẫn khởi động nhanh
- `PAYMENT_INTEGRATION.md` - Chi tiết tích hợp thanh toán
- `.env.example` - Template file .env

---

**Version:** 1.0.0  
**Last Updated:** 2026-10-05  
**Status:** 📝 Setup Guide
