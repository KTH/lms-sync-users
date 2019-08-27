FROM kthse/kth-nodejs:10.14.0
RUN apk update; apk add python make;
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

# Source files in root
COPY ["app.js", "app.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]
COPY ["package.json", "package.json"]

# Source files directories
COPY ["config", "config"]
COPY ["server", "server"]
COPY ["messages", "messages"]

RUN npm ci --production

EXPOSE 3000

CMD ["node", "app.js"]
