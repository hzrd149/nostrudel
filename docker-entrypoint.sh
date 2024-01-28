#!/bin/sh
set -e

PROXY_PASS_BLOCK=""

if [ -n "$CACHE_RELAY" ]; then
  echo "Cache relay set to $CACHE_RELAY"
  sed -i 's/CACHE_RELAY_ENABLED = false/CACHE_RELAY_ENABLED = true/g' /usr/share/nginx/html/index.html
  PROXY_PASS_BLOCK="$PROXY_PASS_BLOCK
    location /local-relay {
      proxy_pass http://$CACHE_RELAY/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  "
else
  echo "No cache relay set"
fi

if [ -n "$CORS_PROXY" ]; then
  echo "CORS proxy set to $CORS_PROXY"
  sed -i 's/CORS_PROXY_PATH = ""/CORS_PROXY_PATH = "\/corsproxy"/g' /usr/share/nginx/html/index.html
  PROXY_PASS_BLOCK="$PROXY_PASS_BLOCK
    location /corsproxy/ {
      proxy_pass http://$CORS_PROXY;
      rewrite ^/corsproxy/(.*) /\$1 break;
    }
  "
else
  echo "No CORS proxy set"
fi

if [ -n "$IMAGE_PROXY" ]; then
  echo "Image proxy set to $IMAGE_PROXY"
  sed -i 's/IMAGE_PROXY_PATH = ""/IMAGE_PROXY_PATH = "\/imageproxy"/g' /usr/share/nginx/html/index.html
  PROXY_PASS_BLOCK="$PROXY_PASS_BLOCK
    location /imageproxy/ {
      proxy_pass http://$IMAGE_PROXY;
      rewrite ^/imageproxy/(.*) /\$1 break;
    }
  "
else
  echo "No Image proxy set"
fi

CONF_FILE="/etc/nginx/conf.d/default.conf"
NGINX_CONF="
server {
    listen 80;

    server_name localhost;

    $PROXY_PASS_BLOCK

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }

    # Gzip settings
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
"
echo "$NGINX_CONF" > $CONF_FILE

_term() {
  echo "Caught SIGTERM signal!"
  kill -SIGTERM "$nginx_process" 2>/dev/null
}

nginx -g 'daemon off;' &
nginx_process=$!

trap _term SIGTERM

wait $nginx_process
