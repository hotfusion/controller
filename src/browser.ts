import { Options, Vue, createDecorator } from "vue-class-component";
import { Client } from "./classes/client";

const client = new Client();
export class HF extends Vue{
    static client = createDecorator((options:any, key) => {
    })
}

(<any>HF.client).on = createDecorator((options:any, key) => {
    if(key === 'connect') {
        const Method = options.methods['connect'];
        if(Method)
            options.methods['connect'] = (port) => {
                client.connect(port);
                client.on('handshake', (e) => {
                    console
                        .log(e);

                    Method(client);
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
        })
        client.on('reconnect', (e) => {
            options.methods?.[key]?.(e);
        });
    }
});

export {Options as options, Vue} from "vue-class-component";
export * as UI from '../../UI/dist';