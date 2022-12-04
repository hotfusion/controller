import {utils} from "./classes/utils";
const { VueLoaderPlugin } = require("vue-loader");
const path = require('path'),
    TerserPlugin = require('terser-webpack-plugin'),
    webpack = require('webpack'),
    fs = require('fs'),
    htmlWebpackPlugin = require("html-webpack-plugin");

const resolves = [
    path.resolve(__dirname, '../node_modules')
];

export const Webpack = function(_config:{entry:string,output:string,plugins:Function, rules:Function}){
    let filename = utils.$objectId() + '.js';
    let config =  {
        mode   : "development",
        entry  : _config.entry,
        target : ['web','es5'],
        cache  : false,
        output : {
            path : __dirname,
            filename  : filename,
            library   : {
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
        resolve : {
            /*alias : {
                vue$ : path.resolve(__dirname,"../vue/dist/vue.runtime.esm.js"),
            },*/
            modules    : resolves,
            extensions : ['.ts','.css','.js','*','.vue', '.json']
        },
        plugins: [
            ...(_config?.plugins?.() || []),
        ],
        module : {
            rules : [{
                test   : /\.js$/,
                use    : {
                    loader : 'babel-loader',
                    options: {
                        compact : true
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
                    loader  : 'ts-loader',
                    options : {
                        onlyCompileBundledFiles : true,
                        allowTsInNodeModules    : true,
                        transpileOnly           : true
                    }
                }]
            },...(_config?.rules?.() || [])]
        }
    };

    return new Promise((x,f) => {
        webpack(config,async (err:any,stats) => {
            if (err || stats.hasErrors()) {
                console.log(config)
                if (err) {
                    console.error(err.stack || err);
                    if (err.details)
                        return f(err.details);
                    return;
                }

                const info = stats.toJson();

                if (stats.hasErrors())
                    f(info.errors);

                if (stats.hasWarnings())
                    console.warn(info.warnings);

            }else {
                let filePath = path.resolve(__dirname,`./${filename}`);

                let lastModified = fs.statSync(filePath).mtimeMs;
                let content = fs.readFileSync(filePath).toString();
                    fs.unlinkSync(filePath);

                x({
                    entry        : _config.entry,
                    content      : content,
                    lastModified : lastModified
                });
            }
        })
    })
}