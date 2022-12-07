import {Client} from "../src/classes/client";

new Client().on('handshake', ({client}) => {

    client.transaction('SC.catalog.create',{
        name : 'vadim',
        email : 'k@l.com',
        phone: 514999669,

    },7000).then(x => {
        console.log('good',x)
    }).catch(e => console.error(e));

    //sasa
    console.log('client connected')
}).on('exception',(event) => {
    console.log('exception',event)
}).connect(5500)