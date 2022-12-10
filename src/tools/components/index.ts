import { createApp } from 'vue';
//@ts-ignore
import App from './tools.vue';
const app = createApp(App);

export class Tools {
    constructor() {
        let tools = document.createElement('tools');
        document.body.appendChild(tools);
        app.mount(tools);
    }
}