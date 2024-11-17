## Round Robin Register API

this is the backend of Round robins, it uses API gateway, AWS lambda, Java 21 and maven

## Build

- `mvn clean`
- `mvn package`
- `cd target`
- deploy RoundRobinWithdrawAPI-1.0-SNAPSHOT.jar to lambda
- set lambda Handler to `Handler.App::handleRequest`