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
    media: {
        picturesBucket: string;
    };
    stripe: {
        publishableKey: string;
    };
}

enum ConfigName {
    Test = 'test',
    Development = 'development',
    Beta = 'beta',
    Prod = 'production',
}

const config: Record<ConfigName, Config> = {
    test: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_apywr6kwu',
            userPoolWebClientId: '76en8knncv8bfpfgbheua6j6k',
            oauth: {
                domain: 'authdev.chessdojo.club',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'http://localhost:3000',
                redirectSignOut: 'http://localhost:3000',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
        },
        media: {
            picturesBucket: 'https://chess-dojo-dev-pictures.s3.amazonaws.com',
        },
        stripe: {
            publishableKey:
                'pk_test_51OB6imGilmvijaecMJqdvLJdu89BcghnjU7eOIoCwlBl8DeV6i2XojJOaZ36lamZMuVjO7aorXtl90OcdtAstFfF0022uf0sdp',
        },
    },

    development: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_apywr6kwu',
            userPoolWebClientId: '76en8knncv8bfpfgbheua6j6k',
            oauth: {
                domain: 'authdev.chessdojo.club',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'http://localhost:3000',
                redirectSignOut: 'http://localhost:3000',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
        },
        media: {
            picturesBucket: 'https://chess-dojo-dev-pictures.s3.amazonaws.com',
        },
        stripe: {
            publishableKey:
                'pk_test_51OB6imGilmvijaecMJqdvLJdu89BcghnjU7eOIoCwlBl8DeV6i2XojJOaZ36lamZMuVjO7aorXtl90OcdtAstFfF0022uf0sdp',
        },
    },

    beta: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_0revSxCzf',
            userPoolWebClientId: '1dfi5rar7a2fr5samugigrmise',
            oauth: {
                domain: 'auth.chessdojo.club',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'https://beta.chessdojo.club',
                redirectSignOut: 'https://beta.chessdojo.club',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com',
        },
        media: {
            picturesBucket: 'https://chess-dojo-prod-pictures.s3.amazonaws.com',
        },
        stripe: {
            publishableKey:
                'pk_live_51OB6imGilmvijaecicnOhS1rqgX6VofcmTgi4n3TdhYoPgutx4W8HnUch6iQE7GL62fngez6mL471YWiZSrUhbJI007MlHx5CM',
        },
    },

    production: {
        auth: {
            region: 'us-east-1',
            userPoolId: 'us-east-1_0revSxCzf',
            userPoolWebClientId: '1dfi5rar7a2fr5samugigrmise',
            oauth: {
                domain: 'auth.chessdojo.club',
                scope: ['profile', 'email', 'openid'],
                redirectSignIn: 'https://www.chessdojo.club',
                redirectSignOut: 'https://www.chessdojo.club',
                responseType: 'code',
            },
        },
        api: {
            baseUrl: 'https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com',
        },
        media: {
            picturesBucket: 'https://chess-dojo-prod-pictures.s3.amazonaws.com',
        },
        stripe: {
            publishableKey:
                'pk_live_51OB6imGilmvijaecicnOhS1rqgX6VofcmTgi4n3TdhYoPgutx4W8HnUch6iQE7GL62fngez6mL471YWiZSrUhbJI007MlHx5CM',
        },
    },
};

export function getConfig(): Config {
    const envOverride = process.env.NEXT_PUBLIC_BUILD_NODE_ENV;
    let env: ConfigName = process.env.NODE_ENV as ConfigName;
    if (envOverride && Object.values(ConfigName).includes(envOverride as ConfigName)) {
        env = envOverride as ConfigName;
    }
    return config[env];
}
