.PHONY: build clean deploy gomodgen

build: gomodgen
	export GO111MODULE=on
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/create user/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/set user/set/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/get user/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/set availability/set/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/book availability/book/main.go

clean:
	rm -rf ./bin ./vendor go.sum

deploy: clean build
	sls deploy --verbose

gomodgen:
	chmod u+x gomod.sh
	./gomod.sh
