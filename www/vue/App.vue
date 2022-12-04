<template>
    <div id="app">
        <HelloWorld></HelloWorld>
    </div>
</template>

<script>
    import { Options, Vue } from "vue-class-component";
    import HelloWorld from "@/vue/com.vue";

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
</script>
