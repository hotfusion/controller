import MiddlewareFactory from "../middlewares";

const HTTPSession = require("express-session"),IOSession = require("express-socket.io-session"), path = require('path');
export class Session extends MiddlewareFactory implements MiddleWareInterface{
    async install(http?: HTTPServer, io?: SocketIoServer): Promise<this> {

        let session = HTTPSession({
            secret   : "my-secret",
            resave   : true,
            saveUninitialized : true
        });

        http.use(session);

        io.use(IOSession(session, {
            autoSave:true
        }));

        return this;
    }
}
