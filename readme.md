## Micro Controller

#### install
``npm install @hotfusion/micro``

#### Basic usage


*create controller file in your root directory `products.controller.ts`*
```ts
/** products.controller.ts **/
export default class Products {
    public buy(name){
        return {
            product : name
        };
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
      new Client().on('handshake', ({client}) => {
          client.transaction('Products.buy',{
              name : 'pepsi'
          }).then(x => console.log).catch(e => console.error(e));
      })
})
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
To protect the data that arriving to the controller, we can use typescript types:
```ts
 /** products.controller.ts **/
 import {type,types} from "@hotfusion/micro";
 class Types{
    @type string(key,value){
         if(typeof value !== 'string')
            throw new Error('the value is not type of string');
    }
 }

 @types(Types)
 class Products {
     public buy(name:string){
         return {
             product : name
         };
     }
 }
 export default Products
```

```ts
/** host.ts **/
new Client().on('handshake', ({client}) => {
   client.transaction('Products.buy',{
              name : 1
    }).then(x => console.log).catch(e => console.error(e));
})
```

*JSON response*

```json
{
   "error": "the value is not type of string"
}
```

