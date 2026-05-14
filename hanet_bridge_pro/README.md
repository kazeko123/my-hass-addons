🚀 Hướng dẫn Cài đặt (Installation)
Vì đây là một Add-on cục bộ (Local Add-on), bạn cần thực hiện các bước sau để cài đặt vào Home Assistant:

Bước 1: Chuẩn bị thư mục
Truy cập vào Home Assistant qua Samba Share hoặc File Editor/Studio Code Server.

Đi đến thư mục addons. (Nếu chưa có, hãy tạo thư mục tên là addons ngang hàng với thư mục config).

Tạo một thư mục mới bên trong addons, đặt tên là hanet_bridge_pro.

Copy toàn bộ 4 file sau vào thư mục addons/hanet_bridge_pro:

bridge.py

Dockerfile

config.json

icon.png

Bước 2: Cài đặt Add-on
Vào Settings (Cài đặt) > Add-ons.

Nhấn vào nút Add-on Store (Cửa hàng Add-on) ở góc dưới bên phải.

Nhấn vào dấu 3 chấm ở góc trên bên phải > Chọn Check for updates (Kiểm tra cập nhật).

Kéo xuống dưới cùng danh sách, bạn sẽ thấy mục Local Add-ons xuất hiện add-on Hanet Camera Bridge Pro.

Nhấn vào nó và chọn Install.

Bước 3: Khởi động
Sau khi cài đặt xong, bật Start on boot và Watchdog.

Nhấn Start.

Chờ khoảng 1-2 phút để hệ thống cài đặt các thư viện AI (lần đầu khởi động sẽ hơi lâu).

Nhấn vào Open Web UI để vào giao diện quản lý.

⚙️ Cấu hình (Configuration)
Khác với các Add-on thông thường, cấu hình của Hanet Bridge Pro được thực hiện trực tiếp trên Giao diện Web (Web UI).

Mở Web UI của Add-on.

Đăng nhập với mật khẩu mặc định: 123456.

Vào menu Cài đặt.

Điền thông tin MQTT Broker của bạn (Host, Port, User, Pass).

Lưu ý: Topic mặc định Hanet thường gửi là /topic/detected/#. Nếu bạn đã cấu hình khác trên Camera, hãy sửa lại dòng "Hanet Topic".

Nhấn Lưu cấu hình và khởi động lại Add-on nếu cần.

🤖 Hướng dẫn tích hợp Home Assistant (Automation)
Sau khi Add-on chạy và kết nối MQTT thành công, addon sẽ tự tạo các Sensor.

**Ví dụ Automation**
Kịch bản 1: Chào mừng khi người nhà về (Phát loa Google/Alexa)
YAML

alias: "Hanet - Chào mừng về nhà"
description: "Phát loa chào khi nhận diện người quen"
trigger:
  - platform: mqtt
    topic: "hanet_bridge/DEVICE_ID/state"
condition:
  - condition: template
    value_template: "{{ trigger.payload_json.person_type in ['Gia đình', 'Người quen', 'Người quen (AI)'] }}"
action:
  - service: tts.google_translate_say
    data:
      entity_id: media_player.google_home
      message: "Chào mừng {{ trigger.payload_json.person_name }} đã về nhà."
mode: single
Kịch bản 2: Cảnh báo người lạ qua điện thoại (Kèm ảnh)
YAML

alias: "Hanet - Cảnh báo người lạ"
description: "Gửi thông báo kèm ảnh khi có người lạ"
trigger:
  - platform: mqtt
    topic: "hanet_bridge/DEVICE_ID/state"
condition:
  - condition: template
    value_template: "{{ trigger.payload_json.person_type == 'Người lạ' }}"
action:
  - service: notify.mobile_app_iphone
    data:
      message: "Phát hiện người lạ tại cửa!"
      data:
        image: "/api/camera_proxy/camera.hanet_last_capture" # Entity camera đã tạo ở bước 2
mode: single
Kịch bản 3: Bật đèn khi có chuyển động (Dùng Binary Sensor tự động tạo)
Add-on sẽ tự động tạo một binary sensor có dạng binary_sensor.motion_ten_camera.

YAML

alias: "Hanet - Bật đèn cửa"
trigger:
  - platform: state
    entity_id: binary_sensor.motion_hanet_camera_xyz
    to: "on"
action:
  - service: light.turn_on
    target:
      entity_id: light.den_cong
🛠 Hướng dẫn sử dụng Web UI
1. Dashboard
Xem thống kê tổng quan.

Xem dòng sự kiện (Live Feed) những người vừa đi qua.

Quick Add: Nhấn vào nút dấu cộng (+) trên ảnh người lạ ở Dashboard để nhanh chóng thêm họ vào danh sách người quen và training AI.

2. Khuôn mặt (Faces)
Quản lý danh sách những người đã được học.

Thêm người mới thủ công bằng cách upload ảnh (Nên upload > 5 ảnh rõ mặt ở các góc độ khác nhau để AI học tốt nhất).

3. Lịch sử (History)
Xem lại toàn bộ lịch sử ra vào.

Lọc theo ngày, theo tên, theo camera.

Sửa sai: Nếu AI nhận diện sai hoặc là người lạ, bạn có thể bấm vào nút "Định danh" để dạy lại cho AI.

4. Test AI
Upload một ảnh bất kỳ để kiểm tra xem AI của Add-on sẽ nhận diện là ai và độ chính xác bao nhiêu phần trăm.

❓ Xử lý sự cố (Troubleshooting)
1. Add-on không khởi động được?

Kiểm tra log trong tab "Log" của Add-on.

Đảm bảo bạn không đổi cổng 2900 thành cổng khác đã được sử dụng.

2. Không nhận được dữ liệu MQTT?

Vào Settings kiểm tra lại thông tin MQTT Broker.

Đảm bảo Camera Hanet và Home Assistant đang cùng mạng LAN.

Dùng phần mềm như MQTT Explorer để xem Camera có thực sự đang gửi tin nhắn vào topic /topic/detected/xxxx hay không.

3. AI nhận diện sai?

Vào mục Lịch sử, tìm ảnh bị sai, nhấn nút thêm người và đặt lại tên đúng. Hệ thống sẽ học lại đặc điểm khuôn mặt đó.

Vào Cài đặt, tăng Threshold (Độ nhạy) lên mức cao hơn (ví dụ 0.6 hoặc 0.65) để khắt khe hơn trong việc nhận diện.
