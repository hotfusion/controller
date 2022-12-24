import { EventEmitter as EE }  from 'eventemitter3';
import {io} from 'socket.io-client';
import {utils} from "./utils";

export default class EventEmitter<EventTypes extends string | symbol = string | symbol> extends EE<EventTypes> {

}
export class Client extends EventEmitter {
    #connection:any
    readonly #options
    emit:any
    on:(path,callback) => any
    constructor(options  = {}) {
        super();
        this.#options = options;
        /* one of the annoying thing with private members is that the scope
           can be updated by another class and calling private member from
           this class will throw an error.

           @todo: fix it, bind all methods with current cass scope */

           this.transaction = this.transaction.bind(this);
           this.connect     = this.connect.bind(this)
    }
    update(options = {}){
        Object.assign(this.#options,options)
    }
    async connect(port){
        await new Promise(x => setTimeout(x,1000));
        let uri = `http://localhost:${port}`
        if(typeof port === 'string')
            uri = port;

        this.#connection = io(uri,Object.assign({
                reconnection : false
            },this.#options)
        );
        /* @todo create types for each event */
        this.#connection.on('disconnect', (event) => {
                this.emit('disconnect', event);
            }
        );

        this.#connection.on('exception', (event) => {
                this.emit('exception', event);
            }
        );

        this.#connection.on('connect_failed', (event) => {
                this.emit('exception', event);
            }
        );
        this.#connection.on('connect_error', (event) => {
                this.emit('exception', 'Cant connect to the controller:' + event.message + '. Check the port and host you are trying to connect!');
            }
        );
        this.#connection.on('error', (event) => {
                this.emit('exception', event);
            }
        );
        this.#connection.on('reconnect', (event) => {
                this.emit('reconnect', event);
            }
        );

        return await new Promise(x => {
            /* @todo handshake should have timeout */
            this.#connection.on('handshake', (context:ServiceContext) => {
                this.emit('handshake', context || {});
                this.#connection.on('observable', (observable) => {
                        this.emit('observable', observable);
                });
                x(context || {});
            });
        })
    }
    transaction(ChannelName:string,context:ParsedJSON,timeout?:number){
        return new Promise((x,f) => {
            let _tid   = utils.$objectId();
            let to:any = timeout || 5000;
            this.#connection.once(_tid,(data:{error,transaction}) => {
                if(to === 'timeout')
                    return;

                to = true;
                if(data.error)
                    return f(data.error);

                try{
                    x(JSON.parse(data.transaction));
                }catch (e) {
                    x(data.transaction);
                }
            });

            this.#connection.emit(ChannelName,{
                _tid    : _tid,
                context : context
            });

            let int = setInterval(() => {
                if(to === true)
                    return clearInterval(int);

                to = to - 1000;
                if(to < 0){
                    clearInterval(int);
                    to = 'timeout';

                    if(to !== true)
                        f('Transaction timeout exception')
                }
            },1000)

        });
    }
}