declare class Interface {
    static public ():any
    static public(target,name): any
}

export const type = (target,name) => {
    if(!target._types)
        target._types = [];

    target._types.push(name);
    return target;
}

export default class HF implements Interface {
    static public (target?:any,name?:string){
        if(name) {

            return target[name];
        }

        return (target,name,c) => {
            if(!target._public)
                target._public = [];

            target._public.push(name);
        }
    }
    static alias(name){
        return (target) => {
            target.prototype._alias = name;
            return target
        }
    }
}