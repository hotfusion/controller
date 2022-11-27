const express    = require('express');
const client     = require('socket.io-client')
const path       = require('path');
const http       = require('http');
const https      = require('https');
const download   = require('node-downloader-helper').DownloaderHelper;
const fs         = require('fs-extra');
const fg         = require('fast-glob');
const webpack    = require("webpack");

import * as EventEmitter from 'eventemitter3';
import {Server} from "socket.io";
import {IO}     from "./io";

export class Host extends EventEmitter {
    readonly #express
    readonly #ssl
    readonly #http
    readonly #io
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
    start(port:number){
        // start the HTTP server
        setTimeout(() =>
            this.#http.listen(port,
                () => this.emit('mounted',this)
            ), 1000);
    }

    /**
     * extends express method use
     *
     * @param Event | string
     * @param dir   | string
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
    use(Event: IEvent | string, dir?:string | Function) {
        // if string we assume its a static path
        if(typeof Event === 'string')
            if(dir)
                return this.#express.use(Event, express.static(dir));
            else
                return this.#express.use(express.static(Event));

        // for socket use the arguments length should be 2
        let isSocket = this.#getArguments(Event).length === 2;
        if(isSocket)
            this.#io.use(Event)
        else
            this.#express.use(Event);

        return this;
    }

    transformer(source,transformer){
        let files:any[] = fg.sync( source.slice(source.indexOf('*'),source.length).replace(/\\/gi,'/'), { dot: true, cwd : source.split('*')[0] }).reduce((o,k,i) => {
            o[k] = {
                dir      : source.split('*')[0].replace(/\\/gi,'/'),
                relative : './' + k,
                path     : path.resolve(source.split('*')[0],'./' + k).replace(/\\/gi,'/'),
                content  : fs.readFileSync(path.resolve(source.split('*')[0],'./' + k)).toString()
            }
            return o
        },{});

        return Object.keys(files).forEach(async name => {
            files[name] = await transformer(files[name]);
            this.#express.use( '/' + name, (req,res,next) => {
                res.send(files[name].content);
            });
        })
    }
}

