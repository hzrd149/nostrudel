#!/bin/sh
set -e

CACHE_RELAY_PROXY=""
if [ -z ${CACHE_RELAY+x} ]; then
  echo "No cache relay set"
else
  echo "Cache relay set to $CACHE_RELAY"
  sed -i 's/CACHE_RELAY_ENABLED = false/CACHE_RELAY_ENABLED = true/g' /usr/share/nginx/html/index.html
  CACHE_RELAY_PROXY="
    location /cache-relay {
        proxy_pass http://$CACHE_RELAY/;
    }
  "
fi

CONF_FILE="/etc/nginx/conf.d/default.conf"
NGINX_CONF="
server {
    listen 80;

    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
    }

    $CACHE_RELAY_PROXY

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
