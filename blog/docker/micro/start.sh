#!/bin/sh

docker-compose up -d
docker-compose scale users=2
docker-compose scale www=2
docker-compose logs -f
