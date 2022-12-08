
declare type ICallBack = (request,respond, next:Function) => void
declare type HTTPServer = any
declare type SocketIoServer = any
declare interface MiddleWareInterface {
    use(request,respond,next):this
    install(HTTPServer:any,SocketIoServer:any):Promis<this>
    handshake(socket):{}
}
