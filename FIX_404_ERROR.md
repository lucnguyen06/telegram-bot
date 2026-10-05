## 🎯 **CẦN LÀM NGAY:**

### **1. Lấy Bot Token từ @BotFather**

Mở Telegram và làm theo:

**Bước 1:** Tìm **@BotFather** → https://t.me/BotFather

**Bước 2:** Gửi lệnh `/newbot`

**Bước 3:** Đặt tên bot:
```
Tên hiển thị: HyperUR Bot
Username: hyperur_rom_bot (phải kết thúc bằng _bot)
```

**Bước 4:** Copy token mà BotFather gửi cho bạn (dạng `1234567890:ABCdef...`)

---

### **2. Lấy User ID của bạn**

**Bước 1:** Tìm **@userinfobot** → https://t.me/userinfobot

**Bước 2:** Gửi tin nhắn bất kỳ

**Bước 3:** Copy số ID (ví dụ: `123456789`)

---

### **3. Cập nhật file .env**

Mở file `.env` và thay đổi 2 dòng này:

```env
BOT_TOKEN=paste_token_của_bạn_vào_đây
ADMIN_IDS=paste_user_id_của_bạn_vào_đây
```

**Ví dụ:**
```env
BOT_TOKEN=7123456789:AAFHj3kL9mN0pQrStUvWxYz-AbCdEfGhI
ADMIN_IDS=987654321
```

---

### **4. Lưu file và chạy lại**

```bash
# Lưu file .env (Ctrl + S)

# Chạy lại bot
npm start
```

---

## ✅ **Kết Quả Mong Đợi**

Sau khi làm đúng các bước trên, bot sẽ khởi động thành công:

```
✅ Bot started successfully!
✅ Bot username: @hyperur_rom_bot
✅ Listening for messages...
```

---

## 🧪 **Test Bot**

1. Tìm bot trên Telegram: `@hyperur_rom_bot`
2. Gửi `/start`
3. Xem QR code thanh toán hiển thị
4. Test các lệnh: `/payment`, `/help`

---

## 📚 **Tài Liệu Chi Tiết**

Đọc file `SETUP_BOT_TOKEN.md` để biết thêm chi tiết!

---

**Lưu ý:** Token phải được giữ bí mật, không chia sẻ cho ai!