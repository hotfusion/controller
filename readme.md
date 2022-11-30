## Micro Controller

#### install
``npm install @hotfusion/micro``

#### usage
*create a host file in your root directory `host.ts`*
```ts
/** host.ts **/
import * as path     from 'path'
import { Host }      from '@hotfusion/micro/classes';
import { Controller} from '@hotfusion/middlewares'

const host = new Host();

const controller = new Controller({
     source: path.resolve(__dirname,'**/*.controller.ts')
});

host.use(controller.use);
host.start()
```

*create controller file `products.controller.ts` in same directory as `host.ts` file*
```ts
/** products.controller.ts **/
export default class Products {
    public buy(){
        return true;
    }
}
```
