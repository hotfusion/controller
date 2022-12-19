import stamp from 'console-stamp';
import * as moment from "moment";
declare const console
const chalk = require("chalk");
const progress   = require('cli-progress');
const readline = require('readline');
const Spinner = require('cli-spinner').Spinner;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let busy = false
export class Console {
    pattern = '⢹⢺⢼⣸⣇⡧⡗⡏'
    sync  = []
    disabled = false
    constructor(disable?:boolean) {
        this.disabled = disable;
        if(!this.disabled)
        stamp( console , {
            format : ':date(HH:MM:ss.l).grey :label() :msg()',
            tokens :{
                label: (event) => {
                    if(event.method === 'error')
                        return chalk.redBright(`[${event.method}]`);
                    if(event.method === 'warn')
                        return chalk.yellowBright(`[${event.method}]`);

                    return chalk.bold.blueBright(`[${event.method}]`);
                },
                msg: (event:any)=> {
                    if(event.method === 'error' || event.method === 'warn')
                        return chalk.bold(this.parse(event.msg))

                    return this.parse(event.msg)
                }
            }
        });

        let _error = console.error, self = this;

        let C = {};
        if(!this.disabled)
        ['error','log','warn','info'].forEach((x) => {
            C[x] = console[x];
            console[x] = function () {
                self.sync.push({
                    scope : x , args : [].slice.call(arguments)
                })
            }
        });

        setInterval(() => {
            if(busy) return;
            let log = this.sync.shift();
            if(log?.scope === 'clear')
                return process.stdout.write('\x1Bc')

            if(log?.scope === 'error')
                return setTimeout(() => {
                    C[log.scope].apply(C[log.scope],log.args);
                },1000);
            if(log)
                C[log.scope].apply(C[log.scope],log.args);

        },30);

        console.clear    = () => {
            //if(!this.disabled)
                //this.sync.push({scope:'clear'})
        };
        console.progress = this.progress.bind(this)

    }
    parse(msg) {
        return msg.split(' ')
            // find links
            .map(x => x.split('/')[1] ? x.startsWith('[')?chalk.bold.grey(x):chalk.blue(x):x)
            // find number
            .map(x => !isNaN(x.trim())?chalk.blueBright(x):x)
            .join(' ')
    }
    time(){
        return ['[',moment(new Date()).format('HH:MM:ss.SSS'),']'].join('')
    }
    progress(config){
        let P:any  = {};

        if(!this.disabled)
            P = new progress.SingleBar({
                    format           : 'installing |' + chalk.green('{bar}') + `| {percentage}% || {value}/{total} || {filename} ${config?.scope || ''}`,
                    barCompleteChar  : '\u2588',
                    barIncompleteChar: '\u2591',
                    hideCursor       : true,
                    clearOnComplete  : true
            }, progress.Presets.shades_classic);

        let _stop = P.stop,_start = P.start,_update = P.update;
        P.start = (a,b) => {
            if(this.disabled)
                return
            process.stdout.write('\x1Bc')
            busy = true
            _start.call(P,a,b);
        }
        P.update = (a,b) => {
            if(this.disabled)
                return
            busy = true
            _update.call(P,a,b)
        }
        P.stop =  () => {
            if(this.disabled)
                return
            process.stdout.write('\x1Bc');
            _stop.call(P);
            setTimeout(() => {
                busy = false;
            },300)
        }
        return P;
    }
}