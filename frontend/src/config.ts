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
        userPoolId: 'us-east-1_0revSxCzf',
        userPoolWebClientId: '1dfi5rar7a2fr5samugigrmise',
        oauth: {
            domain: 'user-pool-domain-prod-chess-dojo-scheduler.auth.us-east-1.amazoncognito.com',
            scope: ['profile', 'email', 'openid'],
            redirectSignIn: 'https://www.chess-dojo-scheduler.com',
            redirectSignOut: 'https://www.chess-dojo-scheduler.com',
            responseType: 'code',
        },
    },
    api: {
        baseUrl: 'https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com',
    },
};
