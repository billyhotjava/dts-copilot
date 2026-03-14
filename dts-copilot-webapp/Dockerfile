ARG IMAGE_NODE=node:20-alpine
ARG IMAGE_NGINX=nginx:alpine

FROM ${IMAGE_NODE} AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || npm install
COPY . .
RUN npm run build

FROM ${IMAGE_NGINX}
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
