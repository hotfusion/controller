const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

export class Mongo {
    #client
    readonly #config
    constructor(config) {
        this.#config = config;
    }
    async connect(url){
        let instance = new MongoClient(url, { useUnifiedTopology: true });
        this.#client = await instance.connect();

        if(this.#config){
            let dbs = Object.keys(this.#config.databases);
            for(let i = 0; i < dbs.length; i++){
                let x = dbs[i], cols = Object.keys(this.#config.databases[x]);
                if(!this[x]) this[x] = {};
                for(let j = 0; j < cols.length; j++){
                    let y = cols[j];
                    if(!cols.find((z:any) => z === y))
                        this[x][y] = this.#client.db(x).createCollection(y);
                    else
                        this[x][y] = this.#client.db(x).collection(y)
                }
            }
        }


        return this;
    }
    getDatabasesList(){
        return this.#client.db().admin().listDatabases();
    }
}

/*
let mongo = new Mongo({
    databases : {
        crawler : {
            links : {}
        }
    }
});

mongo.connect('mongodb://localhost:27017').then(async (MongoInstance:Mongo | any ) => {
    console.log(MongoInstance.crawler.links)
})*/
