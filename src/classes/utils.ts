export class utils  {
    static $toLinuxPath(_path){
        return _path.replace(/\\/gi,'/');
    }
    /* the interval will execute the current callback if only previous callback completed the execution */
    static $runSeries(this:any,cb,time):{stop:Function}{
        let int = setInterval(async () => {
            if(!this.__running) {
                this.__running = true;
                await cb();
                delete this.__running;
            }
        },time);

        return{
            stop(){
                clearInterval(int);
            }
        }
    }
    static $clone(obj){
        return JSON.parse(JSON.stringify(obj))
    }
    static $objectId(){
        function objectId () {
            return hex(Date.now() / 1000) +
                ' '.repeat(16).replace(/./g, () => hex(Math.random() * 16))
        }

        function hex (value) {
            return Math.floor(value).toString(16)
        }

        return  objectId()
    }
    static $convertBytes(bytes:number ) {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

        if (bytes == 0) {
            return "n/a"
        }
        //@ts-ignore
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

        if (i == 0) {
            return bytes + " " + sizes[i]
        }

        return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
    }

}