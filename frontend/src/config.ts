export interface Config {
    auth: {
        region: 'us-east-1';
        userPoolId: string;
        userPoolWebClientId: string;
        oauth: {
            domain: string;
            scope: string[];
            redirectSignIn: string;
            redirectSignOut: string;
            responseType: 'code';
        };
    };
    api: {
        baseUrl: string;
    };
}

export const config: Config = {
    auth: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_apywr6kwu',
        userPoolWebClientId: '76en8knncv8bfpfgbheua6j6k',
        oauth: {
            domain: 'user-pool-domain-dev-chess-dojo-scheduler.auth.us-east-1.amazoncognito.com',
            scope: ['profile', 'email', 'openid'],
            redirectSignIn: 'http://localhost:3000',
            redirectSignOut: 'http://localhost:3000',
            responseType: 'code',
        },
    },
    api: {
        baseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
    },
};
