#!/usr/bin/env bash

find . -name node_modules -prune -o -name .next -prune -o -name package.json -exec sh -c 'cd $(dirname {}); npm audit fix' \;
