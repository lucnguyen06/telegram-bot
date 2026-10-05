# 🔄 Cập Nhật Flow: Nhập Tất Cả Thông Tin Một Lần

## ✅ Đã Thay Đổi Gì?

### **Flow Cũ (Từng Bước):**
```
Bấm "Bắt Đầu Đăng Ký"
    ↓
Nhập email
    ↓
Nhập device code
    ↓
Nhập serial
    ↓
Nhận QR code
```

### **Flow Mới (Nhập Một Lần):**
```
Bấm "Bắt Đầu Đăng Ký"
    ↓
Nhập TẤT CẢ thông tin cùng lúc (4 dòng):
  - Email
  - Codename
  - Serial
  - Mã giao dịch
    ↓
Nhận QR code ngay lập tức
```

---

## 📝 Cách Sử Dụng Mới

### **Bước 1: Khởi động đăng ký**

Gửi `/start` và bấm **"🚀 Bắt Đầu Đăng Ký"**

Bot sẽ trả lời:
```
🚀 ĐĂNG KÝ ROM HYPEROS

Vui lòng gửi thông tin đăng ký theo format:

📧 Email
📱 Codename
🔢 Serial
💳 Mã giao dịch/Lời nhắn CK

Ví dụ:
```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```

💡 Lưu ý: Mỗi thông tin một dòng, không thêm khoảng trống thừa.
```

### **Bước 2: Gửi thông tin (4 dòng)**

Sao chép và chỉnh sửa template này:

```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```

**Quan trọng:**
- ✅ Mỗi thông tin **một dòng riêng**
- ✅ Không có khoảng trống đầu/cuối dòng
- ✅ Đúng **4 dòng**, không nhiều hơn, không ít hơn

### **Bước 3: Nhận QR code**

Bot sẽ hiển thị:
- ✅ Xác nhận thông tin bạn vừa nhập
- ✅ QR code thanh toán với nội dung: **"UR houji ABC123456789"**
- ✅ Thông tin ngân hàng đầy đủ
- ✅ Nút **"📤 Gửi Bill Ngay"**

### **Bước 4: Thanh toán và gửi bill**

1. Quét QR code bằng app ngân hàng
2. Kiểm tra nội dung chuyển khoản tự động điền
3. Hoàn tất thanh toán
4. Chụp màn hình bill
5. Bấm **"📤 Gửi Bill Ngay"**
6. Gửi ảnh bill cho bot

### **Bước 5: Xác nhận**

Bot hiển thị xác nhận cuối với tất cả thông tin + ảnh bill.

Bấm **"✅ Xác nhận gửi"** → Hoàn tất!

---

## 🎯 Ví Dụ Cụ Thể

### **Ví Dụ 1: Đăng Ký Houji**

```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```

Bot tạo QR với nội dung: `UR houji ABC123456789`

### **Ví Dụ 2: Đăng Ký Marble**

```
test@gmail.com
marble
XYZ987654321
UR marble XYZ987
```

Bot tạo QR với nội dung: `UR marble XYZ987654321`

---

## ⚠️ Lỗi Thường Gặp

### **Lỗi 1: Thiếu hoặc thừa dòng**

❌ **Sai:**
```
lucnguyen0562@gmail.com
houji
ABC123456789
```
*(Chỉ 3 dòng, thiếu mã giao dịch)*

✅ **Đúng:**
```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```
*(Đủ 4 dòng)*

### **Lỗi 2: Email không hợp lệ**

❌ **Sai:**
```
lucnguyen0562
houji
ABC123456789
MGD123456
```

✅ **Đúng:**
```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```

### **Lỗi 3: Codename quá ngắn**

❌ **Sai:**
```
test@gmail.com
hj
ABC123456789
MGD123456
```
*(Codename phải 3-20 ký tự)*

✅ **Đúng:**
```
test@gmail.com
houji
ABC123456789
MGD123456
```

### **Lỗi 4: Có khoảng trống thừa**

❌ **Sai:**
```
  lucnguyen0562@gmail.com  
houji  
ABC123456789
MGD123456
```

✅ **Đúng:**
```
lucnguyen0562@gmail.com
houji
ABC123456789
MGD123456
```

---

## 🔄 So Sánh Flow

| | Flow Cũ (Từng Bước) | Flow Mới (Một Lần) |
|---|---|---|
| **Số bước nhập** | 4 bước riêng biệt | 1 tin nhắn duy nhất |
| **Thời gian** | ~2-3 phút | ~30 giây |
| **Độ phức tạp** | Dễ (bot hỏi từng bước) | Trung bình (cần nhớ format) |
| **Khả năng sai** | Thấp | Cao hơn (nếu sai format) |
| **Tốc độ** | Chậm | Nhanh |

---

## 📊 State Management

| State | Trigger | Next |
|-------|---------|------|
| `null` | Bấm "Bắt Đầu Đăng Ký" | `awaiting_all_info` |
| `awaiting_all_info` | Gửi 4 dòng thông tin | Show QR + `awaiting_bill_with_info` |
| `awaiting_bill_with_info` | Bấm "Gửi Bill Ngay" | Đợi ảnh bill |
| `awaiting_bill_with_info` | Gửi ảnh bill | `confirming_final` |
| `confirming_final` | Bấm "Xác nhận" | Submit + Clear |

---

## 🛠️ Files Đã Sửa

1. **bot.js**
   - `start_registration` handler mới
   - `send_bill_with_info` handler mới
   - Thêm `awaiting_all_info` vào text handler

2. **handlers/billHandler.js**
   - `handleAllInfoInput()` - Xử lý 4 dòng thông tin
   - `processBillWithInfo()` - Xử lý bill khi đã có thông tin
   - Update `handlePhotoUpload()` - Hỗ trợ state mới

---

## 🧪 Test Cases

### **Test 1: Happy Path**
```
1. Bấm "Bắt Đầu Đăng Ký"
2. Gửi:
   test@gmail.com
   houji
   ABC123
   MGD123
3. Kỳ vọng: QR code hiển thị
4. Bấm "Gửi Bill Ngay"
5. Gửi ảnh bill
6. Kỳ vọng: Xác nhận cuối
7. Bấm "Xác nhận"
8. Kỳ vọng: Thành công
```

### **Test 2: Thiếu Dòng**
```
1. Bấm "Bắt Đầu Đăng Ký"
2. Gửi:
   test@gmail.com
   houji
   ABC123
3. Kỳ vọng: Bot báo lỗi "Thông tin chưa đủ"
```

### **Test 3: Email Sai**
```
1. Bấm "Bắt Đầu Đăng Ký"
2. Gửi:
   invalid-email
   houji
   ABC123
   MGD123
3. Kỳ vọng: Bot báo "Email không hợp lệ"
```

---

## 🚀 Triển Khai

```bash
# Restart bot để áp dụng thay đổi
npm start
```

---

## 💡 Tips Cho User

1. **Lưu template sẵn** để copy nhanh:
   ```
   your@email.com
   your_device_codename
   your_serial_number
   your_transaction_code
   ```

2. **Kiểm tra kỹ** trước khi gửi:
   - Đủ 4 dòng chưa?
   - Email có @ chưa?
   - Codename có đúng không? (kiểm tra tại website)

3. **Nếu gửi sai**, bấm "🔄 Đăng Ký Lại" và gửi lại

---

**Version:** 1.1.0  
**Updated:** 2026-10-05  
**Status:** ✅ Deployed
