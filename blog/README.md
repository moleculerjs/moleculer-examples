# Blog example

## Features
- multiple services (www, posts, users)
- Docker files to running in Docker containers (3 architectures)
- ExpressJS www server with Pug
- NATS transporter
- Redis cacher
- [Traefik](https://traefik.io/) reverse proxy (in micro arch)
- Static client side

## Install
```bash
git clone https://github.com/ice-services/moleculer-examples.git
cd blog
```

## Start locally

```bash
npm install
npm start
```

**Open the [http://localhost:3000](http://localhost:3000) URL in your browser.**


## Start on Docker

### Running as monolith (all services in a container)
```bash
cd docker/mono
docker-compose up
# or 
# ./start.sh
```
**Open the http://<docker-machine>:3000 URL in your browser.**

### Running as microservices (all services in separated containers, communicate via NATS & Traefik reverse proxy)
```bash
cd docker/micro
docker-compose up
# or 
# ./start.sh
```
**Open the http://<docker-machine>:3000 URL in your browser.**

If you want to scale up
```bash
# Scale users service to 2 instances
docker-compose scale users=2
```

You can scale up the API gateway as well. Traefik is load balancing the requests to gateway instances.
```bash
# Scale API gateway to 2 instances
docker-compose scale api=2
```

### Running as mixed (coherent services in the same container and communicate via NATS)
```bash
cd docker/mixed
docker-compose up
# or 
# ./start.sh
```
**Open the http://<docker-machine>:3000 URL in your browser.**


If you want to scale up
```bash
# Scale group1 container to 2 instances
docker-compose scale group1=2
```

## Development
```bash
npm run dev
```


# License
This repo is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2017 Ice Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)