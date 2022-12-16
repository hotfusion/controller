
declare type ICallBack = (request,respond, next:Function) => void
declare type HTTPServer = any
declare type SocketIoServer = any
declare interface MiddleWareInterface {
    use<HTTPRequest, HTTPRespond, Socket>(request : HTTPRequest | Socket,respond:HTTPRespond | Function,next:Function|undefined):this
    install(HTTPServer:any,SocketIoServer:any):Promis<this>
    handshake(socket):{}
}
