FROM node:20-alpine
WORKDIR /usr/src/app
ARG NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
EXPOSE 3000
CMD ["node", "src/app.js"]
