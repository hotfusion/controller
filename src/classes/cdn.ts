const download = require('node-downloader-helper').DownloaderHelper, fs = require('fs');
export class CDN {
    readonly #alias
    readonly #link
    #content
    constructor(alias,link) {
        this.#alias = alias;
        this.#link  = link;
        this.use = this.use.bind(this);
        (<any>this.use).install = () => this.save()
    }
    #download = (url, path):Promise <object> => {
        return new Promise((x,f) => {
            let dl = new download(url,path,{override:true})
                dl.on('end', x);
                dl.on('error', f);
                dl.start().catch(f);
        });
    }
    async save() {
        let isDone = null,is = false;
        do {
            if(is) return ; is = true;

            console
                .log(`downloading cdn package: ${this.#link}`);

            let _file : any
                = await this.#download(this.#link, __dirname);

            console
                .log(`downloading is completed: ${this.#link}`);

            this.#content
                = fs.readFileSync(_file.filePath).toString();

            fs.unlinkSync(_file.filePath);
            isDone = true;
        } while (!isDone);

        return this;
    }
    use(request,respond,next){
        if('@' + request.url.split('@')[1] === this.#alias)
            return respond.send(this.#content);

        next();
    }
}