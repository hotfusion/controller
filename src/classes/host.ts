require( 'console-stamp' )( console , {
    format : ':date(HH:MM:ss.l).grey :label().blue :msg().green',
    tokens :{
        label: (a) => {
            return `[${a.method}]`;
        }
    }
} );

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
import {Utils} from "./Utils";

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
                complete  : (e) => socket.emit('handshake', e || {}),
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
     * extends express method use
     *
     * @param callback string | Function
     * @param dir string | Function
     *
     * @description
     *   if IEvent typeof is string, we assume its a static folder, for example:
     *       host.use('/account',resolve(__dirname,'../www'));
     *
     *
     *   if IEvent is a string and arguments length is 2, use socket
     *       host.use((socket,next) => {
     *           next();
     *       });
     *
     *   if IEvent is a string and arguments length is 3, use express
     *       host.use(function(req,res,next) {
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
                        console.info(`host watching path: ${
                            Utils.$toLinuxPath(path.resolve(dir,'.' + callback))
                        }`)
                        return this.#express.use(callback, express.static(dir));
                    }else
                        return this.#express.use(express.static(callback));

                // for socket use the arguments length should be 2
                let isSocket = this.#getArguments(Event).length === 2;

                if(isSocket)
                    this.#io.use(callback)
                else
                    this.#express.use(callback);
            }.bind(this)
        });
        return this;
    }

    transformer(source:string,transformer:Function){
        this.#middles.push(<any>{
            callback: transformer,
            dir     : source,
            install : async (transformer, source) => {
                let files:any[] = fg.sync( Utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length)), { dot: true, cwd : source.split('*')[0] }).reduce((o,k,i) => {
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

                    console
                        .info(`transforming file: ${name}`);

                    files[name] = await transformer(files[name]);
                    this.#express.use( '/' + name, (req,res,next) => {
                        res.send(files[name].content);
                    });

                    console
                        .info(`transformed successfully: ${name}`)
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
        this.#http.listen(port,
            () => this.emit('mounted', this)
        )
    }
}



