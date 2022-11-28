import { Host, CDN, Client } from "./classes";
import { resolve } from "path";
import { Webpack } from "./webpack";

let host = new Host();
let cdns = {
    vue    : new CDN('@vue','https://unpkg.com/vue@3'),
    moment : new CDN('@moment','https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js')
}

host.use(cdns.vue.use);
host.use(cdns.moment.use);

host.use((socket,next) => {
    next()
});

host.transformer(resolve(__dirname,'../www/**/*.s.ts'),async (File) => {
    try{
        File.content = (<any> await Webpack(<any>{
            entry : File.path
        })).content;
    }catch (e) {
        console.error(e);
    }
    return File;
});

host.on('client', ({complete,exception}) => {
    console.log('client wants connected')
    complete('not allow')
});

host.on('mounted' , ()=> {


    new Client().on('handshake', () => {
        console.log('client connected')
    }).on('exception',(event) => {
        console.log('exception',event)
    }).connect(5500)
});

host.use('/',
    resolve(__dirname,'../www')
);

host.start(5500);

