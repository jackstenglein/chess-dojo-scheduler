.PHONY: build clean deploy gomodgen

build: gomodgen
	export GO111MODULE=on

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/access/check user/access/check/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/create user/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/provider/link user/provider/link/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/update user/update/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/get user/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/graduate user/graduate/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/list user/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/progress/update user/progress/update/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/progress/timeline user/progress/timeline/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/ratings/update user/ratings/update/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/statistics/get user/statistics/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/statistics/update user/statistics/update/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/user/timeline/list user/timeline/list/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/book event/book/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/cancel event/cancel/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/delete event/delete/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/get event/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/list event/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/event/set event/set/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/user/list admin/user/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/requirement/list admin/requirement/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/admin/statistics/get admin/statistics/get/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/create game/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/get game/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/list/cohort game/list/cohort/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/list/featured game/list/featured/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/list/owner game/list/owner/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/comment/create game/comment/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/update game/update/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/delete game/delete/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/game/statistics/update game/statistics/update/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/graduation/list graduation/list/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/requirement/get requirement/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/requirement/list requirement/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/requirement/set requirement/set/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/opening/get opening/get/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/opening/list opening/list/main.go

	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/tournament/create tournament/create/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/tournament/list tournament/list/main.go
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o bin/tournament/leaderboard/update tournament/leaderboard/update/main.go

clean:
	rm -rf ./bin ./vendor go.sum

deploy: clean build
	sls deploy --verbose

gomodgen:
	chmod u+x gomod.sh
	./gomod.sh
