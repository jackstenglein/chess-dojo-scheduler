.PHONY: build clean deploy gomodgen

build: gomodgen
	export GO111MODULE=on

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/create user/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/set user/set/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/get user/get/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/set availability/set/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/book availability/book/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/delete availability/delete/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/availability/get availability/get/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/meeting/get meeting/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/meeting/list meeting/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/meeting/cancel meeting/cancel/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/user/list admin/user/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/availability/list admin/availability/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/meeting/list admin/meeting/list/main.go

clean:
	rm -rf ./bin ./vendor go.sum

deploy: clean build
	sls deploy --verbose

gomodgen:
	chmod u+x gomod.sh
	./gomod.sh
