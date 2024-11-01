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
        roundRobin: string;
    };
    media: {
        picturesBucket: string;
    };

}

const config: Record<string, Config> = {
    test: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_apywr6kwu',
            userPoolWebClientId: '76en8knncv8bfpfgbheua6j6k',
            oauth: {
                domain: 'user-pool-domain-dev-chess-dojo-scheduler.auth.us-east-1.amazoncognito.com',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'exp://192.168.86.185:8081/--/',
                redirectSignOut: 'exp://192.168.86.185:8081/--/',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
            roundRobin: "https://vmqy3k7nj8.execute-api.us-east-1.amazonaws.com",
        },
        media: {
            picturesBucket: 'https://chess-dojo-dev-pictures.s3.amazonaws.com',
        },

    },

    development: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_apywr6kwu',
            userPoolWebClientId: '76en8knncv8bfpfgbheua6j6k',
            oauth: {
                domain: 'user-pool-domain-dev-chess-dojo-scheduler.auth.us-east-1.amazoncognito.com',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'exp://192.168.86.185:8081/--/',
                redirectSignOut: 'exp://192.168.86.185:8081/--/',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
            roundRobin: "https://vmqy3k7nj8.execute-api.us-east-1.amazonaws.com",
        },
        media: {
            picturesBucket: 'https://chess-dojo-dev-pictures.s3.amazonaws.com',
        },

    },

    production: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_0revSxCzf',
            userPoolWebClientId: '1dfi5rar7a2fr5samugigrmise',
            oauth: {
                domain: 'user-pool-domain-prod-chess-dojo-scheduler.auth.us-east-1.amazoncognito.com',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'https://www.dojoscoreboard.com',
                redirectSignOut: 'https://www.dojoscoreboard.com',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com',
            roundRobin: "https://vmqy3k7nj8.execute-api.us-east-1.amazonaws.com",
        },
        media: {
            picturesBucket: 'https://chess-dojo-prod-pictures.s3.amazonaws.com',
        },
    },
};

export function getConfig(): Config {
    return config[process.env.NODE_ENV];
}
