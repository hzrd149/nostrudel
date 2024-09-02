#!/bin/sh
set -e

PROXY_PASS_BLOCK=""

# start tor if set to true
if [ "$TOR_PROXY" = "true" ]; then
  echo "Starting tor socks proxy"

  tor &
  tor_process=$!
  TOR_PROXY="127.0.0.1:9050"
fi

# inject request proxy
if [ -n "$REQUEST_PROXY" ]; then
  REQUEST_PROXY_URL="$REQUEST_PROXY"

  if [ "$REQUEST_PROXY" = "true" ]; then
    REQUEST_PROXY_URL="127.0.0.1:8080"
  fi

  echo "Request proxy set to $REQUEST_PROXY"
  sed -i 's/REQUEST_PROXY = ""/REQUEST_PROXY = "\/request-proxy"/g' /usr/share/nginx/html/index.html
  PROXY_PASS_BLOCK="$PROXY_PASS_BLOCK
    location /request-proxy/ {
      proxy_pass http://$REQUEST_PROXY_URL;
      rewrite ^/request-proxy/(.*) /\$1 break;
    }
  "

  if [ -n "$PROXY_FIRST" ]; then
    echo "Telling app to use request proxy first"
    sed -i 's/PROXY_FIRST = false/PROXY_FIRST = true/g' /usr/share/nginx/html/index.html
  fi
else
  echo "No request proxy set"
fi

# inject cache relay URL
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

# inject image proxy URL
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
    merge_slashes off;

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

  # stop node server
  if [ "$REQUEST_PROXY" = "true" ]; then
    kill -SIGTERM "$node_process" 2>/dev/null
  fi

  # stop tor if started
  if [ "$TOR_PROXY" = "true" ]; then
    kill -SIGTERM "$tor_process" 2>/dev/null
  fi

  # stop nginx
  kill -SIGTERM "$nginx_process" 2>/dev/null
}

if [ "$REQUEST_PROXY" = "true" ]; then
  echo "Starting local request proxy"
  node server/index.js &
  node_process=$!
fi

nginx -g 'daemon off;' &
nginx_process=$!

trap _term SIGTERM

wait $nginx_process
