<template>
    <Explorer></Explorer>
</template>

<script>
    import Explorer from "@/components/explorer"

    import {HF, UI, options } from 'HF';
    @options({
        components : {
            Explorer
        }
    })
    export default class App extends HF {
        @HF.client.on connect(client){
        }

        @HF.client.on exception(e){
        }

        @HF.client.on disconnect(e){
        }

        @HF.client.on reconnect(){

        }

        mounted(){
            new UI.default();
            this.connect(6500);
        }
    }
</script>

<style>
    #app{
        width: 100%;
        height: 100%;
    }
    body{
        margin:0
    }
</style>