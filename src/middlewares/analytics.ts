import MiddlewareFactory from "./index";
import * as osu from 'node-os-utils'
export class Analytics extends MiddlewareFactory implements MiddleWareInterface{

    #stats = {
        inProgress : 0,
        completed  : 0,
        failed     : 0,
        total      : 0
    }
    #cpu = 0
    constructor() {
        super();

        //
        setInterval(() => {
            osu.cpu.usage()
                .then(cpuPercentage => {
                    this.#cpu = cpuPercentage;
                    /*console.clear()
                    console.info('in process',this.#stats.inProgress);
                    console.info('total',this.#stats.total);
                    console.info('errors',this.#stats.failed);
                    console.info('cpu',this.#cpu);*/
                })
        },1500)
    }
    use(socket, next) {
        let _emit = socket.emit, self = this;
        socket.emit = function () {
            self.#stats.total++;
            let args = [].slice.call(arguments);
            if(args?.[1]?.['error'])
                self.#stats.failed++;
            else
                self.#stats.completed++;

            _emit.apply(this, args)
        }
        next()
        return this;
    }
    handshake(socket): {} {

        return {};
    }
    async install(http: HTTPServer, io: SocketIoServer): Promise<this> {
        return this;
    }

}