import { createDecorator } from "vue-class-component";
import { Client } from "./classes/client";

let client;
export class HF {
    static client:any  = createDecorator((options:any, key) => {})
}

(<any>HF.client).on = createDecorator((options:any, key) => {
    if(!client)
        client = new Client();

    if(key === 'connect' && !client._connected) {
        const callback = options.methods['connect'];
        if(callback)
            options.methods['connect'] = (port) => {
                client.connect(port);
                client.on('handshake', (e) => {
                    console
                        .log(e);

                    if(!client._connected) {
                        client._connected = true;
                        callback(client);
                    }else
                        options.methods?.['reconnect']?.(client);
                });
            }
    }

    if(key === 'exception')
        client.on('exception', (e) => {
            options.methods?.[key]?.(e);
        });

    if(key === 'disconnect')
        client.on('disconnect', (e) => {
            options.methods?.[key]?.(e);
        });

    if(key === 'reconnect'){
        client.update({
            timeout              : 5000,
            reconnection         : true,
            reconnectionDelay    : 1000,
            reconnectionDelayMax : 5000,
            reconnectionAttempts : 99999
        });
        /*client.on('reconnect', (e) => {
            options.methods?.[key]?.(client);
        });*/
    }
});

export {Options as options, Vue} from "vue-class-component";
export { Client } from './classes/client';