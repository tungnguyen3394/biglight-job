# ---- deps ----
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# ---- builder ----
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* được Next.js nhúng vào bundle client LÚC BUILD, nên phải có ở đây
# (truyền vào qua build arg — Client ID là thông tin công khai, không phải secret).
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_FACEBOOK_APP_ID
ENV NEXT_PUBLIC_FACEBOOK_APP_ID=$NEXT_PUBLIC_FACEBOOK_APP_ID
ARG NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME
ENV NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME=$NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME
RUN npx prisma generate && npm run build

# ---- runner ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Bind trên MỌI địa chỉ mạng, không chỉ hostname container.
# Bắt buộc để reverse proxy (caddy) ở mạng khác gọi vào được — nếu thiếu sẽ bị 502 connection refused.
ENV HOSTNAME=0.0.0.0
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

# Next.js standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma (schema + generated client/engine) for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Thư mục lưu file giấy tờ (volume sẽ kế thừa quyền nextjs khi tạo lần đầu)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
