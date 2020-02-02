# RealWorld Example App
![Conduit screenshot](../assets/screenshots/conduit-screenshot.png)

[Moleculer](http://moleculer.services/) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

This repo is functionality complete — PRs and issues welcome!

**Live demo on Glitch: https://realworld-moleculer.glitch.me**

Glitch project: https://glitch.com/edit/#!/realworld-moleculer

*[React + Redux](https://github.com/icebob/react-redux-realworld-example-app) front-end UI is included.*
*For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.*

## Getting started

### To get the Node server running locally:

- Clone this repo
- `npm install` to install all required dependencies
- `npm run dev` to start the local server
- the API is available at http://localhost:3000/api

Alternately, to quickly try out this repo in the cloud, you can

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/realworld-moleculer)

#### MongoDB persistent store
Basically the services stores data in an NeDB persistent file storage in the `./data` folder. If you have to use MongoDB, set the `MONGO_URI` environment variable.
```
MONGO_URI=mongodb://localhost/conduit
```

#### Multiple instances
You can run multiple instances of services. Moleculer uses TCP transporter to communicate all instances. No need any additional configuration, it uses UDP for discovery.

### To get the Node server running locally with Docker

1. Checkout the repo `git clone https://github.com/moleculerjs/moleculer-examples.git`
2. `cd moleculer-examples/conduit`
3. Start with docker-compose: `docker-compose up -d --build`

	It starts all services in separated containers, a Redis server for caching, a MongoDB server for database and a [Traefik](https://traefik.io/) reverse proxy. All nodes communicate via Moleculer TCP transporter.
4. Open the http://docker-ip:3000 in your browser
5. _Optional: Scale up services_

	`docker-compose up -d --scale api=3 --scale articles=2 --scale users=2 --scale comments=2 --scale follows=2 --scale favorites=2`

## Code Overview

### Dependencies

- [moleculer](https://github.com/moleculerjs/moleculer) - Microservices framework for NodeJS
- [moleculer-web](https://github.com/moleculerjs/moleculer-web) - Official API Gateway service for Moleculer
- [moleculer-db](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db#readme) - Database store service for Moleculer
- [moleculer-db-adapter-mongo](https://github.com/moleculerjs/moleculer-db/tree/master/packages/moleculer-db-adapter-mongo#readme) - Database store service for MongoDB *(optional)*
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - To generate JWTs used by authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Hashing user password
- [lodash](https://github.com/lodash/lodash) - Utility library
- [slug](https://github.com/dodo/node-slug) - To encode titles into a URL-friendly format
- [ioredis](https://github.com/luin/ioredis) - [Redis](https://redis.io) server for caching *(optional)*

### Application Structure

- `moleculer.config.js` - Moleculer ServiceBroker configuration file.
- `services/` - This folder contains the services.
- `public/` - This folder contains the front-end static files.
- `data/` - This folder contains the NeDB database files.

## Test

**Tested with [realworld-server-tester](https://github.com/agrison/realworld-server-tester).**

*Local tests is missing currently.*
```
$ npm test
```

In development with watching

```
$ npm run ci
```

## License
This project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact
Copyright (c) 2016-2020 MoleculerJS

[![@moleculerjs](https://img.shields.io/badge/github-moleculerjs-green.svg)](https://github.com/moleculerjs) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)
