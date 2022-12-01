const download = require('node-downloader-helper').DownloaderHelper, fs = require('fs');
import MiddlewareFactory from "./index";
import {utils} from "../classes/utils";
const mime = require('mime-types')

export class CDN  extends MiddlewareFactory implements MiddleWareInterface {
    readonly #alias
    readonly #link
    #content
    constructor(alias,link) {
        super()
        this.#alias = alias;
        this.#link  = link;

    }
    #download = (url, path):Promise <object> => {
        return new Promise((x,f) => {
            let dl = new download(url,path,{override:true})
                dl.on('end', x);
                dl.on('error', f);
                dl.start().catch(f);
        });
    }
    use(request,respond,next){
        if('@' + request.url.split('@')[1] === this.#alias)
            return respond.send(this.#content);

        next();
    }
    async install() {
        if(fs.existsSync(this.#link)){
            let spinner = (<any>console)
                .spinner(`importing local cdn package: [${utils.$toLinuxPath(this.#link)}]`);

            this.#content
                = fs.readFileSync(this.#link).toString();

            (<any>console)
                .info(`import is completed: [${utils.$toLinuxPath(this.#link)}]`);
        }else {
            let spinner = (<any>console)
                .spinner(`downloading cdn package: ${utils.$toLinuxPath(this.#link)}`);

            let _file: any
                = await this.#download(this.#link, __dirname);

            this.#content = fs.readFileSync(_file.filePath).toString();

            fs.unlinkSync(_file.filePath);

            (<any>console)
                .info(`downloading is completed:`, utils.$toLinuxPath(this.#link));
        }
        return this;
    }
    handshake(socket) {
        return {

        }
    }
}