#!/bin/sh

docker-compose -f dc.micro.yml stop
docker-compose -f dc.micro.yml rm
