export default class MiddlewareFactory implements MiddleWareInterface{
    constructor() {
        this.use = this.use.bind(this);
        (<any>this.use).install = this.install.bind(this);
        (<any>this.use).handshake = this.handshake.bind(this);
        (<any>this.use).className = this.constructor.name;
    }
    async install() {
        return this;
    }

    handshake(socket): object {
        return {};
    }

    use(request, respond, next) {
        return this;
    }
}

export {Transformer} from './transformer';
export {Controller} from './controller';
export {CDN} from './cdn'