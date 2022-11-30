## Micro Controller

#### install
``npm install @hotfusion/micro``

#### usage
```ts
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