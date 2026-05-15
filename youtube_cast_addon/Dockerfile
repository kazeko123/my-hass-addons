ARG BUILD_FROM
FROM $BUILD_FROM

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    curl \
    bash \
    && pip3 install --no-cache-dir \
    flask \
    flask-cors \
    yt-dlp \
    requests \
    gunicorn

# Copy app files
COPY rootfs /

# Make scripts executable
RUN chmod a+x /etc/services.d/youtube_cast/run

# Create data directory
RUN mkdir -p /data
