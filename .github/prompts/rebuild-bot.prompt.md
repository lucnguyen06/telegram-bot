---
name: rebuild-bot
description: Tái cấu trúc toàn bộ HyperUR Telegram Bot phiên bản chuyên nghiệp cao cấp với SQLite WAL, SePay Webhook tự động 100%, Mini App, Rich Inline UI và đồng bộ serial.html
---

# Bản Thiết Kế Tái Cấu Trúc HyperUR Telegram Bot (Chuyên Nghiệp & Tự Động Hóa 100%)

Nâng cấp toàn diện Telegram Bot quản lý bản quyền ROM HyperUR V3 lên kiến trúc sản xuất (production-ready). Thay thế hoàn toàn file `index.js` và `pending.json` bằng cấu trúc module hóa, CSDL SQLite hiệu năng cao (WAL mode), Webhook SePay xử lý tự động thời gian thực (< 1s), giao diện Telegram Mini App & Rich Inline Keyboard sang trọng, đồng bộ toàn diện với `serial.html`.

---

## 1. Điểm Nhấn Kiến Trúc Cao Cấp ("Xịn Hơn")

1. **Giao Diện Đỉnh Cao (Rich UI & Mini App)**:
   - **Tích Hợp Telegram Mini App (TWA)**: Nút mở trực tiếp cổng `serial.html` ngay trong Telegram, tự động điền `user_id` và username.
   - **Stepper Wizard Trực Quan**: Hiển thị tiến trình từng bước `[1/3 Email ✉️] ➜ [2/3 Codename 📱] ➜ [3/3 Serial 🔑]`.
   - **Điều Hướng Linh Hoạt**: Luôn có nút `[ ↩️ Quay lại ]`, `[ ✏️ Sửa thông tin ]`, `[ ❌ Huỷ quy trình ]` tại từng bước, không bao giờ bị kẹt trạng thái bot.
   - **Thẻ Hóa Đơn Kỹ Thuật Số (Digital Invoice)**: Hiển thị đẹp mắt như app ngân hàng, có đồng hồ đếm ngược thanh toán (15 phút), nút 1-chạm sao chép nhanh STK, số tiền, cú pháp CK.

2. **Thanh Toán Tự Động 100% (Real-Time SePay Webhook)**:
   - Cung cấp Endpoint `POST /webhook/sepay` bảo mật bằng API Token.
   - Khi có tiền về tài khoản, SePay bắn webhook tới Bot -> Bot tự động đối soát `payment_code`, gọi API kích hoạt `check_serial2.php` trong **1 giây**, gửi thông báo xác nhận kèm License Card cho khách ngay lập tức mà không cần Admin can thiệp.
   - **Kênh Phụ Trợ (Admin Fallback)**: Nếu khách chuyển sai cú pháp, bot gửi thông báo vào nhóm Admin kèm nút `[ ✅ Duyệt 1-Click ]` và `[ ❌ Huỷ đơn ]`.

3. **Thanh Toán Đa Kênh & Cơ Chế Xoay Vòng QR (Đồng bộ 100% serial.js)**:
   - **Cơ Chế Xoay Vòng QR (QR Account Rotation)**:
     - Xoay tài khoản nhận tiền sau mỗi **5 lần thanh toán thành công** (`QR_ROTATE_THRESHOLD = 5`) nhằm phân bổ dòng tiền và chống giới hạn giao dịch.
     - Danh sách tài khoản xoay vòng:
       1. `MBBank` - STK: `VQRQAMNWP9901` - Chủ TK: `NGUYEN TAN LUC`
       2. `MBBank` - STK: `0379050602` - Chủ TK: `NGUYEN VAN TUC`
     - Bộ đếm `qr_payment_count` và `current_qr_index` lưu trữ trực tiếp trong CSDL SQLite, đảm bảo không bị reset khi khởi động lại bot.
   - **Kênh Quốc Tế & Crypto**:
     - Hỗ trợ **Binance Pay (5 USDT)** và **PayPal (5 USD)** qua link `https://paypal.me/lucnguyeen` (Tên người nhận: Nguyễn Lực).

4. **CSDL SQLite Chuẩn Doanh Nghiệp**:
   - Sử dụng `better-sqlite3` với chế độ `WAL (Write-Ahead Logging)` cho tốc độ đọc/ghi cực nhanh và an toàn tuyệt đối.
   - Tự động huỷ đơn quá hạn sau 15 phút (Order TTL) để tránh đơn ảo tồn đọng.

5. **Trung Tâm Quản Trị Admin (`/admin`)**:
   - Bảng điều khiển trực quan: Doanh thu ngày/tháng, số serial kích hoạt, danh sách đơn chờ duyệt.
   - Tính năng **Broadcast**: Gửi thông báo cập nhật ROM mới đến toàn bộ người dùng bot.

---

## 2. Cấu Trúc Dự Án Đề Xuất

```
telegram-bot/
├── src/
│   ├── config/             # Cấu hình .env, ngân hàng, VietQR, SePay Token, API URLs
│   │   └── index.js
│   ├── database/           # SQLite schema, migration & repository functions
│   │   ├── connection.js   # better-sqlite3 instance + WAL mode
│   │   ├── schema.sql      # Định nghĩa bảng orders, users, transactions
│   │   └── ordersRepo.js   # Các truy vấn CRUD đơn hàng, tính tier giá
│   ├── services/           # Tầng dịch vụ nghiệp vụ
│   │   ├── activation.js   # Gọi API check_serial2.php kích hoạt bản quyền
│   │   ├── pricing.js      # Tính giá động theo email (50k nếu <31 máy, 40k nếu >=31 máy)
│   │   ├── vietqr.js       # Sinh ảnh VietQR nét cao chuẩn Napas247
│   │   └── cleaner.js      # Background worker dọn dẹp đơn pending quá hạn 15 phút
│   ├── bot/
│   │   ├── scenes/         # Wizard Scenes nhập liệu trực quan
│   │   │   ├── registerSingle.js # Đăng ký 1 thiết bị (Trial 36 ngày / Vĩnh viễn)
│   │   │   └── registerBulk.js   # Đăng ký hàng loạt 2-10 thiết bị
│   │   ├── handlers/       # Command & Action Handlers
│   │   │   ├── start.js    # Lệnh /start, menu chính, nút mở Mini App
│   │   │   ├── lookup.js   # Tra cứu trạng thái Serial
│   │   │   ├── history.js  # Lịch sử đơn hàng của người dùng
│   │   │   └── admin.js    # Bảng điều khiển Admin, duyệt 1-click, broadcast
│   │   ├── keyboards/      # Inline Keyboards & Quick Actions
│   │   │   └── index.js
│   │   └── middlewares/    # Middleware kiểm tra chặn spam, rate-limit, auth admin
│   ├── server/             # Express server
│   │   ├── routes/
│   │   │   └── sepay.js    # Route Webhook nhận biến động số dư SePay tự động
│   │   └── app.js
│   └── utils/              # Tiện ích định dạng tiền tệ, ngày tháng, sanitize serial
│       ├── formatters.js
│       └── serialSanitizer.js
├── data/
│   └── database.sqlite     # SQLite file dữ liệu thực tế
├── index.js                # Khởi động Bot Telegraf + Express Webhook Server
├── package.json
└── .env.example
```

---

## 3. Lược Đồ CSDL SQLite Tối Ưu

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Cài đặt hệ thống (Lưu trạng thái xoay vòng QR)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Bảng Đơn hàng & Serial
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    email TEXT NOT NULL,
    codename TEXT NOT NULL,
    serial TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- 'trial' (36 ngày), 'permanent' (vĩnh viễn), 'bulk'
    unit_price INTEGER NOT NULL DEFAULT 50000,
    amount INTEGER NOT NULL DEFAULT 50000,
    payment_method TEXT NOT NULL DEFAULT 'VIETQR', -- 'VIETQR', 'CRYPTO', 'PAYPAL'
    bank_account TEXT, -- Lưu STK nhận tiền tương ứng với đơn (VQRQAMNWP9901 hoặc 0379050602)
    bank_owner TEXT,
    payment_code TEXT NOT NULL UNIQUE, -- UR<SERIAL><CODENAME>
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'EXPIRED', 'CANCELLED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    activated_at DATETIME,
    api_response TEXT
);

-- Bảng Lịch sử Giao dịch Ngân hàng (SePay log)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    sepay_id TEXT UNIQUE,
    amount_in INTEGER NOT NULL,
    content TEXT,
    transferred_at DATETIME,
    raw_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_payment_code ON orders(payment_code);
CREATE INDEX IF NOT EXISTS idx_orders_serial ON orders(serial);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

---

## 4. Chi Tiết Các Màn Hình & Trải Nghiệm Người Dùng (UX)

### 4.1. Dashboard Chính (`/start`)
- Banner chào mừng với thương hiệu **HyperUR ROM V3**.
- Thống kê cá nhân tóm tắt: Số thiết bị đã kích hoạt, bậc giá ưu đãi hiện tại của email.
- Inline Keyboards:
  - `[ 📱 Đăng Ký Vĩnh Viễn ]` | `[ 🎁 Dùng Thử 36 Ngày ]`
  - `[ 📦 Đăng Ký Số Lượng ]`  | `[ 🔍 Tra Cứu Serial ]`
  - `[ 🌐 Mở Cổng WebApp ]`    | `[ 📜 Lịch Sử Bản Quyền ]`

### 4.2. Luồng Wizard Đăng Ký 3 Bước
1. **Bước 1 (Email)**: User nhập email ➔ Bot kiểm tra CSDL, nếu đã mua ≥31 máy sẽ hiện badge: `⭐ KHÁCH THÂN THIẾT - ƯU ĐÃI 40.000đ/máy!`.
2. **Bước 2 (Codename)**: Nhập mã máy kèm danh sách gợi ý thiết bị phổ biến (`amethyst`, `houji`, `garnet`, `sweet`...).
3. **Bước 3 (Serial)**: Tự động chạy thuật toán lọc sạch:
   - Cắt bỏ `SN:`, khoảng trắng, ký tự thừa.
   - Kiểm tra chuẩn regex `^[A-Za-z0-9]{8,15}$`.
   - Nếu hợp lệ: Xuất hiện huy hiệu xanh `✅ Serial hợp lệ!`.

### 4.3. Thẻ Hóa Đơn (Invoice Card) & Thanh Toán
- Gửi ảnh VietQR động đã tích hợp sẵn số tiền và cú pháp chuẩn.
- Tin nhắn Hóa Đơn số phong cách Fintech:
  ```
  🧾 HÓA ĐƠN ĐĂNG KÝ BẢN QUYỀN HYPERUR
  ━━━━━━━━━━━━━━━━━━━━━━
  • Thiết bị: Houji (Xiaomi 14)
  • Số Serial: 5A1C8D2F
  • Gói: Bản Quyền Vĩnh Viễn Trọn Đời
  • Số tiền: 50.000đ
  • Nội dung CK: UR5A1C8D2F
  • Hạn thanh toán: 15:00 phút còn lại
  ━━━━━━━━━━━━━━━━━━━━━━
  💡 Vui lòng quét mã QR hoặc chuyển khoản chính xác nội dung bên trên để hệ thống tự động kích hoạt trong 5 giây!
  ```
- Nút bấm tiện ích:
  - `[ 📋 Sao Chép Số TK ]`
  - `[ 📋 Sao Chép Nội Dung CK ]`
  - `[ 🔄 Tôi Đã Chuyển Tiền ]`
  - `[ ❌ Huỷ Đơn ]`

### 4.4. Kích Hoạt Tự Động & Thẻ Bản Quyền (License Certificate)
- Ngay khi SePay Webhook khớp giao dịch:
  - Bot gọi API `check_serial2.php?serial=...`.
  - Cập nhật đơn thành `PAID` và lưu `activated_at`.
  - Bắn tin nhắn chúc mừng với hiệu ứng chúc mừng (Telegram Reaction/Sticker) và License Card:
  ```
  🎉 KÍCH HOẠT BẢN QUYỀN THÀNH CÔNG!
  ━━━━━━━━━━━━━━━━━━━━━━
  ✨ Trạng thái: ĐÃ KÍCH HOẠT VĨNH VIỄN
  📱 Thiết bị: Houji | SN: 5A1C8D2F
  📧 Email: user@example.com
  ⏱ Thời gian: 2026-11-02 15:30:00
  ━━━━━━━━━━━━━━━━━━━━━━
  👉 Bạn đã có thể cài đặt và sử dụng toàn bộ tính năng HyperUR ROM!
  ```
- Kèm nút bấm: `[ 📥 Tải ROM Ngay ]` | `[ 📖 Hướng Dẫn Cài Đặt ]` | `[ 💬 Nhóm Hỗ Trợ ]`.

---

## 5. Quy Trình Triển Khai Code
1. Cài đặt các gói phụ thuộc mới: `better-sqlite3`, `dotenv`, `telegraf`, `express`.
2. Khởi tạo cấu trúc thư mục `src/` và chạy migration schema SQLite.
3. Viết tầng repository `ordersRepo.js` và logic dọn dẹp đơn quá hạn `cleaner.js`.
4. Viết Service `activation.js`, `pricing.js`, `vietqr.js`.
5. Xây dựng Telegraf Wizard Scenes và các Keyboards tương tác.
6. Cấu hình Express Webhook SePay `POST /webhook/sepay` và cổng Admin 1-click.
7. Chạy kiểm thử tự động luồng đăng ký, thanh toán giả lập và tra cứu.

