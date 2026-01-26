const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

function getUniqueIdentifier() {
    if (IS_DEV) {
        return 'club.chessdojo.chessdojo.dev';
    }
    if (IS_PREVIEW) {
        return 'club.chessdojo.chessdojo.preview';
    }
    return 'club.chessdojo.chessdojo';
}

function getAppName() {
    if (IS_DEV) {
        return 'ChessDojo (Dev)';
    }
    if (IS_PREVIEW) {
        return 'ChessDojo (Preview)';
    }
    return 'ChessDojo';
}

export default ({ config }) => ({
    ...config,
    name: getAppName(),
    ios: {
        ...config.ios,
        bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
        ...config.android,
        package: getUniqueIdentifier(),
    },
});
