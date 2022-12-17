#!/usr/bin/env node
import {CDN, Controller, Transformer, Session, utils, Host} from "./index";
import {Webpack} from "./webpack";
import {Analytics} from "./middlewares/analytics";
import {resolve} from "path";
import {VueLoaderPlugin} from "vue-loader";
import * as keypress from 'keypress';

const argv = require('minimist')(
    process.argv.slice(2)
);

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
    //console.log('got "keypress"', key);
    if (key && key.ctrl && key.name == 'x') {
        process.stdout.write('\x1Bc');
    }

    if (key && key.ctrl && key.name == 'c') {
        //process.stdin.pause();
    }
});

// define cwd
if(argv.public?.startsWith('./'))
    argv.public =  resolve(process.cwd(),argv.public)

if(argv.public?.startsWith('/'))
    argv.public =  resolve(process.cwd(),'.' + argv.public)

const cwd = argv.public || process.cwd();
// controller
const controller     = new Controller({
    source : resolve(cwd,'./**/*.controller.ts')
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
let host = new Host();
host.use(controller.use)
    .use(new Session().use)
    .use(VueTransformer.use)
    .use(transformer.use)
    .use((socket,next) => {
        next();
    });

host.on('client', ({connect,exception}) => {
    connect({});
});

host.on('exception', (exception) => {
    console.error(exception);
});

host.on('mounted' , () => {

});

host.use('/', cwd);
host.start(argv?.port || 8080);
