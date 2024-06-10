/* eslint-env node */
module.exports = {
        extends: [
                'plugin:react/jsx-runtime',
                'plugin:react-hooks/recommended',
                'plugin:react/recommended',
        ],
        rules: {
                'react/react-in-jsx-scope': 'off',
                'react/jsx-uses-react': 'off',
                // While using React.FC, this will give false positives
                'react/prop-types': 'off',
                // React is now imported by default
                'jsx-uses-react': 'off',
                'react/no-unescaped-entities': 'off',
        },
};
