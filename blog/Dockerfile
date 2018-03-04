FROM node:8-alpine

RUN addgroup -S mol && adduser -S -g mol mol

ENV HOME=/home/mol
ENV HOME_APP=$HOME/app
ENV NODE_ENV=production 

WORKDIR $HOME_APP

COPY package.json .

ADD https://github.com/Yelp/dumb-init/releases/download/v1.1.1/dumb-init_1.1.1_amd64 /usr/local/bin/dumb-init

# RUN apk add --no-cache --virtual .app-deps python make g++ git && \
# RUN apk add --no-cache --virtual git && \
RUN chown -R mol:mol $HOME/* /usr/local/ && \
    chmod +x /usr/local/bin/dumb-init && \
    npm install --silent --progress=false --production && \
    npm cache clean --force && \
    chown -R mol:mol $HOME/*

COPY . .

USER mol

# Start dumb-init https://github.com/Yelp/dumb-init#usage
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

CMD ["npm", "start"]