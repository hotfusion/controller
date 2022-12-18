import { Vue as IVue, createDecorator } from "vue-class-component";
import { Client } from "./classes/client";

let client,callbacks:any = {
    connect : []
};
export class HF {
    static client:any  = {
        connect : (port, options) => {
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
            }
        },
        on : createDecorator(function(options:any, key)  {
            options.mixins = [...(options.mixins || []),{
                beforeMount(){
                    let origin = this[key];
                    if(!callbacks[key])
                        callbacks[key] = [];

                    callbacks[key].push(origin);

                    if(key === 'connect')
                        this[key] =  (port,options = {}) =>  {
                            if(!client && (typeof port === "number" || typeof port === "string")) {
                                this.connect(port,options)
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

export const Vue = IVue;
export {Options as options,Options} from "vue-class-component";
export { Client } from './classes/client';
export * as UI from "@hotfusion/ui"