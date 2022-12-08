import { Host } from "../index";


export class Server {
    readonly #cwd: string | boolean = false
    constructor(cwd:string) {
        this.#cwd = cwd || false;
    }

    host({
       port      = 8080,
       controllers = [],
       sessions    = [],
       transformers= [],
       cdns        = []
    }){
        if(typeof this.#cwd === 'boolean')
            throw new Error(`Server requires current working directory but it's missing`);

        let host = new Host();

        controllers.forEach(x => host.use(x.use));
        sessions.forEach(x => host.use(x.use))
        transformers.forEach(x => host.use(x.use))
        cdns.forEach(x => host.use(x.use))

        host.on('client', ({connect,exception}) => {
            connect({});
        });

        host.on('exception', (exception) => {
            console.error(exception);
        });

        host.on('mounted' , () => {

        });

        host.use('/', this.#cwd);
        host.start(port);
    }
}


