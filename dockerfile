# syntax=docker/dockerfile:1
FROM node:20 as builder

WORKDIR /app
COPY . /app/

ENV VITE_COMMIT_HASH=""
ENV VITE_APP_VERSION="custom"
RUN yarn install && yarn build

FROM nginx:stable-alpine-slim
EXPOSE 80
COPY --from=builder /app/dist /usr/share/nginx/html

ENV CACHE_RELAY=""
ENV IMAGE_PROXY=""
ENV CORS_PROXY=""
ADD ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod a+x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT "/usr/local/bin/docker-entrypoint.sh"
