type Socket = any
export class User {
    #socket
    constructor(socket:Socket) {
        this.#socket = socket;
    }
    getId(){
        return this.#socket.id
    }
    getSession(){
        return this.#socket.handshake.session
    }
    setSession(obj){
       Object.assign(this.#socket.handshake.session,obj);
       this.#socket.handshake.session.save();
    }
    set(key:string,value:any){
        this.#socket.handshake.session[key] = value;
        this.#socket.handshake.session.save();
    }
    get(key){
        return this.#socket.handshake.session[key]
    }
    remove(key){
        delete this.#socket.handshake.session[key];
        this.#socket.handshake.session.save();
    }
    dispatch(name,context){
        this.#socket.emit('listener',{
            name    : name,
            context : context || null
        })
    }
}