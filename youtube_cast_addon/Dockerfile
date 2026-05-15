ARG BUILD_FROM
FROM ${BUILD_FROM}

ARG BUILD_ARCH
ARG BUILD_VERSION

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    curl \
    bash

# Install Python packages
RUN pip3 install --no-cache-dir \
    flask \
    flask-cors \
    yt-dlp \
    requests \
    gunicorn

# Copy app files
COPY rootfs /

# Make scripts executable
RUN chmod a+x /etc/services.d/youtube_cast/run

# Create persistent data directory
RUN mkdir -p /data
