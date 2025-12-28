FROM python:3.11-alpine

WORKDIR /app

# Cài đặt thư viện
RUN pip install --no-cache-dir paho-mqtt requests flask --break-system-packages

COPY bridge.py .

EXPOSE 2912

CMD ["python3", "bridge.py"]
