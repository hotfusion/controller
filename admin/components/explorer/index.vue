<template>

    <Layout orientation="horizontal">
        <Layout>
            <Grid style="width: inherit">
                <columns>
                    <column>A</column>
                    <column>B</column>
                </columns>
                <rows>
                    <row>
                        <cell>A</cell>
                        <cell>B</cell>
                    </row>
                </rows>
            </Grid>
        </Layout>
        <Layout>

        </Layout>
    </Layout>

</template>

<script>
    export default {
        name: "explorer",
        mounted(){
            //console.log(this)
        }
    }
</script>

<style scoped>
    body{
        margin:0
    }
</style>