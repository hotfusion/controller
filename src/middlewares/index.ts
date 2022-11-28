export default class MiddlewareFactory implements MiddleWareInterface{
    constructor() {
        this.use = this.use.bind(this);
        (<any>this.use).install = this.install.bind(this);
        (<any>this.use).handshake = this.handshake.bind(this);
        (<any>this.use).className = this.constructor.name;
    }

    handshake(socket): object {
        return {};
    }

    install() {
    }

    use(request, respond, next) {
    }
}