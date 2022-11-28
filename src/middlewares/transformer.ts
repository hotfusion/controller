import MiddlewareFactory from "./index";
export class Transformer extends MiddlewareFactory implements MiddleWareInterface{
    use(request, respond, next) {
        return this;
    }

    handshake(socket): {} {
        return {};
    }

    install(): this {
        return this;
    }
    
}