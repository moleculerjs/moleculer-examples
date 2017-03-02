#!/bin/sh

docker-compose -f dc.micro.yml up -d
docker-compose -f dc.micro.yml scale users=2
docker-compose -f dc.micro.yml logs -f
