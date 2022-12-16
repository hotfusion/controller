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
export class Console {
    pattern = '⢹⢺⢼⣸⣇⡧⡗⡏'
    isInstalling = false
    sync  = []
    constructor() {
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
        console.error    = function() {
            if(!self.isInstalling)
                _error.apply({},arguments)
            else {
                self.sync.push({
                    scope : 'error',
                    args  : [].slice.call(arguments)
                });
            }
        }
        console.clear    = () => process.stdout.write('\x1Bc');
        console.progress = this.progress.bind(this);
        console.spinner  = this.spinner.bind(this)
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
        this.isInstalling = true;
        let P =  new progress.SingleBar({
            format           : 'installing |' + chalk.green('{bar}') + `| {percentage}% || {value}/{total} || {filename} ${config?.scope || ''}`,
            barCompleteChar  : '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor       : true,
            clearOnComplete  : true
        }, progress.Presets.shades_classic);

        let _stop = P.stop;
        P.stop =  () => {
            this.isInstalling = false;
            _stop.call(P);
            setTimeout(() => {
                this.sync.forEach(x => {
                    console[x.scope].apply({},x.args)
                })
            },500);
        }
        return P;
    }
    spinner(msg){
        if(this.isInstalling)
            return
        let spinner = new Spinner(chalk.cyan(`${msg} %s`));
        spinner.setSpinnerString(this.pattern);
        spinner.start();
        return spinner
    }
}