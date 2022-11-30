import * as EventEmitter from "eventemitter3";
import {io} from 'socket.io-client';
import {utils} from "./utils";

export class Client extends EventEmitter {
    #connection
    constructor() {
        super();
    }
    connect(port){
        console.info(`client trying to connect to: http://localhost:${port}`,'connecting')

        this.#connection = io(`http://localhost:${port}`,{
            timeout      : 5000,
            reconnection : false
        });

        this.#connection.on('handshake', (event) => {
                console.info(`connected to: http://localhost:${port}`)
                this.emit('handshake', Object.assign(event || {},{client:this}));
            }
        );

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

        this.#connection.on('error', (event) => {
                this.emit('exception', event);
            }
        );
    }
    transaction(ChannelName:string,VanillaObject,timeout?:number){
        return new Promise((x,f) => {
            let _tid   = utils.$objectId();
            let to:any = timeout || 5000;
            this.#connection.once(_tid,(data:{error,transaction}) => {
                if(to === 'timeout')
                    return;

                to = true;
                if(data.error)
                    return f(data.error);

                x(data.transaction);
            });

            this.#connection.emit(ChannelName,{
                _tid   : _tid,
                object : VanillaObject
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