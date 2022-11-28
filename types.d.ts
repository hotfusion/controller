declare type IEvent = (request,respond, next:Function) => void

declare interface MiddleWareInterface {
    use(request,respond,next)
    install()
}