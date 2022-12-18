import {Server} from "socket.io";

export class IO extends Server {
    constructor(_server?:any,next?:Function) {
        super();
        if(typeof next === 'function')
            this.extend(_server,next);
        else
            (_server || this).use((socket:any,next) => this.extend(socket,next))
    }
    extend(socket,next){
        socket.despatch = (ChannelName,ChannelData) =>
            socket.emit(ChannelName,ChannelData)

        socket.transaction = (ChannelName,ChannelCallback) =>
            socket.on(
                ChannelName?.join?.('.') || ChannelName, (Event:TransactionEvent) => {
                    ChannelCallback({
                        context   : Event.context,
                        exception: (data) => {
                            socket.emit(Event._tid, {error: data})
                        },
                        complete: (data) => {
                            socket.emit(Event._tid,{transaction: data})
                        }
                    } as TransactionCallbackContext)
                }
            );

        next()
    }
}