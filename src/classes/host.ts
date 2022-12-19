import * as chalk from "chalk";

const express    = require('express');
const client     = require('socket.io-client')
const path       = require('path');
const http       = require('http');
const https      = require('https');
const fs         = require('fs-extra');
const fg         = require('fast-glob');

const os = require('os')
import * as EventEmitter from 'eventemitter3';
import {Server} from "socket.io";
import {IO}     from "./io";
import {utils} from "./utils";
import {Console} from "./console";

new Console(true);

export class Host extends EventEmitter {
    readonly #express
    readonly #ssl
    readonly #http
    readonly #io
    readonly #middles:{callback: ICallBack | string | string[], dir?:string | Function}[] = []
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
        // when a new connection established, collect all context from middlewares
        this.#io .on('connection',(socket) => {
            this.emit('client',{
                connect   : (e) => {
                    let controllers = this.#middles.filter((x:any) => typeof x?.callback?.handshake === 'function').map((x:any) => {
                        return {
                             [x.callback.className]:x?.callback?.handshake?.(socket) || {}
                         }
                    });
                    let context:ServiceContext = {
                        controllers : controllers
                    }
                    socket.emit('handshake', Object.assign(e || {},{context:context}) as ServiceContext)
                },
                exception : (e) => socket.emit('exception', e)
            })
        });

        // host Events
        this.#http.on('listening',
            () => this.emit('listening',this)
        );
        this.#http.on('listening',
            () => this.#express.emit('listening',this)
        );
        this.#http.on('error',
            async (error) => this.emit('exception',error)
        );
        this.#http.on('error',
            () => this.#express.emit('exception',this)
        );

        process.stdout.write('\x1Bc');
        console.info(chalk.bgBlue(chalk.white('TS')),os.type()+'/'+os.platform(),os.release());
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
    use(callback: ICallBack | string | string[], dir?:string | Function) {

        this.#middles.push({
            callback  : callback,
            dir       : dir

        });
        return this;
    }

    async start(port:number,ip:string = '127.0.0.1'){
        // start the HTTP server
        let middles = this.#middles;
        // install all middlewares
        const bar = (<any>console).progress({
            scope : 'middlewares'
        })

        bar.start(middles.length, 0);

        for(let i = 0; i < middles.length; i++){
            bar.update(i+1,{
                filename : ''
            });

            let {callback,dir} = middles[i];
            try{
                this.#express.port     = this.#io.port     = port;
                this.#express.ip       = this.#io.ip       = ip;
                this.#express.protocol = this.#io.protocol = 'http://';

                await (<any>callback)?.install?.(this.#express,this.#io);
                await (<any>dir)?.install?.(this.#express,this.#io);
            }catch (e) {
                console.error('middleware exception:',e);
            }

            // define static directory base on arguments type
            // host.use('/','./www')
            // host.use('/',(req,res,next) => {})
            // host.use('./www')
            if(typeof callback === 'string')
                if(typeof dir === 'string') {
                    // (<any>console).info(`host watching path: [${utils.$toLinuxPath(path.resolve(dir, '.' + callback))}]`)
                    this.#express.use(callback, express.static(dir));
                }else if(typeof dir === 'function'){
                    //(<any>console).info(`host watching path: [${callback}]`);
                    this.#express.use(callback, (req,res,next) => {
                        (<any>dir)(req,res,next);
                    });
                }else
                    this.#express.use(express.static(callback));

            // if no static define use a io or http middleware
            if(typeof callback === 'function') {
                // for socket the arguments length should be 2
                if ((<any>callback).type === 'socket' || this.#getArguments(callback).length === 2)
                    this.#io.use((socket,next) =>{
                        try{
                            (<any>callback)(socket,next)
                        }catch (e) {
                            console.error(e)
                        }
                    });

                if ((<any>callback).type === 'http' || this.#getArguments(callback).length === 3)
                    this.#express.use((req,res,next) => {
                        try{
                            (<any>callback)(req,res,next)
                        }catch (e) {
                            console.error(e)
                        }
                    });
            }

        }
        bar.stop();
        this.#http.listen(port, ip,() => {
            console.info(chalk.greenBright('service is running at'),chalk.bold(ip + ':' + port));
            this.emit('mounted', this);
            this.#express.emit('mounted', this);
        })
    }
}



