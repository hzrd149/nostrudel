# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY ./package*.json .
COPY ./yarn.lock .
ENV NODE_ENV='development'
RUN yarn install --production=false --frozen-lockfile

COPY . .

ENV VITE_COMMIT_HASH=""
ENV VITE_APP_VERSION="custom"
RUN yarn build

FROM nginx:stable-alpine-slim AS main
EXPOSE 80

WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html

# setup entrypoint
ADD ./docker-entrypoint.sh docker-entrypoint.sh
RUN chmod a+x docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
