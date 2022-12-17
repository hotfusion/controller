import { Vue as IVue, createDecorator } from "vue-class-component";
import { Client } from "./classes/client";

let client,callbacks:any = {
    connect : []
};
export class HF {
    static client:any  = {
        on : createDecorator(function(options:any, key)  {
            options.mixins = [...(options.mixins || []),{
                beforeMount(){
                    let origin = this[key];
                    if(!callbacks[key])
                        callbacks[key] = [];

                    callbacks[key].push(origin);

                    if(key === 'connect')
                        this[key] = function (port,options = {})  {
                            if(!client && (typeof port === "number" || typeof port === "string")) {
                                client = new Client();
                                client.update(options);

                                client.on('handshake', (e) => {
                                    if(!client.__connected) {
                                        client.__connected = true;
                                        callbacks.connect.forEach(origin => origin(client));
                                    }else
                                        callbacks?.reconnect?.forEach?.(origin => origin(client))
                                });

                                client.on('disconnect', (e) => {
                                    callbacks?.disconnect?.forEach?.(origin => origin(client))
                                });
                                client.on('exception', (e) => {
                                    callbacks?.exception?.forEach?.(origin => origin(client))
                                });

                                client.connect(port);
                            }else
                                return origin(client)
                        }

                }
            }]
        }),
        transaction (path:string){
            return createDecorator(function(options:any, key)  {
                let origin = options.methods[key];
                options.methods[key] = function(){
                    client.transaction(path)
                }
            })
        }
    }
}




/*(<any>HF.client).on = createDecorator(function(options:any, key)  {

    if(!client)
        client  = new Client();

    if(key === 'connect') {
        const callback:any  = options.methods['connect'];
        options.methods['connect'] = function (port)  {
            if(!client._connected) {
                client.on('handshake', (e) => {
                    console
                        .log(e);

                    if (!client._connected) {
                        client._connected = true;
                        setTimeout(() => {
                            callbacks.connect.forEach(x => x.callback(client));
                        },1000)
                    } else
                        options.methods?.['reconnect']?.(client);
                });
                client.connect(port);
            }
            return callback.call(this,client);
        }
        callbacks.connect.push({callback:options.methods['connect'] ,options})
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
    }
});*/
export const Vue = IVue;
export {Options as options} from "vue-class-component";
export { Client } from './classes/client';