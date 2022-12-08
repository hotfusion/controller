import {utils} from "./classes/utils";
const { VueLoaderPlugin } = require("vue-loader");

const path = require('path'), TerserPlugin = require('terser-webpack-plugin'), webpack = require('webpack'), fs = require('fs'), htmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const resolves = [
    'node_modules',
    path.resolve(__dirname, '../node_modules'),
    path.resolve(__dirname, './node_modules')
];

export const Webpack = function(_config:{cwd:string,entry:string,output:string,plugins:Function, rules:Function,alias: Function, watch:Function}){
    let filename = 'HF_' + utils.$objectId() + '.js';
    if(_config.cwd)
        resolves.push(_config.cwd);

    let config   =  {
        mode     : "development",
        entry    : _config.entry,//.replace('.ts','.js'),
        target   : ['web','es5'],
        cache    : false,
        output   : {
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
            alias : {...(_config?.alias?.() || _config?.alias || {}),
                "HF" : path.resolve(__dirname,'./browser.js'),
                "@hotfusion/micro" : __dirname
            },

            modules    : resolves,
            extensions : ['.ts','.css','.js','*','.vue', '.json'],//,'*','.vue', '.json'
            //plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(_config.cwd,"../tsconfig.json")  })]
        },
        plugins : [
            ...(_config?.plugins?.() || []),
            new webpack.NormalModuleReplacementPlugin(
                /@hotfusion\/micro/,
                __dirname + '/browser.js'
            ),
        ],
        module  : {
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
                        transpileOnly           : true,
                        compilerOptions         : {
                            "noEmitOnError": true
                        }
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
        return compiler.watch({}, (err, stats) => {

            let filePath     = path.resolve(__dirname,`./_.cache/${filename}`);
            let lastModified = fs.statSync(filePath).mtimeMs;
            let content      = fs.existsSync(filePath)?fs.readFileSync(filePath).toString():`File was not found:${filename}`;

            try{
                fs.unlinkSync(filePath);
            }catch (e) {
            }
            // deal with errors
            if (err || stats.hasErrors())
                Exception(stats,err,filePath);
            else {

                _config?.watch?.({
                    entry        : _config.entry,
                    content      : content,
                    lastModified : lastModified,
                    stats        : stats
                })
            }
        });

    return new Promise((x,f) => {
        compiler.run((err, stats) => {
            let filePath = path.resolve(__dirname,`./_.cache/${filename}`);
            // deal with errors
            if (err || stats.hasErrors()) {
                console.log('error')
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
                    lastModified : lastModified,
                    stats        : stats
                });
            }
        });
    })
}