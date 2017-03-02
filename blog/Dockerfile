FROM node:6.10-alpine

RUN addgroup -S mol && adduser -S -g mol mol

ENV HOME=/home/node

ENV NODE_ENV=production 
ENV MOL_APIGW_PORT=3000

# Transporter settings
# ================
# ENV MOL_TRANSPORTER=nats 
# ENV MOL_NATS_URI=nats://nats:4222

# ENV MOL_TRANSPORTER=mqtt 
# ENV MOL_MQTT_URI=mqtt://mqtt:1883

# Cacher settings
# ================
# ENV MOL_CACHER=memory

# ENV MOL_CACHER=redis 
# ENV MOL_REDIS_URI=redis://redis


COPY package.json $HOME/app/
# COPY package.json npm-shrinkwrap.json yarn.lock $HOME/app/

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init

WORKDIR $HOME/app

# RUN apk add --no-cache --virtual .app-deps python make g++ git && \
RUN apk add --no-cache --virtual git && \
	chown -R mol:mol $HOME/* /usr/local/ && \
    chmod +x /usr/local/bin/dumb-init && \
#    npm cache clean && \
    npm install --progress=false --production && \
    chown -R mol:mol $HOME/*

# RUN apk add --no-cache --virtual .app-deps python make g++ \
#   && yarn --pure-lockfile \
#   && yarn cache clean \
#   && apk del .app-deps

COPY index.js $HOME/app/
COPY services $HOME/app/services/
COPY assets $HOME/app/assets/

USER mol

EXPOSE $MOL_APIGW_PORT

CMD ["dumb-init", "npm", "start"]