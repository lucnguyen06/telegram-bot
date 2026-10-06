# HyperUR Telegram Bot 🚀

Đây là Bot Telegram tự động hóa quy trình đăng ký, quản lý và đối chiếu thanh toán Serial cho hệ thống **HyperUR ROM**. Bot hỗ trợ nhận diện thanh toán qua SePay và tự động gọi API lên hệ thống để kích hoạt Serial.

## ✨ Tính năng chính

- **2 Lựa chọn đăng ký:** Hỗ trợ đăng ký gói Dùng thử (36 ngày) và gói Vĩnh viễn.
- **Tự động kích hoạt (Dùng thử):** Kích hoạt lập tức qua API sau khi user nhập xong thông tin, không cần chờ duyệt.
- **Thanh toán QR Động (Vĩnh viễn):** Tự động sinh mã VietQR với nội dung chuyển khoản được cấu hình sẵn cho từng người dùng.
- **Đối chiếu tự động với SePay:** Tự động bắt giao dịch từ SePay Bot trong nhóm Admin để khớp với đơn hàng.
- **Chống mất dữ liệu:** Lưu trữ đơn hàng đang chờ thanh toán vào file `pending.json`, bot khởi động lại không bị mất dữ liệu chờ.

---

## 🛠 Yêu cầu hệ thống

- Đã cài đặt [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản 16.x hoặc mới hơn).
- Bot Token từ [@BotFather](https://t.me/BotFather) trên Telegram.

---

## ⚙️ Cài đặt & Cấu hình

**1. Clone/Tải source code về máy:**
Vào thư mục chứa code và mở Terminal/CMD.

**2. Cài đặt thư viện:**
Chạy lệnh sau để cài đặt các thư viện cần thiết (Telegraf, Dotenv...):
```bash
npm install
```

**3. Cấu hình Bot Token:**
Tạo một file có tên là `.env` (nằm cùng chỗ với file `index.js`), mở file ra và dán cấu hình sau vào:
```env
TELEGRAM_BOT_TOKEN=Điền_Token_Của_Bot_Vào_Đây
```
*(Thay thế phần `Điền_Token_Của_Bot_Vào_Đây` bằng Token do BotFather cung cấp).*

---

## 🚀 Cách chạy Bot

**Chạy trực tiếp (để test hoặc phát triển):**
```bash
npm start
```
Bot sẽ in ra dòng `Bot is running with Telegraf scenes...` báo hiệu đã khởi chạy thành công.

*(Khuyến nghị: Khi treo trên server thật/VPS, hãy sử dụng **PM2** để giữ cho bot luôn chạy ngầm mà không bị tắt khi đóng cửa sổ terminal).*
```bash
npm install -g pm2
pm2 start index.js --name "hyperur-bot"
```

---

## 👮 Hướng dẫn thao tác cho Admin

Bot được thiết kế để hạn chế tối đa việc vận hành thủ công:

- **Khi có khách đăng ký Dùng thử:** Bot tự gọi API lên hệ thống cấp quyền 36 ngày và báo thành công cho khách, admin không cần làm gì.
- **Khi có khách đăng ký Vĩnh viễn:** Khách sẽ chuyển khoản. Khi tiền vào, `SePay Bot` sẽ nhắn tin báo biến động số dư trong group Admin. 
  👉 **Cách duyệt tự động:** Admin chỉ cần bấm **Reply (Trả lời)** vào cái tin nhắn báo có tiền của `SePay Bot` (gõ chữ `ok` hoặc một dấu chấm `.` cũng được). Bot của chúng ta sẽ tự bắt nội dung, đối chiếu với Serial và tự gọi API kích hoạt vĩnh viễn ngay lập tức!
