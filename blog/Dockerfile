FROM node:8.9-alpine

RUN addgroup -S mol && adduser -S -g mol mol

ENV HOME=/home/mol
ENV HOME_APP=$HOME/app
ENV NODE_ENV=production 

COPY package.json $HOME_APP/
# COPY package.json npm-shrinkwrap.json yarn.lock $HOME_APP/

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init

WORKDIR $HOME_APP

# RUN apk add --no-cache --virtual .app-deps python make g++ git && \
# RUN apk add --no-cache --virtual git && \
RUN chown -R mol:mol $HOME/* /usr/local/ && \
    chmod +x /usr/local/bin/dumb-init && \
    npm install --silent --progress=false --production && \
    npm cache clean --force && \
    chown -R mol:mol $HOME/*

# RUN apk add --no-cache --virtual .app-deps python make g++ \
#   && yarn --pure-lockfile \
#   && yarn cache clean \
#   && apk del .app-deps

COPY moleculer.config.js $HOME_APP/
COPY services/ $HOME_APP/services/
COPY models/ $HOME_APP/models/ 
COPY public/ $HOME_APP/public/ 
COPY views/ $HOME_APP/views/

USER mol

# Start dumb-init https://github.com/Yelp/dumb-init#usage
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

CMD ["npm", "start"]