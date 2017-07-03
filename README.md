# moleculer-examples
Examples for Moleculer microservices framework

## [Blog site](/blog)

### Features
- multiple services
- Docker files to running in Docker containers
- 3 kind architectures

### Install
```bash
cd blog
npm install
```

### Start

#### Running as monolith (all services on a node)
```bash
cd docker/mono
./start.sh
# or 
# docker-compose up
```

#### Running as microservices (all services on a separated node with NATS)
```bash
cd docker/micro
./start.sh
# or 
# docker-compose up
```

#### Running as mixed (coherent services on the same node with NATS & Traefik)
```bash
cd docker/mixed
./start.sh
# or 
# docker-compose up
```

### Development

```bash
npm run dev
```


# License
This repo is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2016-2017 Ice Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)