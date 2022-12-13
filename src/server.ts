import { Host, Transformer, CDN, Controller,Session, utils } from "./index";
import { resolve } from "path";
import { Webpack } from "./webpack";

let folder = 'admin'
let cwd : string = resolve(__dirname,'../www');

let controller = new Controller({
    source : resolve(cwd,'./**/*.controller.ts')
})

let transformer = new Transformer({
    source    : resolve(cwd,'./**/*.s.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
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

const { VueLoaderPlugin } = require("vue-loader");
let VueTransformer = new Transformer({
    source    : resolve(cwd,'./**/*.vue.js'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
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

let cdns = {
    //vue    : new CDN('@vue','https://unpkg.com/vue@3'),
    moment : new CDN('@moment','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js')
}

let session = new Session()
let host = new Host();

host.use(controller.use)
    .use(session.use)
   // .use(VueTransformer.use)
    .use(transformer.use)
    //.use(cdns.vue.use)
    .use(cdns.moment.use)
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

host.start(6500);
