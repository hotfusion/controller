<template>

    <Layout orientation="horizontal">
        <Layout>
            <Grid>
                <columns>
                    <column>A</column>
                    <column>B</column>
                    <column>C</column>
                    <column>D</column>
                </columns>
                <rows>
                    <row>
                        <cell>A</cell>
                        <cell>B</cell>
                        <cell>C</cell>
                        <cell>D</cell>
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