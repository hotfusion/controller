class Exception extends Error{
    constructor(args) {
        super([].slice.call(args).join(' '));

    }
}
export class FirewallExceptions extends Exception {
    constructor(...inputs:any) {
        super(arguments);
        this.name = "FirewallExceptions"
    }
}

export class TypeException extends Exception{
    #field:string
    constructor(message,field?:string) {
        super(arguments);
        this.#field = field;
        this.name = "TypeException"
    }
    getField() {
        return this.#field
    }
    setField( v ){
        this.#field = v;
    }
}

export class FileControllerException extends Exception {
    constructor(...inputs:any) {
        super(arguments);
        this.name = "FileControllerException"
    }
}

export class TypeError extends Error {
    constructor(type,key,value,msg?:string) {
        super(msg || `[${key}] value [${value}] is not a type of [${type}]`);
        this.name = "TypeError"
    }
}