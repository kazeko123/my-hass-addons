# HASS Supervisor passes BUILD_ARCH and BUILD_VERSION, NOT BUILD_FROM
# build.yaml tells supervisor what BUILD_FROM to use
ARG BUILD_FROM
FROM ${BUILD_FROM:-homeassistant/amd64-base-python:3.11}

ARG BUILD_ARCH
ARG BUILD_VERSION

LABEL \
    io.hass.name="YouTube Music Cinematic" \
    io.hass.description="Trình phát nhạc YouTube cao cấp trên Home Assistant" \
    io.hass.version="${BUILD_VERSION}" \
    io.hass.type="addon" \
    io.hass.arch="${BUILD_ARCH}"

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
