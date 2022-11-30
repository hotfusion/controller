type ClassTypes = any

export const type = (target,name) => {
    if(!target._types)
        target._types = [];

    target._types.push(name);
    return target;
}
export const firewall = (target,name) => {
    if(!target._firewalls)
        target._firewalls = [];

    target._firewalls.push(name);
    return target;
}
export const api = (target,name) => {
    if(!target._apis)
        target._apis = [];

    target._apis.push(name);
    return target;
}
export const alias = (name:string) => {
    return (target) => {
        target.prototype._alias = name;
        return target
    }
}

export const types = (_classTypes:ClassTypes) => {
    return (target) => {
        target.prototype._classTypes = _classTypes;
        return target
    }
}