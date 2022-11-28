import * as chalk from "chalk";

const express    = require('express');
const client     = require('socket.io-client')
const path       = require('path');
const http       = require('http');
const https      = require('https');
const fs         = require('fs-extra');
const fg         = require('fast-glob');


import * as EventEmitter from 'eventemitter3';
import {Server} from "socket.io";
import {IO}     from "./io";
import {utils} from "./utils";
import {Console} from "./console";

new Console();

export class Host extends EventEmitter {
    readonly #express
    readonly #ssl
    readonly #http
    readonly #io
    readonly #middles:{callback: IEvent | string, dir?:string | Function, install:Function}[] = []
    readonly #getArguments = (V) => V.toString().match(/\((.*)\)/)[0].split(',')
    constructor() {
        super();

        // create express instance
        this.#express = express();

        // extend express instance with Host
        Object.keys(this.#express).forEach(P => {
            if(!P.startsWith('_') && P !== 'use')
                this[P] = this.#express[P];
        })

        // create HTTP server
        this.#http = this.#ssl?https.createServer(this.#ssl,this.#express):http.createServer(this.#express);
        // attach server socket to HTTP
        this.#io   = new Server();
        // extend each socket with new methods like transaction, dispatch
        this.#io .use((socket,next) => new IO(socket,next));
        // attach socket server to HTTp server
        this.#io .attach(this.#http);
        // when a new connection established
        this.#io .on('connection',(socket) => {
            this.emit('client',{
                connect   : (e) => {
                    let segments = this.#middles.filter((x:any) => typeof x?.callback?.handshake === 'function').map((x:any) => {
                        return {
                             [x.callback.className]:x?.callback?.handshake?.(socket) || {}
                         }
                    })
                    socket.emit('handshake', Object.assign(e || {},{segments:segments}))
                },
                exception : (e) => socket.emit('exception', e)
            })
        });

        // host Events
        this.#http.on('listening',
            () => this.emit('listening',this)
        );

        this.#http.on('error',
            async (error) => this.emit('exception',error)
        );
    }

    /**
     * @name use
     * @param callback string | Function
     * @param dir string | Function
     *
     * @description
     *   middleware method [use] is dynamic middleware and can react differently base on arguments type:
     *
     *   if callback typeof === string, we assume its a static folder, for example:
     *       host.use('/',resolve(__dirname,'../www'));
     *       or
     *       host.use(resolve(__dirname,'../www'));
     *
     *   if callback typeof ===  function with arguments length of 2, use socket
     *       host.use((socket,next) => {
     *           next();
     *       });
     *
     *   if callback typeof ===  function with arguments length of 3, use express
     *       host.use((req,res,next) => {
     *           next();
     *       });
     */
    use(callback: IEvent | string, dir?:string | Function) {
        this.#middles.push({
            callback  : callback,
            dir       : dir,
            install   : function (callback,dir) {
                // if string we assume its a static path
                if(typeof callback === 'string')
                    if(dir) {
                        (<any>console).info(`host watching path: [${utils.$toLinuxPath(path.resolve(dir,'.' + callback))}]`)
                        return this.#express.use(callback, express.static(dir));
                    }else
                        return this.#express.use(express.static(callback));

                // for socket use the arguments length should be 2
                let isSocket = this.#getArguments(callback).length === 2;

                if(isSocket)
                    this.#io.use(callback)
                else
                    this.#express.use(callback);
            }.bind(this)
        });
        return this;
    }

    /**
     * @name transformer
     * @param source
     * @param transformer
     *
     */
    transformer(source:string,transformer:Function){
        this.#middles.push(<any> {
            callback: transformer,
            dir     : source,
            install : async (transformer, source) => {
                let files:any[] = fg.sync(utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length)), { dot: true, cwd : source.split('*')[0] }).reduce((o,k,i) => {
                    o[k] = {
                        dir      : source.split('*')[0].replace(/\\/gi,'/'),
                        relative : './' + k,
                        path     : path.resolve(source.split('*')[0],'./' + k).replace(/\\/gi,'/'),
                        content  : fs.readFileSync(path.resolve(source.split('*')[0],'./' + k)).toString()
                    }
                    return o
                },{});

                for(let i = 0 ; i < Object.keys(files).length; i++){
                    let name = Object.keys(files)[i];

                    let spinner = (<any>console)
                        .spinner(`transforming file: /${name}`,'compiling');

                    files[name] = await transformer(files[name]);
                    this.#express.use( '/' + name, (req,res,next) => {
                        res.send(files[name].content);
                    });
                    spinner.stop(true);
                    (<any>console)
                        .info(`transformed successfully: [./${name}]`)
                }
            }
        })
        return this;
    }
    async start(port:number){
        // start the HTTP server
        let middles = this.#middles;
        for(let i = 0; i < middles.length; i++){
            let {callback,dir,install} = middles[i];
            await (<any>callback)?.install?.();
            await install(callback,dir);
        }
        this.#http.listen(port, () => {
            console.info(chalk.greenBright('server is running at:'), port);
            this.emit('mounted', this);
        })
    }
}



