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
             default : _config.entry
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
    let watch     = () => {
        let changedFiles = []
        compiler.hooks.watchRun.tap('WatchRun', (comp) => {
            if(!compiler.__init || !comp.modifiedFiles) return;
                console.clear();
                changedFiles = Array.from(comp.modifiedFiles, (file) => file)
        });

        let bar = (<any>console).progress({
            scope : chalk.bold(filename)
        });
        compiler.watch({}, (err, stats) => {
            // deal with errors
            if (err || stats.hasErrors()) {
                return <any>exception(stats, err)
            }

            let filename     = Object.keys(stats.compilation.assets).filter(x => x.startsWith('default.')).shift()
            let filePath     = path.resolve(__dirname,`./_.cache/${filename}`);
            let lastModified = fs.statSync(filePath).mtimeMs;
            let content      = Object.keys(stats.compilation.assets).map(filename => {
                return fs.readFileSync(path.resolve(__dirname,`./_.cache/${filename}`)).toString()
            }).join('\n');


            if(compiler.__init) {
                if(!compiler.bar)
                    compiler.bar = new ProgressPlugin({
                        profile: true,
                        async handler(percentage){
                            if(!bar._init){
                                console.clear();
                                bar._init = true;
                                bar.start(100, 0);
                            }
                            bar.update(percentage*100,{
                                filename : ''
                            });
                            if((Math.round(percentage*100) === 100)){
                                setTimeout(async () => {
                                    console.clear();
                                    _config?.watch?.({
                                        entry        : _config.entry,
                                        content      : content,
                                        lastModified : lastModified,
                                        stats        : stats
                                    });

                                    console.info(`Files were updated by webpack:`);

                                    let entry = path.resolve(__dirname,`./_.cache/${filename}`);
                                    if(!changedFiles.find(x => path.normalize(_config.entry) === x || path.normalize(_config.entry) === x.path))
                                        changedFiles.unshift({
                                            label : 'Entry',
                                            path  : path.normalize(_config.entry),
                                            size  : fs.statSync(entry).size
                                        });

                                    changedFiles.forEach(x => {
                                        if((typeof x === 'string' && fs.existsSync(x)) ||  (x.path && fs.existsSync(x.path))) {
                                            console.info(`[${chalk.cyan(utils.$convertBytes( x.size || fs.statSync(x.path || x).size))}] ${chalk.green( x.path || x)} - ${chalk.gray(x.label || 'File ')}`)
                                        }
                                    })

                                },1000)
                                bar.stop();
                                bar._init = false;
                            }
                        }
                    }).apply(compiler);

                bar.start(100, 0);
            }else {
                _config?.watch?.({
                    entry: _config.entry,
                    content: content,
                    lastModified: lastModified,
                    stats: stats
                });
            }
            compiler.__init = true;
        });
    }
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

            if(_config?.watch)
                watch();

            return x({
                entry        : _config.entry,
                content      : content,
                lastModified : lastModified,
                stats        : stats
            });

        });
    })
}