#!/bin/bash
stage=dev AWS_SDK_LOAD_CONFIG=true IS_TEST=true go test -coverprofile cover.out "$@"
