const download = require('node-downloader-helper').DownloaderHelper, fs = require('fs');
export class CDN {
    #alias
    #link
    #content
    constructor(alias,link) {
        this.#alias = alias;
        this.#link  = link;

        this.start().then(x => {

        })
    }
    #download = (url, path):Promise<object> => {
        return new Promise((x,f) => {
            let dl = new download(url,path,{override:true})
                dl.on('end', x);
                dl.on('error', f);
                dl.start().catch(f);
        });
    }
    async start() {
        let file = null,is = false;
        do {
            if(is) return ; is = true;

            file = await this.#download(this.#link, __dirname);
            this.#content = fs.readFileSync(file.filePath).toString()
            fs.unlinkSync(file.filePath);
        } while (!file);
    }
    use(request,respond,next){
        if(request.url.split('@')[1] === this.#alias)
            return respond.send(this.#content);

        next();
    }
}