import {Host} from "./classes/host";
import {CDN} from "./classes/cdn";
import  {Client} from "./classes/client";

let host = new Host();
let cdns = {
    vue : new CDN('@vue','https://unpkg.com/vue@3')
}

host.use(function(req,res,next) {
    cdns.vue.use(req);
    next();
})

host.use((socket,next) => {
    next()
});


host.on('mounted' , ()=> {
    new Client().on('handshake', () => {
        console.log('client connected')
    }).connect(5500)
});
host.start(5500);

