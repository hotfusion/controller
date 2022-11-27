import { Host, CDN, Client } from "./classes";
import { resolve } from "path";

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

host.transformer(resolve(__dirname,'../www/**/*.s.ts'),(File) => {
    File.content = 'alert()'
    return File;
});

host.on('client', ({complete,exception}) => {
    console.log('client wants connected')
    complete('not allow')
});

host.on('mounted' , ()=> {
    host.use('/',
        resolve(__dirname,'../www')
    );

    new Client().on('handshake', () => {
        console.log('client connected')
    }).on('exception',(event) => {
        console.log('exception',event)
    }).connect(5500)
});

host.start(5500);

