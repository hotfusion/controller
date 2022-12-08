#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2));


import {CDN, Controller, Transformer,Session, Server, Webpack, utils} from "./index";
import {resolve} from "path";
import {VueLoaderPlugin} from "vue-loader";

const server = new Server(process.cwd());

const controller = new Controller({
    source : resolve(process.cwd(),'./**/*.controller.ts')
})

const transformer    = new Transformer({
    source    : resolve(process.cwd(),'./**/*.s.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
                cwd   : process.cwd(),
                entry : File.path,
                watch : ({content,stats}) => { //stats.compiler.models
                    console.log(stats)
                    let modules = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    //console.log(Array.from(stats.compilation.modules.values()))
                    console.info('View file was updated:',modules[0])
                    File.content = content
                }
            })).content;
        }catch (e) {
            console.error(e);
        }
        return File;
    }
});

const VueTransformer = new Transformer({
    source    : resolve(process.cwd(),'./**/*.vue.js'),
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
                        '@' : process.cwd()
                    }
                },
                watch   : ({content, stats}) => {
                    let modules = Array.from(stats.compilation.modules.values()).map(function(m:any) {
                        return utils.$toLinuxPath(m?.request || '').split('/').pop();
                    });
                    let filename = modules.slice(0,modules.findIndex(x => x === 'exportHelper.js'))[0];
                    console.info(`Vue file updated: ./${filename}`)
                    File.content = content
                }
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