import MiddlewareFactory from "./index";
import {utils} from "../classes/utils";
import * as glob from 'fast-glob'
import * as path from "path";
import * as fs from "fs";
export class Transformer extends MiddlewareFactory implements MiddleWareInterface{
    #files:any
    #transformer:Function
    constructor({source,transform}) {
        super();
        this.#transformer = transform;
        this.#files = glob.sync(utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length)), { dot: true, cwd : source.split('*')[0] }).reduce((o,k,i) => {
            o[k] = {
                dir      : source.split('*')[0].replace(/\\/gi,'/'),
                relative : './' + k,
                path     : path.resolve(source.split('*')[0],'./' + k).replace(/\\/gi,'/'),
                content  : fs.readFileSync(path.resolve(source.split('*')[0],'./' + k)).toString()
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

    async install() {
        for(let i = 0 ; i < Object.keys(this.#files).length; i++){
            let name = Object.keys(this.#files)[i];

            let spinner = (<any>console)
                .spinner(`transforming file: /${name}`,'compiling');

            this.#files[name] = await this.#transformer(this.#files[name]);

            spinner.stop();
            (<any>console)
                .info(`transformed successfully: [./${name}]`);
        }
        return this;
    }
    
}