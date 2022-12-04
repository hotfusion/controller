import { Options, Vue } from "vue-class-component";

// @ts-ignore
import HelloWorld from "@vue/com.vue";

@Options({
    name : "Home",
    components : {
        HelloWorld
    }
})
export default class App extends Vue {
    mounted(){

    }
}