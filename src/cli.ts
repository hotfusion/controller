#!/usr/bin/env node
import {Controller, Transformer, Session, utils, Host} from "./index";
import {Webpack}   from "./webpack";
//import {Analytics} from "./middlewares/analytics";
import {resolve}   from "path";
import {Console} from "./classes/console";
new Console(true);
import {VueLoaderPlugin} from 'vue-loader';
import * as keypress from 'keypress';
const inquirer = require('inquirer');
const argv = require('minimist')(
    process.argv.slice(2)
);

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {

    if (key && key.ctrl && key.name == 'x') {
        process.stdout.write('\x1Bc');
    }

    if (key && key.ctrl && key.name == 'c') {
        //process.stdin.pause();
        inquirer
            .prompt(<any>[{
                    name    : "shutdown",
                    type    : "list",
                    message : "Are you sure you want to shutdown current service?",
                    choices : ["Yes", "No"]
            }]).then((answer) => {
                if(answer.shutdown === 'Yes') {
                    console.clear();
                    console.info('Bye Bye!')
                    process.exit()
                }
            })
    }
});

// define cwd
if(argv.public?.startsWith('./'))
    argv.public =  resolve(process.cwd(),argv.public)

if(argv.public?.startsWith('/'))
    argv.public =  resolve(process.cwd(),'.' + argv.public)

if(argv.services?.startsWith('./'))
    argv.services =  resolve(process.cwd(),argv.services)

console.log(argv.services)
const cwd = argv.public || process.cwd();
// controller
const controller     = new Controller({
    source : resolve(argv.services || cwd, './**/*.controller.ts')
});

// default transformer
const transformer = new Transformer({
    source    : resolve(cwd,'./**/*.script.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
                cwd   : process.cwd(),
                entry : File.path,
                watch : argv.watch ? ({content,stats}) => { //stats.compiler.models
                    let modules = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    //console.log(Array.from(stats.compilation.modules.values()))
                    // console.info('View file was updated:',modules[0])
                    File.content = content
                } : false
            })).content;
        }catch (e) {
            console.error(e);
        }
        return File;
    }
});

// vue transformer
const VueTransformer = new Transformer({
    source    : resolve(cwd,'./**/*.vue.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
                cwd     : process.cwd(),
                entry   : File.path,
                plugins : () => {
                    return [
                        new VueLoaderPlugin()
                    ]
                },
                rules   : () => {
                    return [{
                        test   : /\.vue$/,
                        loader : 'vue-loader',
                        exclude: /node_modules/
                    }];
                },
                alias   : () => {
                    return {
                        '@' : cwd
                    }
                },
                watch   : argv.watch ? ({content, stats}) => {
                    let modules  = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    let filename = modules.slice(0,modules.findIndex(x => x === 'exportHelper.js'))[0];
                    File.content = content;

                } : false
            })).content;
        }catch (e) {
            console.error(e);
        }
        return File;
    }
})
//let analytics = new Analytics();

let host = new Host();
host.use(controller.use)
    //.use(analytics.use)
    .use(new Session().use)
    .use(VueTransformer.use)
    .use(transformer.use)
    .use((socket,next) => {
        next();
    });

const bar = (<any>console).progress({
    scope : 'middlewares'
});

host.on('install.started', (middlewares) => {
    bar.start(middlewares.length, 0)
});
host.on('install.mounting', (middleware) => {
    //console.error(middleware);
});
host.on('install.mounted', ({index,module}) => {
    bar.update(index + 1,{
        filename : ''
    });
});
host.on('install.completed', (stats) => {
    bar.stop()
});

host.on('client', ({connect,exception}) => {
    connect({});
});

host.on('exception', (exception) => {
    console.error(exception);
});

host.use('/', cwd);
host.start(argv?.port || 8080, argv.ip);
