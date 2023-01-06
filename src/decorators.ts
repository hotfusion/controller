type ClassTypes = any

export const type     = <key extends string, value extends object | any>(target,name,descriptor:TypedPropertyDescriptor<((key:string,value:object | any ) => any )>):TypedPropertyDescriptor<((key:string,value:object | any ) => any )> => {
    if(!target._types)
        target._types = [];

    target._types.push(name);
    return target;
}
export const firewall = function (target,name,descriptor:TypedPropertyDescriptor<any>):TypedPropertyDescriptor<(Context: FirewallContext,Callback:FirewallCallback) => any> {
    if(!target._firewalls)
        target._firewalls = [];
    target._firewalls.push(name);
    return descriptor;
}
export const api      = (target,name) => {
    if(!target._apis)
        target._apis = [];

    target._apis.push(name);
    return target;
}
export const alias    = (name:string) => {
    return (target) => {
        target.prototype._alias = name;
        return target
    }
}
export const gateway  = (url:string[] | string) => {
    return (target) => {
        if(!target.prototype._gateways)
            target.prototype._gateways = [];

        if((<any>url)?.map)
            target.prototype._gateways = [...target.prototype._gateways,...url]
        else
            target.prototype._gateways.push(url);
        return target;
    }
}
export const types    = (_classTypes:ClassTypes) => {
    return (target) => {
        target.prototype._classTypes = _classTypes;
        return target
    }
}
export const test     = function (...Arguments)  {
    return (target,name,descriptor) => {
        if(!target._tests)
            target._tests = [];

        target._tests.push({
            className  : target.constructor.name,
            methodName : name,
            arguments  : [].slice.call(arguments)
        });
    }
}





