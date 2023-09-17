# User Login

This document describes the user login set up, as well as some common errors and how to fix them.

## How it Works

### Cognito

We are using AWS Cognito to manage user accounts. The Cognito user pool, client, domain and Google identity provider are all defined in `backend/serverless.yml`. The Google OAuth client id and secret are manually created in the GCP console. The Cognito token is used as a service authorizer in most of the API functions, thereby limiting access to the API to signed-in users.

### DynamoDB

While the user sign-in information is stored in Cognito, the user profile information specific to our site is stored in DynamoDB. The Cognito username is used as the hash key to the DynamoDB table. This means that if you find a user based on their email in Cognito, you can quickly find their matching record in DynamoDB by running a search on their Cognito username.

### Lambda

There are two Lambda functions triggered by Cognito events: `linkProvider` and `createUser`.

`linkProvider` is triggered on `PreSignUp` events. This function links an external provider (currently only Google) to an existing Cognito account. For example, imagine someone initially signs up with an email and password. Later on, they return to the site and try to login with Google, using the same email they used previously. The `linkProvider` function will detect that the email is already in use with a native Cognito account and will link the external provider to that account. Without the `linkProvider` function, Cognito would treat these two sessions as separate users, and the user would have two accounts on the scoreboard. Even worse, their initial account would have its email marked as unverified, so they would not be able to reset the password on that account. Unfortunately, due to Cognito limitations, linking providers only goes one way. If a user first signs in with Google, they will not be able to create a native Cognito account with the same email. They must continue using the sign in with Google.

`createUser` is triggered on `PostConfirmation` events. This function gets called when a new user first completes their Cognito sign up. This function is responsible for creating a DynamoDB record with the matching Cognito username.

## Common Errors

Usually these errors will occur with people that had accounts when the scoreboard was originally just the scheduler. Back then, the `linkProvider` function didn't exist, so there are some accounts that are in the problematic state described above.

### User has Multiple Cognito Accounts

Often when a user is having trouble logging in, it is because they have multiple Cognito accounts associated with the same email address. To check this, log into AWS and go to the Cognito user pool. Change the search field dropdown to email and search for their email address. If multiple accounts appear in the list, the next step is to see which of them have associated DynamoDB accounts. To do this, open AWS in a new tab and go to DynamoDB. Go to the `prod-users` table and search for the usernames of each of the Cognito accounts.

Any Cognito accounts that do not have associated DynamoDB accounts can be safely deleted. However, be absolutely sure that you copied the Cognito username correctly before deleting the Cognito account.

After doing this, you will arrive at some subset of Cognito accounts that _do_ have associated Dynamo accounts. If there is only one such Cognito account, make sure the email is marked as verified within Cognito, and you should be done.

If there is still more than one Cognito account, then the user likely has a native Cognito account and an unlinked Google account. In this case, you will need to ask the user which account they would like to keep and delete the other. Make sure to delete the associated DynamoDB account as well. Whichever account is kept, make sure to mark the email as verified within Cognito.

You can tell which accounts are Google as the usernames within Cognito start with `google_`.

When the user has only one (or in rare cases zero) Cognito accounts left, ask them to try signing in again.
