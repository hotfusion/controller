import { createApp } from 'vue'
// import the root component App from a single-file component.
import App from './App.vue'
console.log(App)
const app = createApp(App);
app.mount('#app')