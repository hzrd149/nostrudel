# syntax=docker/dockerfile:1
FROM node:20-alpine as builder

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

FROM nginx:stable-alpine-slim as main
EXPOSE 80

# install nodejs
RUN apk add --no-cache libstdc++ wget
RUN wget https://unofficial-builds.nodejs.org/download/release/v20.12.2/node-v20.12.2-linux-x64-musl.tar.gz
RUN tar -xf node-v20.12.2-linux-x64-musl.tar.gz && mv node-v20.12.2-linux-x64-musl node-v20.12.2
RUN rm node-v20.12.2-linux-x64-musl.tar.gz

# install tor
# copied from https://github.com/klemmchr/tor-alpine/blob/master/Dockerfile
RUN echo '@edge https://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories && \
    apk -U upgrade && \
    apk -v add tor@edge torsocks@edge

# remove tmp files
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

ARG PATH="/node-v20.12.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ENV PATH="${PATH}"

RUN npm install -g yarn@1.22

WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html

# copy server
COPY server/ /app/server/
RUN cd /app/server/ && yarn install

# setup entrypoint
ADD ./docker-entrypoint.sh docker-entrypoint.sh
RUN chmod a+x docker-entrypoint.sh

ENTRYPOINT "/app/docker-entrypoint.sh"
