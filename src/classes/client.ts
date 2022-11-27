import * as EventEmitter from "eventemitter3";
import {io} from 'socket.io-client';

export class Client extends EventEmitter {
    #connection
    constructor() {
        super();
    }
    connect(port){
        this.#connection = io(`http://localhost:${port}`);
        this.#connection.on('handshake', () =>
                 this.emit('handshake',{}));

        this.#connection.on('exception', (event) =>
                 this.emit('exception',event));
    }
}