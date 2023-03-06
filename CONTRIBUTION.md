## Thank you!

First things first, projects like this are made possible by people like you THANK YOU!! See something you can fix? Here's how to get started.

### Frontend Development

Inside `frontend/`:

-   `npm i` => install dependencies
-   `NODE_ENV="development" npm start` => will start the development environment on localhost:3000 by default
-   If you plan to also do backend development, you will want to pay close attention to the values in `frontend/src/config.ts` as you will need to make modifications to some of the values.

### Backend Development

Inside `backend/`:

-   `npm install serverless`
-   You will need to make a few adjustments and file additions to bootstrap yourself for the serverless deployment.
-   `aws configure` => provide us-east-1 for region and your AWS Access Key ID and AWS Secret Access Key (charges are ~$1/month):
-   `touch oauth.yml` => You will likely need to setup Oauth to do any User object development, but you can also create an account directly in dynamodb once you've deployed the stack, and login without Google Oauth. Inside oauth.yml (if you are going the oauth configuration route) you will need to provide the Oauth 2.0 Client ID and Secret that you've obtained from creating a [Google Cloud Project](https://console.cloud.google.com/apis/credentials).

```oauth.yml
client_id: [redacted].apps.googleusercontent.com
client_secret: [redacted]
```

-   Inside your Google Application -> Credentials -> Client ID for Web Application, provide the following values for Authorized JavaScript Origins and Authorized Redirect URIs:
    `https://user-pool-domain-dev-chess-dojo-scheduler2.auth.us-east-1.amazoncognito.com`
    `https://user-pool-domain-dev-chess-dojo-scheduler2.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
    **NOTE** You NEED to update the first part of the URL in each of these to match what you will define in serverless.yml: UserPoolDomain.Properties.Domain ... MUST be unique. So you won't be able to use 'scheduler2' like I have.
-   ctrl-f for 'discord' and comment the block which asks for Discord credentials, unless you are developing that part of the code you can safely comment this without impact to the core functionality.
-   `sls deploy` will attempt to deploy the stack defined in serverless.yml
-   serverless will give a list of services that have been deployed upon success. You will need to edit `frontend/src/config.ts` with the base execution URLs that serverless is providing you. e.g. my development block looks like this:

```
    development: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_HeVKzpLvc',
            userPoolWebClientId: '6c3abols25e[redacted]',
            oauth: {
                domain: 'user-pool-domain-dev-chess-dojo-scheduler2.auth.us-east-1.amazoncognito.com',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'http://localhost:3000',
                redirectSignOut: 'http://localhost:3000',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://qzcsz73dv5.execute-api.us-east-1.amazonaws.com',
        },
    },
```

-   Made some changes to the backend? Update the `Makefile` in `backend/` and compile with `make`. `sls deploy` will update the backend with the new function updates.
-   A quick validation test, after grabbing your google_userid out of DynamoDB you can run `sls invoke -f getUser -d '{"pathParameters":{"username":"google_youruseridhere"}}'` to test the getUser functions deployment.
