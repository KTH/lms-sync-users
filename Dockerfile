FROM kthse/kth-nodejs:10.14.0
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
