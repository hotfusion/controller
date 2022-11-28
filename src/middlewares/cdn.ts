const download = require('node-downloader-helper').DownloaderHelper, fs = require('fs');
import MiddlewareFactory from "./index";
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
        let spinner = (<any>console)
            .spinner(`downloading cdn package: ${this.#link}`);

        let _file : any
            = await this.#download(this.#link, __dirname);

        this.#content
            = fs.readFileSync(_file.filePath).toString();

        fs.unlinkSync(_file.filePath);

        spinner
            .stop();

        (<any>console)
            .info(`downloading is completed:`, this.#link);

        return this;
    }
    handshake(socket) {
        return {

        }
    }
}