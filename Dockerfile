FROM node:22-bookworm-slim

WORKDIR /app

RUN npm install --global pnpm@10.34.3

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY servidor ./servidor
COPY compartido ./compartido

ENV NODE_ENV=production

USER node

EXPOSE 8080

CMD ["node", "--import", "tsx", "servidor/src/principal.ts"]
