import { Host, Client } from "./classes";
import { Transformer, CDN, Controller } from "./middlewares";
import { resolve } from "path";
import { Webpack } from "./webpack";

let cwd : string = resolve(__dirname,'../www');

let controller = new Controller({
    source : resolve(__dirname,'../www/**/*.controller.ts')
})

let transformer = new Transformer({
    source    : resolve(__dirname,'../www/**/*.s.ts'),
    transform : async (File) => {
        try{
            File.content = (<any> await Webpack(<any>{
                entry : File.path
            })).content;
        }catch (e) {
            console.error(e);
        }
        return File;
    }
});

let cdns = {
    vue    : new CDN('@vue','https://unpkg.com/vue@3'),
    moment : new CDN('@moment','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js')
}

let host = new Host();

host.use(controller.use)
    .use(transformer.use)
    .use(cdns.vue.use)
    .use(cdns.moment.use)
    .use((socket,next) => {
        next();
    });

host.on('client', ({connect,exception}) => {
    connect({})
});

host.on('exception', (exception) => {
    console.error(exception)
});

host.on('mounted' , () => {
    new Client().on('handshake', ({client}) => {

        client.transaction('SC.catalog.create',{
            name : 'vadim',
            email : 'k@l.com',
            phone: 514999669,

        },7000).then(x => {
            console.log('good',x)
        }).catch(e => console.error(e));

        console.log('client connected')
    }).on('exception',(event) => {
        console.log('exception',event)
    }).connect(5500)
});

host.use('/', cwd);

host.start(5500);

