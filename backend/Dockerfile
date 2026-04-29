FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001
CMD ["node", "src/app.js"]