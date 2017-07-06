#!/bin/sh

docker-compose up -d
docker-compose scale group1=2
docker-compose logs -f
