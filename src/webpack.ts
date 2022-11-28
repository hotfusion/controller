import {utils} from "./classes/utils";

const path = require('path'), TerserPlugin = require('terser-webpack-plugin'), webpack = require('webpack'), fs = require('fs');
const resolves = [
    path.resolve(__dirname, '../node_modules')
];

export const Webpack = function({entry,output}){
    let filename = utils.$objectId() + '.js';
    let config =  {
        mode   : "development",
        entry  : entry,
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
                    loader : 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true,
                        allowTsInNodeModules : true
                    }
                }]
            }]
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
                    entry        : entry,
                    content      : content,
                    lastModified : lastModified
                });
            }
        })
    })
}