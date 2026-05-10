# 🏠 Trần Khánh Duy - Home Assistant Add-on Repository

Chào mừng bạn đến với kho **Home Assistant Add-on Repository**.

Đây là nơi tổng hợp các add-on dành cho **Home Assistant**, giúp mở rộng hệ thống với các tính năng AI, camera, media và tích hợp thực tế.

---

## 🚀 Cách thêm repository vào Home Assistant

1. Mở **Home Assistant**
2. Vào **Settings** → **Add-ons** → **Add-on Store**
3. Nhấn dấu **⋮** ở góc phải trên cùng
4. Chọn **Repositories**
5. Dán URL repository:

```text
https://github.com/trankhanhduy2929-beep/my_hass_addon_public
```

6. Nhấn **Add**
7. Quay lại **Add-on Store** để cài add-on mong muốn

---

## 📦 Các add-on hiện có

### 🤖 AI Proxy Router

**Slug:** `ai_proxy_router`  
**Version:** `1.0.6`

Add-on hỗ trợ định tuyến AI thông minh cho nhiều tác vụ khác nhau trong hệ thống.

### Tính năng nổi bật

- Quản lý request AI tập trung
- Hỗ trợ nhiều provider/model tùy cấu hình
- Tự động fallback khi model/provider gặp lỗi
- Hỗ trợ các tác vụ AI text và vision
- Theo dõi trạng thái route thuận tiện
- Có giao diện mở trực tiếp trong Home Assistant

---

### 📷 Hanet Camera Bridge

**Slug:** `hanet_bridge`  
**Version:** `2.5.2`

Add-on kết nối Hanet AI Camera với Home Assistant.

### Tính năng nổi bật

- Kết nối dữ liệu từ Hanet AI Camera
- Hỗ trợ bridge dữ liệu qua MQTT/Webhook
- Dễ dùng cho automation và giám sát
- Có giao diện mở trực tiếp trong Home Assistant
- Phù hợp cho nhu cầu tích hợp cơ bản, gọn nhẹ

---

### 📷 Hanet Camera Bridge Pro

**Slug:** `hanet_bridge_pro`  
**Version:** `3.0.1`

Phiên bản nâng cao của Hanet Bridge, phục vụ nhu cầu tích hợp chuyên sâu hơn.

### Tính năng nổi bật

- Kết nối Hanet AI Camera với Home Assistant
- Đồng bộ dữ liệu ổn định hơn cho các kịch bản thực tế
- Hỗ trợ xử lý nhận diện nâng cao
- Phù hợp cho nhu cầu mở rộng và triển khai chuyên nghiệp
- Có giao diện mở trực tiếp trong Home Assistant

---

### 🧠 AI Vision Entity Describer

**Slug:** `ai_vision_entity_describer`  
**Version:** `1.1.1`

Add-on dùng AI để mô tả nội dung ảnh từ camera hoặc entity trong Home Assistant.

### Tính năng nổi bật

- Phân tích ảnh từ camera/entity
- Tạo mô tả bằng AI cho hình ảnh nhận được
- Phù hợp cho camera giám sát, cảnh báo thông minh, tóm tắt sự kiện
- Lưu lịch sử mô tả để tiện theo dõi
- Có giao diện trực tiếp trong Home Assistant

---

### 🎵 YouTube Music Cinematic

**Slug:** `youtube_cast_addon`  
**Version:** `1.20.17`

Add-on phát nhạc YouTube với giao diện trực quan, phù hợp cho trải nghiệm media trong Home Assistant.

### Tính năng nổi bật

- Tìm kiếm và phát nhạc YouTube
- Cast nhạc tới thiết bị/media player trong Home Assistant
- Giao diện cinematic đẹp, dễ dùng
- Hỗ trợ danh sách phát, hàng chờ và các tiện ích nghe nhạc tùy phiên bản
- Mở trực tiếp trong Home Assistant

---

## 🧩 Cấu trúc repository

```text
.
├── README.md
├── repository.yaml
├── ai_proxy_router/
├── hanet_bridge/
├── hanet_bridge_pro/
├── hass-ai-vision-addon/
└── youtube_cast_addon/
```

---

## ✅ Phù hợp với ai?

Repository này phù hợp nếu bạn muốn:

- Mở rộng Home Assistant với các add-on AI
- Tích hợp camera Hanet vào hệ thống nhà thông minh
- Tạo mô tả hình ảnh bằng AI từ camera/entity
- Phát nhạc YouTube trong Home Assistant với giao diện đẹp
- Cài add-on tiện lợi thông qua Add-on Store

---

## 🔄 Cập nhật add-on

Khi có phiên bản mới:

1. Mở **Add-on Store** trong Home Assistant
2. Tìm add-on đang dùng
3. Nếu có bản mới, Home Assistant sẽ hiển thị cập nhật
4. Nhấn **Update** để nâng cấp

---

## 🌐 Tham khảo thêm

👉 **https://banhang.trankhanhduy.click/**

---

## 📬 Hỗ trợ

Nếu cần hỗ trợ cài đặt hoặc sử dụng add-on, bạn có thể tạo issue trên GitHub hoặc liên hệ qua kênh phù hợp.

Cảm ơn bạn đã sử dụng repository này ❤️
