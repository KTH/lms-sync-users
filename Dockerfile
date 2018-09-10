FROM kthse/kth-nodejs-api:2.4

COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]

# Source files in root
COPY ["app.js", "app.js"]
COPY ["canvasApi.js", "canvasApi.js"]
COPY ["csvFile.js", "csvFile.js"]
COPY ["forkedApp.js", "forkedApp.js"]
COPY ["package.json", "package.json"]

# Source files directories
COPY ["server", "server"]
COPY ["messages", "messages"]

RUN npm install --production --ignore-engines --no-optional

EXPOSE 3000

CMD ["node", "app.js"]
