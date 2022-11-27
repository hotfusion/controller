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
import {IO} from "./io";



export class Host extends EventEmitter{
    readonly #express
    readonly #ssl
    readonly #http
    readonly #io
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
                socket.emit('handshake',{});
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
    use(Event: IEvent) {
        let isSocket = Event.toString().match(/\((.*)\)/)[0].split(',').length === 2;

        if(isSocket)
            this.#io.use(Event)
        else
            this.#express.use(Event);
        return this;
    }
}

