const path = require('path'), TerserPlugin = require('terser-webpack-plugin'), webpack = require('webpack'), fs = require('fs');
const resolves = [
    path.resolve(__dirname, '../node_modules')
];

export const config = function({entry,output}){
    return {
        mode   : "development",
        entry  : entry,
        target : ['web','es5'],
        cache  : false,
        output : {
            path : output.path,
            filename: output.filename,
            library    : {
                type  : "umd",
                name  : "HF"
            }
        },
        optimization   : {
            minimizer  : [new TerserPlugin({ extractComments: false })],
        },
        resolveLoader  : {
            modules    : resolves
        },
        resolve: {
            modules    : resolves,
            extensions : ['.ts','.css','.js']
        },
        module : {
            rules: [{
                test   : /\.js$/,
                use    : {
                    loader : 'babel-loader',
                    options: {
                        compact: true
                    }
                }
            }, {
                test   : /\.css$/,
                use    : ['style-loader','css-loader']
            },{
                test   : /\.less$/i,
                use    : ["style-loader", "css-loader", "less-loader"]
            },{
                test   : /\.ts$/,
                use    : [{
                    loader : 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true,
                        allowTsInNodeModules : true
                    }
                }]
            }]
        }
    }
}