FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libreoffice \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "src/app.js"]