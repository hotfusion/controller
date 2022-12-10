import UI from '@hotfusion/ui';

let ui = new UI();
export class Tools {
    constructor() {
        new ui.collection.Window('@tools',{
            style : {
                width:'700px'
            }
        })
    }
}

/*
import { createApp } from 'vue';
//@ts-ignore
import App from './components/tools.vue';
const app = createApp(App);

export class Tools {
    constructor() {
        let tools = document.createElement('tools');
        document.body.appendChild(tools);
        app.mount(tools);
    }
}*/
