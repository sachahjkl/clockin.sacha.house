FROM node:lts-slim

# add curl for healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci \
    && npm cache clean --force \
    && mv /app/node_modules /node_modules

EXPOSE 4200

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD [ "npm", "run", "build" ]