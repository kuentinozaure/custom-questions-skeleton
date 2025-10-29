const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const distDir = path.resolve(__dirname, 'dist');

module.exports = {
    entry: {
        question: './src/question.ts',
        scorer: './src/scorer.ts'
    },
    output: {
        path: distDir,
        filename: '[name].js',
        library: {
            type: 'umd'
        },
        globalObject: 'this'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            path.resolve(__dirname, 'src'),
            'node_modules'
        ]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.json'
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'question.css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'authoring_custom_layout.html',
                    to: distDir
                }
            ]
        })
    ],
    externals: {
        // Prevent bundling of certain imported packages
        // and instead retrieve these external dependencies at runtime
    },
    mode: 'development',
    devtool: 'source-map'
};
