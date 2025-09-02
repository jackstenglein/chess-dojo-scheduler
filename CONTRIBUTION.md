## Thank you!

First things first, projects like this are made possible by people like you, so THANK YOU! See something you can fix? Here's how to get started.

### Frontend Development

This project uses a shared backend environment (named `dev`) for development, which your local frontend instance will connect to by default. The `dev` backend environment mirrors the production backend environment, but has its own database. You can create an account using sign in with Google or with email/password, just like you would on the real site.

To run the frontend locally, run the following commands in the `frontend/` directory:

-   `npm i` => install dependencies
-   `npm run dev` => will start the development environment on localhost:3000 by default
-   If you plan to also do backend development, you will want to create a `.env.development.local` file and override some of the values in `.env.development`.

### Backend Development

For historical reasons, our backend is deployed using V3 of the [serverless framework](https://www.serverless.com/). This is an unfortunate piece of technical debt that we hope to eventually migrate to AWS CDK. Serverless can be quite difficult to deploy because it does not handle dependencies between some types of resources correctly. When first bootstrapping everything, it sometimes requires commenting out some resources, deploying, uncommenting the resources and deploying again. To deploy your own version of the backend, follow the instructions in `backend/README.md`.
