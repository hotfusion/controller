import stamp from 'console-stamp';
import {Spinner} from 'cli-spinner'
import * as moment from "moment";
import * as terminalLink from 'terminal-link';

const chalk = require("chalk")
export class Console {
    constructor() {
        stamp( console , {
            format : ':date(HH:MM:ss.l).grey :label().blue :msg().green',
            tokens :{
                label: (event) => {
                    return `[${event.method}]`;
                },
                msg: (event:any)=> {
                    return this.parse(event.msg)
                }
            }
        } );

        (<any>console).spinner = this.spinner.bind(this);
        (<any>console).link    = this.link.bind(this)
    }
    parse(msg) {
        return msg.split(' ')
            // find links
            .map(x => x.split('/')[1] ? chalk.blue(x):x)
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
    link(msg,link){
        console.info(terminalLink(msg,chalk.underline.blue(link)))
    }
}