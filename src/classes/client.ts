import * as EventEmitter from "eventemitter3";
import {io} from 'socket.io-client';

export class Client extends EventEmitter {
    #connection
    constructor() {
        super();
    }
    connect(port){
        let spinner = (<any>console).spinner(`client trying to connect to: http://localhost:${port}`,'connecting')

        this.#connection = io(`http://localhost:${port}`,{
            timeout:5000,
            reconnection:false
        });
        this.#connection.on('handshake', (event) => {
                spinner.stop()
                this.emit('handshake', event || {});
            }
        );

        this.#connection.on('disconnect', (event) => {
                this.emit('disconnect', event);
                spinner.stop()
            }
        );

        this.#connection.on('exception', (event) => {
                this.emit('exception', event);
                spinner.stop();
            }
        );

        this.#connection.on('connect_failed', (event) => {
                this.emit('exception', event);
                spinner.stop()
            }
        );

        this.#connection.on('error', (event) => {
                this.emit('exception', event);
                spinner.stop();
            }
        );
    }
}