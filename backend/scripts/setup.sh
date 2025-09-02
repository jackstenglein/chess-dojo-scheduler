#!/usr/bin/env bash

set -e

cp -n discord.yml.example discord.yml
cp -n oauth.yml.example oauth.yml
cp -n tournament.yml.example tournament.yml
cp -n wix.yml.example wix.yml

find . -maxdepth 2 -mindepth 2 -name serverless.yml  |  xargs grep serverless-esbuild | cut -f1 -d: | sort -u | while read file; do
    cd $(dirname $file)
    serverless plugin install -n serverless-esbuild
    cd -
done
