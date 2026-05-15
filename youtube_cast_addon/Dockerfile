ARG BUILD_FROM
FROM $BUILD_FROM

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    && pip3 install --no-cache-dir --break-system-packages \
    flask \
    flask-cors \
    yt-dlp \
    requests \
    gunicorn

# Copy app files
COPY rootfs /

# Make scripts executable
RUN chmod +x /etc/services.d/youtube_cast/run

EXPOSE 2232
