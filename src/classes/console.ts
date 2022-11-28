import stamp from 'console-stamp';
import * as moment from "moment";

const chalk = require("chalk");

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
export class Console {
    pattern = '⢹⢺⢼⣸⣇⡧⡗⡏'
    constructor() {
        stamp( console , {
            format : ':date(HH:MM:ss.l).grey :label().blue :msg()',
            tokens :{
                label: (event) => {
                    return `[${event.method}]`;
                },
                msg: (event:any)=> {
                    if(event.msg.startsWith('--'))
                        return event.msg.replace('--','\n');
                    return this.parse(event.msg)
                }
            }
        } );

        (<any>console).spinner = this.spinner.bind(this);
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
    spinner(message,label = 'downloading'){
        let msg = this.parse(message);
        console.info(msg)
        return {
            stop(){
                readline.moveCursor(process.stdout,0, -1)      // moving two lines up
                readline.cursorTo(process.stdout,0)            // then getting cursor at the begining of the line
                readline.clearScreenDown(process.stdout)
            }
        }
    }
}