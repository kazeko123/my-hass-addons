# AI Vision Entity Describer Addon

Addon Home Assistant để:
- Lấy ảnh từ `camera.*` hoặc entity có `entity_picture`
- Gửi ảnh sang AI Proxy addon qua OpenAI-compatible Vision endpoint
- Hiển thị UI 2 cột: trái là lịch sử ảnh, phải là mô tả AI
- Publish mô tả ra MQTT để Home Assistant tự tạo sensor entity

## Cấu hình
Addon này **không dùng cấu hình ngoài của Home Assistant Add-on nữa**.
Tất cả cấu hình được nhập trực tiếp trong **Web UI / Ingress UI** của addon.

## Kết nối với AI Proxy addon
Điền trong Web UI:
- `ai_proxy_base_url`: ví dụ `http://homeassistant.local:1236/v1`
- Addon sẽ tự nối thành `/chat/completions`
- `ai_api_key`: key proxy của anh, hoặc `openai` nếu proxy không kiểm tra key
- `ai_model`: model vision đang map trong proxy

## MQTT entity xuất ra
Ví dụ với `camera.front_door` và prefix `ai_vision`:
- State topic: `ai_vision/camera_front_door/state`
- Attributes topic: `ai_vision/camera_front_door/attributes`
- Discovery topic: `homeassistant/sensor/ai_vision_camera_front_door/config`

Sau khi addon chạy, HA sẽ tự thấy sensor mới qua MQTT discovery nếu Mosquitto + MQTT integration đang hoạt động.

## Gợi ý cấu hình trong UI
- `ha_url`: `http://supervisor/core`
- `ha_token`: để trống nếu dùng `SUPERVISOR_TOKEN`; hoặc nhập long-lived access token
- `camera_entities`:
  - `camera.front_door`
  - `camera.garage`
- `scan_interval`: 30

## UI
Mở giao diện addon ở port `1237` để xem và cấu hình trực tiếp:
- Cột trái: form cấu hình ngay trong addon
- Cột giữa: ảnh lịch sử
- Cột phải: mô tả AI tương ứng
- Có thể nhập/sửa HA URL, token, entity camera, AI proxy, model, MQTT... rồi bấm **Lưu cấu hình**

## Lưu ý
- Ưu tiên entity camera hoặc entity có `entity_picture`
- Mỗi chu kỳ sẽ chụp lại và mô tả mới
- Lịch sử lưu SQLite tại `/data/vision_history.sqlite`
