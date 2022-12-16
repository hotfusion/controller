const readline = require('readline');
const RL = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export class Log {
    #scopes = ['log','error']
    #origin = {}
    #buffer = []
    constructor() {
        let self = this;
        ['error','log','warn','info'].forEach((x) => {
            this.#origin[x] = console[x];
            console[x] = function () {
                self.#buffer.push({
                    scope : x ,
                    args : [].slice.call(arguments)
                })
            }
        });

        setInterval(() => {
            let buffer = this.#buffer.shift();
            if(buffer)
                this.#origin[buffer.scope].apply({},buffer.args);
        })
    }
}

new Log();

console.info('test');
console.error(new Error('this is errpr'))