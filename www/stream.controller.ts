import { firewall, alias , types, api } from "../src/HF";
import { Types } from "./types";

declare type Socket = any
declare type HTTP   = any

@types(Types)
@alias('SC')
class StreamController {
    //
    @firewall packets (event : { request : Socket | HTTP, arguments:any }, { complete, exception })  {

    }

    protected catalog = {
        create(name : 'user' | 'red') : StreamObject {
            return {
                test  : '',
                name  : '1233',
                email : '5149996559',
                date  : {
                    today : new Date()
                }
            } as StreamObject
        },
        find(name:string):StreamObject{
            return {} as StreamObject
        },
        update(_id:objectId) : StreamObject {
            return {} as StreamObject
        },
        remove<T extends objectId>(_id:T):T{
            return _id;
        }
    }
    public links = {
        create(){

        }
    }
}

export default StreamController