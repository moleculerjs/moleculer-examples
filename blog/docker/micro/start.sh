#!/bin/sh

docker-compose up -d
docker-compose scale users=2
docker-compose scale api=2
docker-compose logs -f
