import { firewall, alias , types } from "../src/HF";
import { Types } from "./types";

@types(Types)
@alias('SC')
class StreamController {
    @firewall packets (event : { socket:any, arguments:any }, { allow, deny })  {

    }
    public catalog = {
        create(name:string) : StreamObject {
            return {
                test  : '',
                name  : 'mike',
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