const download = require('node-downloader-helper').DownloaderHelper, fs = require('fs');
export class CDN {
    readonly #alias
    readonly #link
    #content
    constructor(alias,link) {
        this.#alias = alias;
        this.#link  = link;

        this.use = this.use.bind(this);
        this.save().then(() => {

        });
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
        let file = null,is = false;
        do {
            if(is) return ; is = true;

            file = await this.#download(this.#link, __dirname);
            this.#content = fs.readFileSync(file.filePath).toString()
            fs.unlinkSync(file.filePath);

        } while (!file);
        return this;
    }
    use(request,respond,next){
        if('@' + request.url.split('@')[1] === this.#alias)
            return respond.send(this.#content);

        next();
    }
}