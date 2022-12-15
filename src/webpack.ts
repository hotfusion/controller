import {utils} from "./classes/utils";
const chalk = require('chalk')
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const { VueLoaderPlugin } = require("vue-loader");
const path = require('path'), TerserPlugin = require('terser-webpack-plugin'), webpack = require('webpack'), fs = require('fs'), htmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const resolves = [
    path.resolve(__dirname, '../node_modules')
];

export const Webpack = function(_config:{cwd:string,entry:string,output:string,plugins:Function, rules:Function,alias: Function, watch:Function}){
    let filename = 'HF_' + utils.$objectId() + '.js';
    if(_config.cwd)
        resolves.push(
            path.resolve(_config.cwd,'./node_modules')
        );

    let config    =  {
         entry    : {
             default : _config.entry,
             tools   : path.resolve(__dirname,'./tools/index.js')
         },
         mode     : "development",
         target   : ['web','es5'],
         cache    : false,
         output   : {
             path              : __dirname + '/_.cache',
             filename          : '[name].[fullhash:8].js',
             sourceMapFilename : '[name].[fullhash:8].map',
             chunkFilename     : '[id].[fullhash:8].js',
             library  : {
                 type : "umd",
                 name : "HF"
             }
        },
         resolve  : {
            alias      : {...(_config?.alias?.() || _config?.alias || {}),
                "HF" : path.resolve(__dirname,'./browser.js'),
                "@hotfusion/micro" : __dirname
            },
            modules    : resolves,
            extensions : ['.ts','.css','.js','.vue', '.json']
        },
         plugins  : [
            ...(_config?.plugins?.() || []),
            new webpack.NormalModuleReplacementPlugin(
                /@hotfusion\/micro/,
                __dirname + '/browser.js'
            )
        ],
         module   : {
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
        },
         optimization  : {
            minimizer  : [new TerserPlugin({ extractComments: false })],
        },
         resolveLoader : {
            modules    : resolves
        }
    };
    let exception = (stats,err) => {
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
    };

    let compiler  = webpack(config);
    if(_config?.watch)
        return new Promise((x,f) => {
            let changedFiles
            compiler.hooks.watchRun.tap('WatchRun', (comp) => {
                if (comp.modifiedFiles)
                    changedFiles = Array.from(comp.modifiedFiles, (file) => file)
            });
            compiler.watch({}, (err, stats) => {
                // deal with errors
                if (err || stats.hasErrors()) {
                    return <any>exception(stats, err) || x(true)
                }

                let filename     = Object.keys(stats.compilation.assets).filter(x => x.startsWith('default.')).shift()
                let filePath     = path.resolve(__dirname,`./_.cache/${filename}`);
                let lastModified = fs.statSync(filePath).mtimeMs;
                let content      = Object.keys(stats.compilation.assets).map(filename => {
                    return fs.readFileSync(path.resolve(__dirname,`./_.cache/${filename}`)).toString()
                }).join('\n');

                if(compiler.__init) {
                    let bar = (<any>console).progress({
                        scope : chalk.bold(filename)
                    });
                    bar.start(100, 0);
                    new ProgressPlugin({
                        profile: true,
                        handler(percentage){
                            if(!bar._init){
                                console.clear();
                                bar._init = true;
                                bar.start(100, 0);
                            }
                            bar.update(percentage*100);
                            if((Math.round(percentage*100) === 100)){
                                setTimeout(() => {
                                    console.clear();
                                    _config?.watch?.({
                                        entry        : _config.entry,
                                        content      : content,
                                        lastModified : lastModified,
                                        stats        : stats
                                    });

                                    console.info(`Files were updated by webpack:`);

                                    changedFiles.forEach(x => {
                                        if(fs.existsSync(x)) {
                                            console.info(`[${chalk.cyan(utils.$convertBytes(fs.statSync(x).size))}] ${chalk.green(x)}`)
                                        }
                                    })

                                },1000)
                                bar.stop();
                                bar._init = false;
                            }
                        }
                    }).apply(compiler);
                }

                x(true);
                compiler.__init = true;
            });
        })

    return new Promise((x,f) => {
        compiler.run((err, stats) => {
            filename = Object.keys(stats.compilation.assets).filter(x => x.startsWith('default.')).shift()
            let filePath     = path.resolve(__dirname,`./_.cache/${filename}`);
            let lastModified = fs.statSync(filePath)?.mtimeMs;
            let content      = fs.readFileSync(filePath)?.toString?.() || `File was not found:${filename}`;

            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error(e.message)
            }

            // deal with errors
            if (err || stats.hasErrors()) {
                exception(stats,err)
                return f({'Webpack Exception' : 'thrown an error by webpack!'})
            }

            return x({
                entry        : _config.entry,
                content      : content,
                lastModified : lastModified,
                stats        : stats
            });

        });
    })
}