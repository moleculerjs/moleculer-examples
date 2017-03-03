#!/bin/sh

docker-compose -p blog up -d
docker-compose scale users=2
docker-compose logs -f
