import MiddlewareFactory from "./index";
import {utils} from "../classes/utils";
import * as glob from 'fast-glob'
import * as path from "path";
import * as fs from "fs";
export class Transformer extends MiddlewareFactory implements MiddleWareInterface{
    readonly #files:any
    readonly #transformer:Function
    readonly #route;
    constructor(config:{source,transform,route?:any[]}) {
        super();
        this.#route = config.route;
        this.#transformer = config.transform;
        this.#files = glob.sync(utils.$toLinuxPath(config.source.slice(config.source.indexOf('*'),config.source.length)), { dot: true, cwd : config.source.split('*')[0] }).reduce((o,k,i) => {
            o[k] = {
                dir      : config.source.split('*')[0].replace(/\\/gi,'/'),
                relative : './' + k,
                path     : path.resolve(config.source.split('*')[0],'./' + k).replace(/\\/gi,'/'),
                content  : fs.readFileSync(path.resolve(config.source.split('*')[0],'./' + k)).toString()
            }
            return o
        },{});
    }
    use(request, respond, next) {
        let name = request.url.split('?').shift().replace('/','');
        if(this.#files[name])
            return respond.send(this.#files[name].content);

        next()
        return this;
    }

    handshake(socket): {} {
        return {};
    }

    async install(http: HTTPServer, io: SocketIoServer): Promise<this> {
        for(let i = 0 ; i < Object.keys(this.#files).length; i++){
            let name = Object.keys(this.#files)[i];

            (<any>console)
                .info(`transforming file: /${name}`);

            this.#files[name] = await this.#transformer(this.#files[name]);

            (<any>console)
                .info(`transformed successfully: [./${name}]`);
        }

        if(this.#route)
            http.use(this.#route[0],this.use);

        return this;
    }

}