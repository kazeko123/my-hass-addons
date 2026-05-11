# 🤖 AI Proxy Router Add-on — Hướng dẫn sử dụng từ A-Z

> Dành cho người dùng Home Assistant muốn gom nhiều API key/provider AI vào 1 điểm gọi, có fallback khi 1 key hết quota/lỗi.

---

## 1) Add-on này dùng để làm gì?

**AI Proxy Router** là lớp trung gian giữa app/automation và các nhà cung cấp AI.

Bạn gửi request vào 1 endpoint duy nhất của add-on, add-on sẽ:
- Chọn provider/model phù hợp theo cấu hình
- Tự fallback khi provider/key lỗi hoặc hết quota
- Hỗ trợ text + vision (tuỳ model/provider)
- Ghi log/trạng thái route để dễ debug

Phù hợp khi bạn muốn:
- Tăng ổn định (high availability)
- Dùng nhiều key hợp pháp, tránh gián đoạn do quota từng key
- Quản lý tập trung thay vì sửa từng automation

---

## 2) Yêu cầu trước khi cài

- Home Assistant có Supervisor (HA OS / Supervised)
- Mạng internet ổn định
- Ít nhất 1 API key hợp lệ từ provider bạn dùng
- Đã thêm repository public:

```text
https://github.com/trankhanhduy2929-beep/my_hass_addon_public
```

---

## 3) Cài đặt add-on

1. Vào **Settings → Add-ons → Add-on Store**
2. Tìm **AI Proxy Router**
3. Nhấn **Install**
4. Chờ pull image + cài xong
5. Bật tuỳ chọn:
   - **Start on boot** (khuyên bật)
   - **Watchdog** (khuyên bật)
6. Nhấn **Start**

Nếu cài lỗi kéo image:
- Kiểm tra internet
- Kiểm tra repo đã đúng URL
- Kiểm tra kiến trúc máy (amd64/aarch64/armv7)
- Xem mục Troubleshooting phía dưới

---

## 4) Truy cập giao diện add-on

Sau khi start:
- Nhấn **Open Web UI** trong trang add-on
- Hoặc vào ingress panel **AI Proxy** trong Home Assistant

Bạn sẽ thấy màn hình quản lý provider/model/test route/log.

### Đăng nhập mặc định (lần đầu)
- Tài khoản: `admin`
- Mật khẩu: `1234`

**Quan trọng:** đăng nhập xong, đổi ngay tài khoản/mật khẩu ở mục **Account** để an toàn.

---

## 5) Cấu hình cơ bản (khuyên dùng)

> Tuỳ bản build UI, tên field có thể khác nhẹ. Luồng chuẩn vẫn giống nhau.

### Bước 1: Thêm provider
Ví dụ: Groq, Gemini, OpenRouter

Cần nhập:
- Base URL API
- API key
- (Tuỳ chọn) tên hiển thị provider

### Bước 2: Chọn model mặc định
- Chọn model text mặc định
- Nếu dùng ảnh, chọn model vision tương thích

### Bước 3: Bật fallback
- Sắp thứ tự ưu tiên provider/key
- Khi route 1 lỗi, tự thử route tiếp theo

### Bước 4: Lưu cấu hình
- Nhấn Save
- Dùng nút Test để kiểm tra kết nối/model

---

## 6) Cách dùng trong automation / app

Ý tưởng: mọi nơi chỉ gọi **1 endpoint proxy** thay vì gọi thẳng provider.

Luồng:
1. Automation gửi prompt/image vào AI Proxy Router
2. Add-on chọn route tốt nhất theo cấu hình
3. Trả kết quả về automation

Bạn có thể dùng cho:
- AI Vision mô tả camera
- Bot trả lời hội thoại
- Tóm tắt text, phân tích sự kiện

---

## 7) Ví dụ request (chuẩn OpenAI-compatible)

> Chỉ là ví dụ tham khảo. Dùng đúng endpoint theo UI/docs nội bộ add-on.

```bash
curl -X POST "http://<HA_HOST>:1236/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_NEU_CO>" \
  -d '{
    "model": "auto",
    "messages": [
      {"role":"user","content":"Xin chào, test route"}
    ]
  }'
```

Vision mẫu:

```json
{
  "model": "auto-vision",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type":"text","text":"Mô tả ảnh này"},
        {"type":"image_url","image_url":{"url":"https://example.com/cam.jpg"}}
      ]
    }
  ]
}
```

---

## 8) Best practice (quan trọng)

- Dùng **nhiều key hợp pháp** để tăng ổn định
- Không hardcode key trong automation YAML công khai
- Ưu tiên lưu secret ở nơi an toàn
- Tách model text và vision riêng để tối ưu chi phí/tốc độ
- Theo dõi log fallback để biết key nào hay lỗi/quá tải
- Đặt timeout hợp lý, tránh treo automation lâu

---

## 9) Bảo mật

- Không chia sẻ API key trong ảnh/chụp log công khai
- Nếu nghi lộ key: revoke + tạo key mới ngay
- Chỉ mở port khi thực sự cần truy cập ngoài HA
- Nếu chỉ dùng nội bộ HA, ưu tiên ingress nội bộ

---

## 10) Troubleshooting nhanh

### Lỗi 401 / unauthorized
- Key sai hoặc hết hiệu lực
- Provider từ chối do quyền model
- Kiểm tra lại key + quyền model

### Lỗi model not available
- Model không tồn tại trên provider đó
- Đổi model tương thích hoặc bật fallback model

### Add-on không start
- Xem tab **Log** trong add-on
- Kiểm tra config sai format
- Kiểm tra image đúng kiến trúc máy

### Pull image bị denied (GHCR)
- Repo/package chưa public hoặc tag chưa tồn tại
- Kiểm tra đúng tên image + version tag trong `config.yaml`

### Request chậm
- Provider đang quá tải
- Đặt timeout thấp hơn
- Ưu tiên provider nhanh ở đầu danh sách fallback

---

## 11) Quy trình cập nhật an toàn

1. Backup cấu hình hiện tại
2. Update add-on từ Store
3. Restart add-on
4. Test lại 1 request text + 1 request vision
5. Kiểm tra log 5–10 phút đầu

---

## 12) Gỡ cài đặt

1. Stop add-on
2. Disable Start on boot
3. Uninstall
4. Xoá dữ liệu cấu hình nếu không còn dùng key cũ

---

## 13) Thông tin kỹ thuật (theo bản public hiện tại)

- **Slug:** `ai_proxy_router`
- **Version:** `1.0.6`
- **Ingress port:** `1236`
- **Architectures:** `amd64`, `aarch64`, `armv7`
- **Image:** `ghcr.io/trankhanhduy2929-beep/ai_proxy_router-{arch}`

---

## 14) FAQ ngắn

**Q: Có phải để lách giới hạn nhà cung cấp không?**  
A: Không. Mục tiêu là tăng ổn định dịch vụ bằng failover hợp lệ giữa nhiều key/provider bạn sở hữu hợp pháp.

**Q: Có dùng được cho camera AI không?**  
A: Có, nếu model/provider vision tương thích.

**Q: Tôi chỉ có 1 key thì có dùng được không?**  
A: Có. Nhưng fallback/HA sẽ mạnh nhất khi có nhiều route.

---

## 15) Hỗ trợ

- Mở Issue tại repository public
- Gửi log lỗi (ẩn key trước khi gửi)
- Nêu rõ: model, provider, thời điểm lỗi, nội dung lỗi

---

Chúc bạn triển khai mượt, ổn định, ít gián đoạn 🦞
