type DatabaseName = string
type ColumnName = string
export interface DBSchema {
    [key:DatabaseName] : {
        [key:ColumnName] : {
            insert(query)
            find(query)
        }
    }
}
const { MongoClient } = require('mongodb');


// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

export class Mongo {
    static DBSchema:DBSchema
    #client
    readonly #config
    constructor(DBSchema) {
        this.#config = {
            databases : DBSchema
        };
    }
    async connect<R extends string, schema extends DBSchema>(url:R): Promise <schema> {
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


        return <any>this;
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
