FROM node:6.10-alpine

RUN addgroup -S mol && adduser -S -g mol mol

ENV HOME=/home/node
ENV NODE_ENV production

COPY package.json npm-shrinkwrap.json yarn.lock $HOME/app/

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init

WORKDIR $HOME/app

RUN chown -R mol:mol $HOME/* /usr/local/ && \
    chmod +x /usr/local/bin/dumb-init && \
    npm cache clean && \
    npm install --silent --progress=false --production && \
    chown -R mol:mol $HOME/*

# RUN apk add --no-cache --virtual .app-deps python make g++ \
#   && yarn --pure-lockfile \
#   && yarn cache clean \
#   && apk del .app-deps

COPY . $HOME/app/

USER mol

EXPOSE 3000

CMD ["dumb-init", "npm", "start"]