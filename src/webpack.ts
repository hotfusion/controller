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

export const Webpack = function(_config:{entry:string,output:string,plugins:Function, rules:Function,alias: Function, watch:Function}){
    let filename = 'HF_' + utils.$objectId() + '.js';
    let config =  {
        mode   : "development",
        entry  : _config.entry,
        target : ['web','es5'],
        cache  : false,
        output : {
            path : __dirname + '/_.cache',
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
            alias : _config?.alias?.() || _config?.alias || {},
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
                        compact : true,
                        plugins:  [
                            ["@babel/plugin-proposal-decorators", {"legacy": true}],
                            ["@babel/plugin-proposal-class-properties", { "loose": true }]
                        ]
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
    let Exception = (stats,err,filePath) => {
        console.log(`webpack config: ${config}`)
        if (err) {
            console.error(err.stack || err);
            if (err.details)
                return console.error(err.details);
            return console.error({'unknown' : 'undefined error'});
        }

        const info = stats.toJson();
        if (stats.hasErrors())
            return console.error(info.errors);

        if (stats.hasWarnings())
            console.warn(info.warnings);

        return console.error({'unknown' : 'undefined error'});

    }
    let compiler = webpack(config);
    if(_config?.watch)
        return  compiler.watch({}, (err, stats) => {
            let filePath = path.resolve(__dirname,`./_.cache/${filename}`);

            // deal with errors
            if (err || stats.hasErrors()) {
                Exception(stats,err,filePath)
                try{
                    fs.unlinkSync(filePath);
                }catch (e) {
                    console.error(e.message)
                }
            }else {
                let lastModified = fs.statSync(filePath).mtimeMs;
                let content = fs.readFileSync(filePath).toString();
                try{
                    fs.unlinkSync(filePath);
                }catch (e) {
                    console.error(e.message)
                }
                _config?.watch?.({
                    entry        : _config.entry,
                    content      : content,
                    lastModified : lastModified
                })
            }
        });

    return new Promise((x,f) => {
        compiler.run((err, stats) => {
            let filePath = path.resolve(__dirname,`./_.cache/${filename}`);

            // deal with errors
            if (err || stats.hasErrors()) {
                Exception(stats,err,filePath)
                try{
                    fs.unlinkSync(filePath);
                }catch (e) {
                    console.error(e.message)
                }
                f({'Webpack Exception' : 'thrown an error by webpack!'})
            }else {
                let lastModified = fs.statSync(filePath).mtimeMs;
                let content = fs.readFileSync(filePath).toString();
                try{
                    fs.unlinkSync(filePath);
                }catch (e) {
                    console.error(e.message)
                }

                x({
                    entry        : _config.entry,
                    content      : content,
                    lastModified : lastModified
                });
            }
        })
    })
}