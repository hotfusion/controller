<template>
    <div>
        <HelloWorld></HelloWorld>
    </div>
</template>

<script>
    import {HF, options } from 'HF';
    import HelloWorld from "@/vue/com.vue";

    @options({
        components : {
            HelloWorld
        }
    })
    export default class App extends HF {
        @HF.Client
        connect(client){
            console.log('client',client)
        }

        mounted(){
            this.connect(6500)
        }
    }
</script>
