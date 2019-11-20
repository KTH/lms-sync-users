FROM kthse/kth-nodejs:10.14.0

RUN apk update; apk add python make;
WORKDIR /lms-sync-users
COPY ["package.json", "/lms-sync-users/package.json"]
COPY ["package-lock.json", "/lms-sync-users/package-lock.json"]
RUN npm ci --production

# Source files in root
COPY ["app.js", "/lms-sync-users/app.js"]
COPY ["canvasApi.js", "/lms-sync-users/canvasApi.js"]
COPY ["csvFile.js", "/lms-sync-users/csvFile.js"]

# Source files directories
COPY ["config", "/lms-sync-users/config"]
COPY ["server", "/lms-sync-users/server"]
COPY ["messages", "/lms-sync-users/messages"]

EXPOSE 3000

CMD ["node", "app.js"]
