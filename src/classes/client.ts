import * as EventEmitter from "eventemitter3";
import {io} from 'socket.io-client';

export class Client extends EventEmitter{
    constructor() {
        super();
    }
    connect(port){
        let connection = io(`http://localhost:${port}`);
        connection.on('handshake', () =>
            this.emit('handshake',{}))
    }
}