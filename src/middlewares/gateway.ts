import MiddlewareFactory from "./index";

export class Gateway extends MiddlewareFactory implements MiddleWareInterface {
    use(socket,next): this {
        return this
    }

    async install(http: HTTPServer, io: SocketIoServer): Promise<this> {
        return
    }
}