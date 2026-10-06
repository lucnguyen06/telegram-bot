# HyperUR Telegram Bot 🚀

Đây là Bot Telegram tự động hóa quy trình đăng ký, quản lý và đối chiếu thanh toán Serial cho hệ thống **HyperUR ROM**. Bot hỗ trợ nhận diện thanh toán qua SePay và tự động gọi API lên hệ thống để kích hoạt Serial.

## ✨ Tính năng chính

- **3 Lựa chọn đăng ký:** Hỗ trợ đăng ký gói Dùng thử (36 ngày), gói Vĩnh viễn (1 thiết bị), và Đăng ký số lượng (2-10 thiết bị cùng lúc).
- **Tự động kích hoạt (Dùng thử):** Kích hoạt lập tức qua API sau khi user nhập xong thông tin, không cần chờ duyệt.
- **Thanh toán QR Động (Vĩnh viễn):** Tự động sinh mã VietQR với nội dung chuyển khoản được cấu hình sẵn cho từng người dùng (hoặc nhóm thiết bị).
- **Đối chiếu tự động với SePay:** Tự động bắt giao dịch từ SePay Bot trong nhóm Admin để khớp với đơn hàng, hỗ trợ duyệt một hoặc nhiều thiết bị cùng lúc.
- **Chống mất dữ liệu:** Lưu trữ đơn hàng đang chờ thanh toán vào file `pending.json`, bot khởi động lại không bị mất dữ liệu chờ.

---

## 🧠 Phân tích logic hoạt động (Luồng xử lý)

Bot hoạt động thông qua một luồng xử lý tự động khép kín từ khi thu thập thông tin đến khi gọi API kích hoạt thiết bị:

### 1. Thu thập thông tin (Scene Wizard)
- Người dùng bắt đầu với lệnh `/start` và chọn 1 trong 3 loại đăng ký.
- Đối với đăng ký lẻ (Dùng thử / Vĩnh viễn), bot yêu cầu: `Email -> Codename -> Serial`.
- Đối với đăng ký số lượng, bot yêu cầu: `Email -> Danh sách (Codename - Serial) -> Chọn loại gói (Dùng thử / Vĩnh viễn)`.

### 2. Xử lý logic theo gói
- **Gói Dùng thử (1 hoặc nhiều thiết bị):** 
  - Không cần thanh toán. Bot gửi thông báo vào nhóm Admin.
  - Tự động lặp qua các thiết bị và gọi API (`check_serial2.php`) để kích hoạt 36 ngày.
  - Phản hồi kết quả thành công/thất bại ngay lập tức cho người dùng.
- **Gói Vĩnh viễn (1 hoặc nhiều thiết bị):**
  - Bot tạo mã thanh toán duy nhất (`paymentContent`). Đăng ký lẻ: `UR <serial> <codename>`. Đăng ký số lượng: `UR BULK <5_ký_tự_đầu_của_serial> <số_lượng>`.
  - Các thiết bị được lưu vào trạng thái chờ (cùng một nội dung chuyển khoản) và ghi vào file `pending.json`.
  - Bot tạo mã QR Động qua API VietQR chứa thông tin thanh toán chính xác và gửi cho khách hàng.
  
### 3. Đối soát thanh toán (Tích hợp SePay)
- SePay báo giao dịch nhận tiền vào nhóm Admin Telegram (chứa `Nội dung CK: ...`).
- Quản trị viên **Reply (Trả lời)** tin nhắn của SePay (bằng bất kỳ ký tự nào, ví dụ `.`, `ok`).
- Bot trích xuất nội dung chuyển khoản từ tin nhắn gốc, dò tìm TẤT CẢ bản ghi khớp trong danh sách chờ.
- Nếu tìm thấy: Bot gửi thông báo xác nhận thành công cho người dùng, xóa các bản ghi khỏi hàng đợi, và tiến hành gọi API để kích hoạt trạng thái Vĩnh viễn cho tất cả các thiết bị trong đơn.

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

### Chạy trên máy local (test/phát triển)

**Bước 1: Cài đặt dependencies**
```bash
npm install
```

**Bước 2: Chạy bot**
```bash
npm start
```
Bot sẽ in ra dòng `Bot is running with Telegraf scenes...` báo hiệu đã khởi chạy thành công.

### Chạy trên VPS (Production)

**Cách 1: Sử dụng PM2 (Khuyến nghị)**

PM2 giúp bot chạy nền, tự động khởi động lại khi có lỗi và khi VPS reboot.

```bash
# Cài đặt dependencies
npm install

# Cài đặt PM2 global
npm install -g pm2

# Khởi chạy bot với PM2
pm2 start index.js --name telegram-bot

# Các lệnh quản lý PM2
pm2 list                # Xem danh sách process
pm2 logs telegram-bot   # Xem logs realtime
pm2 restart telegram-bot # Restart bot
pm2 stop telegram-bot   # Dừng bot
pm2 delete telegram-bot # Xóa khỏi PM2

# Tự động khởi động khi VPS reboot
pm2 startup
pm2 save
```

**Cách 2: Sử dụng nohup**

Chạy bot ở chế độ nền đơn giản:
```bash
npm install
nohup npm start > bot.log 2>&1 &

# Xem logs
tail -f bot.log

# Tìm process để dừng
ps aux | grep node
kill <PID>
```

**Cách 3: Sử dụng screen**

Cho phép detach/attach terminal:
```bash
npm install

# Tạo session mới
screen -S telegram-bot

# Chạy bot
npm start

# Nhấn Ctrl+A+D để detach (bot vẫn chạy nền)

# Attach lại để xem
screen -r telegram-bot

# List tất cả sessions
screen -ls
```

---

## 👮 Hướng dẫn thao tác cho Admin

Bot được thiết kế để hạn chế tối đa việc vận hành thủ công:

- **Khi có khách đăng ký Dùng thử:** Bot tự gọi API lên hệ thống cấp quyền 36 ngày và báo thành công cho khách, admin không cần làm gì.
- **Khi có khách đăng ký Vĩnh viễn (1 hoặc nhiều thiết bị):** Khách sẽ chuyển khoản với nội dung duy nhất. Khi tiền vào, `SePay Bot` sẽ nhắn tin báo biến động số dư trong group Admin. 
  👉 **Cách duyệt tự động:** Admin chỉ cần bấm **Reply (Trả lời)** vào cái tin nhắn báo có tiền của `SePay Bot` (gõ chữ `ok` hoặc một dấu chấm `.` cũng được). Bot của chúng ta sẽ tự bắt nội dung, đối chiếu, và tự gọi API kích hoạt vĩnh viễn ngay lập tức cho tất cả thiết bị trong đơn đó!
