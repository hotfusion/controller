const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

export class Mongo {
    #client
    constructor(schema) {

    }
    async connect(url){
        let instance = new MongoClient(url, { useUnifiedTopology: true });
        this.#client = await instance.connect();
        return this;
    }
    getDatabasesList(){
        return this.#client.db().admin().listDatabases();
    }
    createDatabase(name,collections = {}){
        if(Object.keys(collections).length === 0)
            throw new Error(`When creating a database provide a collections schema`);

        let db = this.#client.db(name);
        Object.keys(collections).forEach(name => {
             db.createCollection('name');
        });
        return db;
    }
}

let mongo = new Mongo({});
mongo.connect('mongodb://localhost:27017').then(async (MongoInstance) => {
    console.log( MongoInstance.createDatabase('testdb',{
        col : {}
    }))
})