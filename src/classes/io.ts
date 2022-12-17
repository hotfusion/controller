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
                ChannelName?.join?.('.') || ChannelName, (ChannelTransactionEvent:{object,_tid}) => {
                    ChannelCallback({
                        object: ChannelTransactionEvent.object,
                        exception: (data) => {
                            socket.emit(ChannelTransactionEvent._tid, {error: data})
                        },
                        complete: (data) => {
                            socket.emit(ChannelTransactionEvent._tid,{transaction: data})
                        }
                    })
                }
            );

        next()
    }
}