export default class MiddlewareFactory implements MiddleWareInterface{
    constructor() {
        let isSocket = this.#getArguments(this.use).length===2
        this.use = this.use.bind(this);
        (<any>this.use).type = isSocket?'socket':'http';


        (<any>this.use).install = this.install.bind(this);
        (<any>this.use).handshake = this.handshake.bind(this);
        (<any>this.use).className = this.constructor.name;
    }
    readonly #getArguments = (V) => V.toString().match(/\((.*)\)/)[0].split(',')
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