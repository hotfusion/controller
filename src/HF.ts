type ClassTypes = any


interface FirewallContext {
    socket:any,
    session:any,
    arguments:any,
    method:any
}
interface FirewallCallback {
    complete:Function
    exception:Function
}

export const type     = <key extends string, value extends object | any>(target,name,descriptor:TypedPropertyDescriptor<((key:string,value:object | any ) => any )>):TypedPropertyDescriptor<((key:string,value:object | any ) => any )> => {
    if(!target._types)
        target._types = [];

    target._types.push(name);
    return target;
}
export const firewall = <context extends FirewallContext, callback extends FirewallCallback>(target,name,descriptor:TypedPropertyDescriptor<((Context: context,Callback:callback) => any)>):TypedPropertyDescriptor<((Context: context,Callback:callback) => any)> => {
    if(!target._firewalls)
        target._firewalls = [];


    target._firewalls.push(name);
    return target;
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
export const types    = (_classTypes:ClassTypes) => {
    return (target) => {
        target.prototype._classTypes = _classTypes;
        return target
    }
}





