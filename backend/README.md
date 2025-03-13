# Backend

## Overview

The backend is written in Golang/TypeScript and deployed to AWS using the [Serverless framework](https://www.serverless.com/). The API handlers are deployed to AWS
Lambda and are available through API Gateway. The backend uses DynamoDB as a database, and AWS Cognito in order to handle user sign-in. Each API handler is packaged into its own binary. This keeps the binary size smaller, which reduces the Lambda cold-start time when the API is called.

## Deploying

Deploying the entire backend can be quite complex. There are many resources, and some of them (such as Google SSO, AWS Secrets or Stripe Webhooks) have to be configured manually in their respective consoles. If you are working only on the frontend, consider using the existing and already deployed `dev` backend environment instead. If you do need to make backend changes. You can start by deploying the `simple` backend stage. This stage skips some resources and functions and deploys only the core functionality of the site. On the `simple` stage, you will not be able to login with Google or complete payment on Stripe. To deploy the `simple` stage, take the following steps:

1. Install dependencies: 

```
cd backend
npm install
serverless plugin install -n serverless-esbuild
```

1. Create the `backend/oauth.yml` file with the following contents:

```
client_id: ''
client_secret: ''
```

1. Create the `backend/discord.yml` file with the following contents:

```
discordAuth: ''
```

1. Create the `backend/tournament.yml` file with the following contents:

```
mongoConnectionString: ''
botAccessToken: ''
```

1. Create the `backend/wix.yml` file with the following contents:

```
wixApiKey: ''
```

1. Run `sls deploy --stage simple`.

## Important Files/Directories

### serverless.yml

This file contains all the API endpoints and the other AWS resources. These resources are deployed through CloudFormation using the `sls deploy` command.

### api

This directory contains some functionality related to logging, errors and API Gateway. This functionality is common to all API handlers.

### database

This directory contains two files: `model.go` and `repository.go`. `model.go` contains the type definitions for the database objects, while `repository.go` contains the code for creating, updating and fetching these objects in DynamoDB.

### availability

This directory contains the API handlers for endpoints related to `Availability` objects. Lambda requires that the handler function be in the `main` package, so each handler is located in its own subdirectory. There are handlers for setting, getting, deleting and booking availabilities.

### meeting

Once an availability is booked, it is converted to a `Meeting` object. The `meeting` directory contains the API handlers for endpoints related to `Meeting` objects. There are two handlers: one for getting a single meeting and one for getting a list of meetings.

### user

This directory contains the API handlers for endpoints related to `User` objects. There are handlers for creating, setting and getting a user. The create handler is special, as it is the only handler not available through API Gateway. Instead, the create handler is invoked by the Cognito PostConfirmation event (i.e., when a user completes sign up).

## Database Format

There are currently three database tables: the UsersTable, AvailabilitiesTable and MeetingsTable. The tables are currently stored in DynamoDB.

### UsersTable

This table schema uses only a partition key on the user's Cognito username. This schema allows us to fetch and update the user by their Cognito username.

### AvailabilitiesTable

This table schema has a partition key on the creator's Cognito username and a sort key on the availability's `id` attribute. The `id` is a v4 UUID set by the API. This schema allows us to find all availabilities owned by a given user, update availabilities by user and id, and delete availabilities by user and id.

Additionally, there is a GSI with a partition key on the availability's `status` and a sort key on the availability's `startTime`. Currently, all availabilities have a status of `SCHEDULED`. This GSI schema allows us to search for availabilities based on their start and end times.

### MeetingsTable

This table schema uses only a partition key on the meeting's `id` attribute. The `id` is a v4 UUID set by the API. This schema allows us to fetch a single meeting object by its id.

Additionally, the table has two GSIs. One GSI has a partition key on the `owner` attribute and a sort key on the `id` attribute. The other GSI has a partition key on the `participant` attribute and a sort key on the `id` attribute. These two GSIs allow us to search for meetings by username. Unfortunately, when given a username, we cannot know ahead of time whether the username will be in the `owner` or `participant` attribute, so we must perform a query on both GSIs.
