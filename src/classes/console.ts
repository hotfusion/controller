import stamp from 'console-stamp';
import {Spinner} from 'cli-spinner'
import * as moment from "moment";

const chalk = require("chalk");

const prettyjson = require('prettyjson');


export class Console {
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
        (<any>console).json = this.json.bind(this);
    }
    json(json){
        console.log('--' + prettyjson.render(json));
    }
    parse(msg) {
        return msg.split(' ')
            // find links
            .map(x => x.split('/')[1] ? x.startsWith('[')?chalk.grey(x):chalk.blue(x):x)
            // find number
            .map(x => !isNaN(x.trim())?chalk.blueBright(x):x)
            .join(' ')
    }
    time(){
        return ['[',moment(new Date()).format('HH:MM:ss.SSS'),']'].join('')
    }
    spinner(message,label = 'downloading'){
        let spinner = new Spinner({
            text : [chalk.gray(this.time()), chalk.yellow(`[${label}]`), this.parse(message)].join(' ')
        });
        spinner.setSpinnerString('⢹⢺⢼⣸⣇⡧⡗⡏');
        spinner.start();
        return spinner
    }
}