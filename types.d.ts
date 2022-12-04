declare type ICallBack = (request,respond, next:Function) => void

declare interface MiddleWareInterface {
    use(request,respond,next):this
    install():Promis<this>
    handshake(socket):{}
}
