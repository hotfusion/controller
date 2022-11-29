import { type,protection } from "../src/HF";

class Types {
    @type string(Value){
    }
    @type number(Value){
    }
    @type boolean(key,value){
    }
    @type any(Value){
    }
}


export default class StreamController extends Types {
    @protection firewall  (event : { socket:any, arguments:any }, { allow, deny })  {

    }
    protected catalog = {
        create(name:string,email:string,phone:number):  StreamObject {
            let obj:StreamObject | any  = {}
                obj.g = ''

            return {
                name:'vadim',
                email : 'wdw',
                date : {
                    today : new Date()
                }
            }
        },
        get(s:string) : StreamObject {
            return
        }

    }
}
