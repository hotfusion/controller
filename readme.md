## Micro Controller  
  
  
#### install  
``npm install @hotfusion/micro``  
  
#### Basic usage  
  
  
*Create controller file in your root directory `products.controller.ts`. *  
```ts  
/** products.controller.ts **/  
export default class Products {  
     public buy(name){  
            return { product : name }; 
     }
 }  
```  
  
*create a host file `host.ts` in the same directory as `host.ts` file*  
```ts  
/** host.ts **/  
  
import * as path         from 'path'  
import { Host, Client }  from '@hotfusion/micro';  
import { Controller}     from '@hotfusion/micro'  
  
const host = new Host();  
  
const controller = new Controller({  
 source: path.resolve(__dirname,'**/*.controller.ts')  
});  
  
host.use(controller.use);  
  
host.start().then(() => {  
 new Client().on('handshake', ({client}) => { client.transaction('Products.buy',{  
 name : 'pepsi' }).then(x => console.log).catch(e => console.error(e));  
 })})  
```  
  
after all files have been created, open your command prompt and navigate to the   
directory where `host.ts` and `products.controller.ts` and type `node host`:  
  
*JSON response*  
  
```json  
{  
  "product": "pepsi"  
}  
```  
  
#### Types  
To protect the data that arriving from the Client to the controller, we can take advantage of the typescript. As we know, TS won't work in runtime since it's a type checking language that works only in our editor and has no power over our application in runtime mode. But with micro controller it's not the case! We can use TS Types in run time and validate arguments using same types we are using in TS.
```ts  
 /** products.controller.ts **/ 
 import {type,types} from "@hotfusion/micro"; 
 // here we create our Types class validator where we hold all types we need to validate them 
 class Types{ 
     // to declair a type use @type decorator
     @type string(key,value){  
          if(typeof value !== 'string') 
             throw new Error('the value is not type of string'); 
     } 
 }  
 
 // tell controller to use our Types
 @types(Types) 
 class Products { 
       // now we can use [string] type in runtime
       public buy(name:string){  
             return { product : name }; 
       } 
 } 

export default Products 
  
// try to call transaction with property [name] as a number rather a string:  
client.transaction('Products.buy',{  
   name : 1 
}).then(x => console.log).catch(e => 
      // should throw an exception since our property value is not a string
      console.error(e) => response {  
          "error": "the value is not type of string"  
      }  
);  
```  