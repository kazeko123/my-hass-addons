# 🏠 Trần Khánh Duy - Home Assistant Add-on Repository (Public)

Chào mừng bạn đến với kho **Home Assistant Add-on Public**.

Kho này cung cấp metadata add-on để cài trực tiếp trên Home Assistant.  
Source code chi tiết được quản lý ở kho private, còn kho public tập trung vào trải nghiệm cài đặt nhanh, gọn, ổn định.

---

## 📦 Add-ons hiện có

- **AI Proxy Router**
  - Định tuyến request AI qua nhiều provider/model
  - Tối ưu fallback và theo dõi trạng thái route

- **Hanet Bridge Pro**
  - Kết nối dữ liệu Hanet với hệ thống Home Assistant
  - Đồng bộ dữ liệu phục vụ automation/giám sát

> Danh sách add-on sẽ được cập nhật theo từng phiên bản mới.

---

## ⚡ Cách thêm repository vào Home Assistant

1. Vào **Settings → Add-ons → Add-on Store**
2. Nhấn menu **⋮** góc phải → **Repositories**
3. Dán URL repository public ([Git URL](https://github.com/trankhanhduy2929-beep/my_hass_addon_public))
4. Nhấn **Add**
5. Quay lại Add-on Store để cài add-on mong muốn

---

## 🔖 Lưu ý quan trọng

- Trường `version` trong `config.yaml` phải khớp với image tag đã build trên GHCR
- Trường `image` phải trỏ đúng namespace/package theo kiến trúc (`aarch64`, `amd64`, `armv7`, ...)
- Nếu gặp lỗi pull image (`manifest unknown`, `denied`), kiểm tra:
  - package GHCR đã để **public** chưa
  - tag version có tồn tại chưa
  - tên image có đúng không

---

## 🛠️ Quy trình phát hành (tóm tắt)

- Build & push image multi-arch từ repo private bằng GitHub Actions
- Public repo cập nhật metadata (`repository.yaml`, `config.yaml`)
- Home Assistant đọc metadata từ repo public và pull image từ GHCR

---

## 🌐 Ghé thăm web bán hàng của mình

Nếu bạn quan tâm giải pháp/ứng dụng triển khai thực tế, mời ghé:

👉 **https://banhang.trankhanhduy.click/**

Cảm ơn bạn đã ủng hộ ❤️

---

## 📬 Liên hệ / Hỗ trợ

Nếu cần hỗ trợ cài đặt, debug add-on hoặc tích hợp thực tế, hãy tạo issue trong repo hoặc liên hệ trực tiếp theo kênh bạn đang sử dụng.
