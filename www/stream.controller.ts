import { firewall } from "../src/HF";
import { Types }    from "./types";


export default class StreamController extends Types {
    @firewall packets (event : { socket:any, arguments:any }, { allow, deny })  {

    }
    public catalog = {
        create<Name extends string>(name:Name) : StreamObject {
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
}

new StreamController()
