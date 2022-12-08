#!/usr/bin/env node
import {CDN, Controller, Transformer,Session, Server, Webpack, utils} from "./index";
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

// mount server
const server         = new Server(cwd);
// controller
const controller     = new Controller({
    source : resolve(cwd,'./**/*.controller.ts')
});

// default transformer
const transformer    = new Transformer({
    source    : resolve(cwd,'./**/*.s.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
                cwd   : process.cwd(),
                entry : File.path,
                watch : argv.watch ? ({content,stats}) => { //stats.compiler.models
                    console.log(stats)
                    let modules = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    //console.log(Array.from(stats.compilation.modules.values()))
                    console.info('View file was updated:',modules[0])
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
    source    : resolve(cwd,'./**/*.vue.js'),
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
                    let modules = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    let filename = modules.slice(0,modules.findIndex(x => x === 'exportHelper.js'))[0];
                    console.info(`Vue file updated: ./${filename}`)
                    File.content = content
                } : false
            })).content;
        }catch (e) {
            console.error(e);
        }
        return File;
    }
})

server.host({
    port         : argv?.port || 8080,
    sessions     : [new Session()],
    transformers : [transformer,VueTransformer],
    controllers  : [controller],
    cdns         : [
        new CDN('@moment','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js')
    ]
})