declare type ParsedJSON = object
declare type ICallBack = (request,respond, next:Function) => void
declare type HTTPServer = any
declare type SocketIoServer = any
declare interface MiddleWareInterface {
    use<HTTPRequest, HTTPRespond, Socket>(request : HTTPRequest | Socket,respond:HTTPRespond | Function,next:Function|undefined):this
    install(HTTPServer:any,SocketIoServer:any):Promis<this>
    handshake(socket):{}
}
declare interface ServiceContext {
    controllers : any[]
}
declare interface TransactionCallbackContext {
    context   : any
    exception : (ErrorMessage?:any) => TransactionExceptionEvent
    complete  : (TransactionContext?:any) => TransactionCompleteEvent
}
declare interface TransactionEvent {
    _tid:string
    context:any
}
declare interface TransactionCompleteEvent {
    error:ErrorMessage
}
declare interface TransactionExceptionEvent {
    context:TransactionContext
}
declare interface TransactionException {
    scope : 'firewall' | 'method' | 'type'
    error : any
    code  ?: string
}
declare interface ControllerFile {
    module  : {
        prototype : {
            _types
            _classTypes
            _firewalls
            _alias,
            _gateways
        }
    } | any
    methods : {
        [key:string]:{
            params        : {name: string, default: any | undefined, types: string[] }[]
            accessibility : 'private' | 'public' | 'protected'
            declarations  : {name:string,type:'boolean' | 'string' | 'number' | 'object' | 'any' | any}[]
            interface     : string | boolean
        }
    },
    path    : string
    error  ?: any
}
