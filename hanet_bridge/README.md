Hanet Camera Bridge (Lite Version)
Hanet Camera Bridge là một Add-on dành cho Home Assistant, giúp kết nối và xử lý dữ liệu từ Hanet AI Camera (AI Box). Add-on này hoạt động như một cầu nối (bridge), nhận dữ liệu nhận diện khuôn mặt qua MQTT, lưu trữ hình ảnh lịch sử, và tạo giao diện Web quản lý trực quan.

Add-on này đặc biệt hữu ích để tích hợp tính năng nhận diện khuôn mặt vào các ngữ cảnh tự động hóa (Automation) trong Home Assistant.

✨ Tính năng nổi bật
⚡ Nhẹ & Nhanh: Phiên bản Lite tập trung vào hiệu suất.

📸 Giao diện Web trực quan: Xem lại lịch sử nhận diện, lọc theo ngày, tên, hoặc loại người (Gia đình/Người lạ).

💾 Lưu trữ cục bộ: Tự động lưu ảnh chụp khuôn mặt vào bộ nhớ Home Assistant (trong thư mục /data).

🔄 MQTT Bridge: Chuyển đổi dữ liệu từ Hanet sang dạng chuẩn MQTT dễ dùng cho Home Assistant Sensor.

🔐 Bảo mật: Có trang đăng nhập bảo vệ giao diện Web.

🧹 Tự động dọn dẹp: Tùy chọn thời gian lưu trữ (Retention days) để tự động xóa ảnh cũ.

📥 Hướng dẫn Cài đặt (Local Add-on)
Do đây là một Custom Add-on, bạn cần cài đặt thủ công thông qua thư mục addons.

Tải xuống: Tải toàn bộ mã nguồn của Add-on này về máy tính (file ZIP).

Giải nén: Giải nén file ZIP ra một thư mục.

Sao chép vào Home Assistant:

Sử dụng Samba Share hoặc File Editor để truy cập vào thư mục /addons/ trên Home Assistant của bạn.

Tạo một thư mục mới, ví dụ: hanet_bridge.

Copy toàn bộ các file (bridge.py, config.json, Dockerfile, run.sh, icon.png,...) vào thư mục /addons/hanet_bridge/.

Cài đặt:

Vào Settings (Cài đặt) -> Add-ons -> Add-on Store.

Bấm vào dấu 3 chấm ở góc trên bên phải -> chọn Check for updates.

Tìm kiếm "Hanet Camera Bridge bản LITE" trong mục Local Add-ons.

Bấm Install để cài đặt.

⚙️ Cấu hình & Sử dụng
1. Khởi chạy
Sau khi cài đặt xong:

Bấm Start để chạy Add-on.

Bật Show in sidebar để hiện icon bên thanh menu trái.

Bấm Open Web UI để truy cập giao diện quản lý.

2. Đăng nhập lần đầu
Mật khẩu mặc định: 123456

Lưu ý: Bạn nên đổi mật khẩu này ngay trong phần Cấu hình của Web UI.

3. Cấu hình Add-on (Trên Web UI)
Truy cập vào Web UI của Add-on, cột bên phải sẽ có phần Cấu hình Hệ thống:

Mật khẩu Web: Đổi mật khẩu đăng nhập Add-on.

MQTT Broker:

Host: core-mosquitto (Nếu bạn dùng Mosquitto broker của HA) hoặc IP của broker ngoài.

Port: 1883.

User/Pass: Tài khoản MQTT (nếu có).

Tên Camera: Đổi tên hiển thị cho các Device ID (ví dụ: ...A1B2 -> Cổng chính).

Lưu cấu hình: Nhấn nút Lưu để áp dụng (Add-on sẽ tự kết nối lại MQTT).

4. Cấu hình trên Hanet Camera (AI Box)
Bạn cần cấu hình thiết bị Hanet của mình để gửi dữ liệu về Home Assistant:

Truy cập trang cấu hình của Hanet Camera.

Tìm mục MQTT Setting.

Broker: Điền địa chỉ IP của Home Assistant.

Topic: Để mặc định hoặc set là /topic/detected/.



Sử dụng trong Automation
Ví dụ: Khi nhận diện người lạ, gửi thông báo kèm ảnh.

YAML

alias: "Cảnh báo người lạ"
trigger:
  - platform: mqtt
    topic: "hanet_bridge/YOUR_DEVICE_ID/state"
condition:
  - condition: template
    value_template: "{{ trigger.payload_json.person_type == 'Người lạ' }}"
action:
  - service: notify.mobile_app_iphone
    data:
      message: "Phát hiện người lạ: {{ trigger.payload_json.person_name }}"
      data:
        image: "/api/hassio_ingress/xxxxxxxx/img/YOUR_DEVICE_ID/latest.jpg" 
        # (Lưu ý: Đường dẫn ảnh cần điều chỉnh tùy theo cách bạn truy xuất file)
❓ Xử lý sự cố (Troubleshooting)
Không thấy dữ liệu trong Web UI?

Kiểm tra trạng thái MQTT trên góc phải giao diện Web UI (phải hiện màu xanh OK).

Kiểm tra xem Hanet Camera đã trỏ đúng IP của Home Assistant chưa.

Xem log của Add-on để biết chi tiết lỗi.

Không đăng nhập được?

Nếu quên mật khẩu, bạn có thể xem lại file cấu hình tại /data/config_custom.json bên trong container, hoặc xóa file này để reset về mặc định 123456.

Ổ cứng bị đầy?

Giảm số ngày lưu trữ (retention_days) trong phần Cấu hình xuống (mặc định là 7 ngày).

Thông tin kỹ thuật:

Port Web: 2912

Image Path: /data/hanet_detection

Config Path: /data/config_custom.json
