import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as glob from 'fast-glob'
import * as path from "path";
import * as fs from "fs";
import {utils} from "../classes/utils";
import {User} from "../classes/user";
import {Client} from "../classes/client";
import MiddlewareFactory from "./index";
import {get,set} from 'lodash';
const chalk = require('chalk');
const clearModule = require('clear-module');
import {FirewallExceptions,TypeException,FileControllerException} from "../exceptions";

class Helper {
   static getAllInterfaces(cwd){
        let interfaces = {}
        let files = glob.sync(['**/*.d.ts','!node_modules'], { dot: true,cwd:cwd}).map(x => ({path:path.resolve(cwd,x),relative:x}));

        files.map(({path,relative}) => ({
            code     : fs.readFileSync(path).toString(),
            path     : path,
            relative : relative
        })).forEach(({code,path,relative}) => {
            let ast = parser.parse(code,{
                allowImportExportEverywhere : true,
                plugins : ["decorators","typescript"]
            });

            traverse(ast, {
                TSPropertySignature(p){
                    let path   = [];
                    let parent = p;
                    let TSInterfaceBody = false;
                    while(true){
                        if(parent.node.type === 'Program')
                            break

                        if(parent?.node.type === 'TSInterfaceBody'){
                            TSInterfaceBody = true;
                        }
                        let name = parent?.node?.id?.name || parent?.node?.key?.name
                        if(name)
                            path.unshift(name);

                        parent = parent.parentPath;
                    }

                    if(TSInterfaceBody) {
                        if(!interfaces[relative])
                            interfaces[relative] = []

                        let annotation = p.node?.typeAnnotation?.typeAnnotation;
                        if(annotation?.type !== 'TSTypeLiteral')
                            interfaces[relative].push({
                                name  : path.join('.').split('.').shift(),
                                path  : path.join('.').split('.').splice(1).join('.'),
                                types : (annotation?.types?.map?.(x => x.type) || (annotation?.type?[annotation?.typeName?.name|| annotation.type]:[])).map(x => {
                                    return {
                                        x ,
                                        required : !p.node.optional
                                    }
                                })
                            })
                    }
                }
            })
        });

        return interfaces;
    }
}


export class Controller extends MiddlewareFactory implements MiddleWareInterface {
    #files:ControllerFile[] = []
    readonly #source
    readonly #cwd
    readonly #interfaces = {}
    #http
    #io
    constructor({source}) {
        super();

        this.#cwd        = source.split('*')[0];
        this.#source     = utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length));
        this.#interfaces = Helper.getAllInterfaces(this.#cwd);

    }
    async install(http: HTTPServer, io: SocketIoServer): Promise<this> {
        this.#http = http;
        this.#io   = io;
        let getFiles = (bar?:any):ControllerFile[]  =>{
            let files = glob.sync([this.#source,'!node_modules'], { dot: true,cwd:this.#cwd }).map(x => path.resolve(this.#cwd,x));
            return files.map((x:string) => {
                try{
                    clearModule(x.replace('.ts','.js'));
                    let module  = require(x.replace('.ts','.js')).default
                    let methods = {}
                    let code    = fs.readFileSync(x).toString();
                    let ast     = parser.parse(code,{
                        allowImportExportEverywhere:true,
                        plugins: ["decorators","typescript"]
                    });

                    let parse = (f) => {
                        // TSTypeParameterDeclaration
                        let declarations :any = f.node?.typeParameters?.params?.map?.(x => ({name:x.name,type:x.constraint?.typeName?.name || x.constraint?.type || x?.type})) || [];

                        declarations = declarations.map(x => {
                            x.type = ((y) => {
                                if (y === 'TSStringKeyword')
                                    return 'string';
                                if (y === 'TSNumberKeyword')
                                    return 'number';
                                if (y === 'TSBooleanKeyword')
                                    return 'boolean';
                                if (y === 'TSAnyKeyword')
                                    return 'any';
                                if (y === 'TSObjectKeyword')
                                    return 'object';

                                return y
                            })(x.type);
                            return x;
                        })
                        //console.log(declarations)
                        if(!f?.container?.key?.name && !f?.node?.key)
                            return

                        try{
                            f.arrowFunctionToExpression()
                        }
                        catch (e) {}

                        let decNames = f.parentPath.parent.decorators?.map?.(x =>
                            // works with @HF.public() method(){}
                            x.expression?.callee?.property?.name ||
                            // works with @HF.public method(){}
                            x.expression?.property?.name
                        ) || [];

                        // loop back to get the full patch of the classMethod
                        let parent = f.parentPath, _path = [],accessibility = f.node.accessibility || 'private', ignore = false;

                        while(true){
                            if(!parent) {
                                break
                            }

                            if(parent?.node?.accessibility === 'public' || parent?.node?.accessibility === 'protected')
                                accessibility = parent.node.accessibility

                            if(parent.parent?.key?.name)
                                _path.unshift(parent.parent?.key?.name);

                            if(parent.parent?.id?.name)
                                _path.unshift(parent.parent?.id?.name);

                            if(parent.node.type === 'BlockStatement')
                                ignore = true;

                            parent = parent.parentPath;
                        }

                        // if the method is inside BlockStatement it's mean the method is not part of the ClassBody object
                        if(ignore)return;

                        // name of the function
                        _path.push(
                            // @HF.public a = {b: () => {}}
                            f?.container?.key?.name ||
                            // @HF.public a = {b() {}}
                            f.node.key.name)


                        let types:any  = (f.node?.callee || f.node).params.map(P => {
                            let meta = {
                                params : []
                            }
                            // method with the default value
                            // method(a:string = true)
                            if(P.left && P.right){
                                let A = P?.left?.typeAnnotation?.typeAnnotation;
                                meta.params.push({
                                    name    : P?.left?.name,
                                    default : P?.right?.value,
                                    types   : (A?.types?.map?.(x => x?.elementType?.type || x?.typeName?.name || x.type) || [A?.elementType?.type || A?.type]).filter(x => x)
                                })
                            }
                            // if default value was not initiated
                            // method(a:string)
                            if(P.typeAnnotation){
                                let A = P.typeAnnotation?.typeAnnotation;
                                meta.params.push({
                                    name        : P?.name,
                                    default     : P?.right?.value,
                                    types       : (A?.types?.map?.(x => x?.typeName?.name || x.type) || [A?.elementType?.type || A?.typeName?.name || A?.type]).filter(x => x)
                                })
                            }
                            return meta.params;
                        });


                        if(_path.join('.').startsWith(module.name)) {
                            let param = f.node.returnType?.typeAnnotation;
                            methods[_path.join('.')] = {
                                params: types.flat().map(x => {
                                    x.types = x.types.map(y => {
                                        if (y === 'TSStringKeyword')
                                            return 'string';
                                        if (y === 'TSNumberKeyword')
                                            return 'number';
                                        if (y === 'TSBooleanKeyword')
                                            return 'boolean';
                                        if (y === 'TSAnyKeyword')
                                            return 'any';
                                        if (y === 'TSObjectKeyword')
                                            return 'object';

                                        return y
                                    });
                                    return x;
                                }),
                                accessibility: accessibility,
                                declarations: declarations,
                                interface: {
                                    isArray   : param?.typeParameters?.params?.[0]?.type === 'TSArrayType' || param?.type === 'TSArrayType' || false,
                                    name      :
                                        // : Promise<T>
                                        param?.typeParameters?.params?.[0]?.typeName?.name ||
                                        // : Promise<T[]>
                                        param?.typeParameters?.params?.[0].elementType?.typeName?.name ||
                                        // : Source
                                        param?.typeName?.name ||
                                        param?.type || false
                                }
                            };
                        }
                    }

                    traverse(ast, {
                        Function(path){
                            parse(path)
                        }
                    });
                    return {
                        methods : methods,
                        module  : module,
                        path    : x
                    };
                }catch (e) {
                    return {
                        methods : {},
                        module  : false,
                        path    : x,
                        error   : e
                    }
                }
            });
        }
        let bar = (<any>console).progress();
        this.#files = getFiles();
        this.#files.forEach(x => {
            if(x.error)
                console.error('controller exception:', x.error);
        });

        this.#files.forEach((file:ControllerFile) => {
            let to,tp;
            fs.watch(file.path, (eventType, filename) => {
                process.stdout.write('\x1Bc')
                bar.start(100, 0);
                clearTimeout(to);
                clearTimeout(tp);
                bar.update(30, { filename: file.path.split('\\').pop() })
                to = setTimeout(() => {
                    if(eventType === 'change')
                        this.#files = getFiles(bar);

                    let isError = false;
                    this.#files.forEach(x => {
                        if(x.error) {
                            isError = true;
                            bar?.stop?.();
                            console.error('controller exception:', x.error);
                        }
                    })
                    if(isError) return;
                    bar.update(100);
                    setTimeout(x => {
                        bar.stop();
                        console.info(`${chalk.magenta(`controller ${this.#files.length?'updated':'installed'} :`)} ${chalk.bold(file.module.name)} - [./${utils.$toLinuxPath(file.path).split('/').pop()}]`);
                        this.test();
                    },1000 )
                },2000);

                tp = setTimeout(() => {
                    bar.update(40)
                },100)
            });
        });

        http.on('mounted', () => this.test());
        return this;
    }
    use(socket,next){
        let files:ControllerFile[] = this.#files.filter(x => x.module);
        for(let i = 0; i < files.length; i++){
            let file:ControllerFile = files[i];
            let {_types, _classTypes ,_firewalls ,_alias,_gateways} = file.module.prototype;
            let controller;
            try {
                // mount the class module and pass the user class
                controller = new file.module(new User(socket));
                // do we have TypeClass?
                if(_classTypes)
                   _classTypes = new _classTypes();

                // collected all interfaces from d.ts files
                let interfaces = Object.keys(this.#interfaces).map(filename => {
                    return this.#interfaces[filename]
                });

                // install all methods in the file
                Object.keys(file.methods).forEach(_path => {
                    let method = file.methods[_path];
                    if(method.accessibility === 'protected' || method.accessibility === 'public'){
                        // can use class alias
                        if(_alias)
                            _path = [_alias,_path.split('.').splice(1).join('.')].join('.');

                        // install transaction
                        (<any>socket.transaction)(_path,async ({complete,exception,context}:TransactionCallbackContext) => {
                            // use try to catch exceptions
                            try{
                                // get controller method from _path
                                let f = get(controller, _path.split('.').splice(1).join('.'));
                                // if protected, use firewalls
                                if(method.accessibility === 'protected')
                                    if(!_firewalls)
                                        throw new FirewallExceptions(`protected method [${_path}] requires a [firewall] hook inside the class.`)
                                    else {
                                        for(let i = 0; i < _firewalls.length; i++){
                                            let name = _firewalls[i];
                                            try{
                                                await new Promise((x,f) => {
                                                    Object.defineProperty(context,'meta',{
                                                        enumerable:false, writable:false, configurable:false,
                                                        value : () => ({key : _path,...method})
                                                    })
                                                    controller[name](context,{
                                                        complete  : x,
                                                        exception : f
                                                    })
                                                })
                                            }catch (e) {
                                                throw new FirewallExceptions(e)
                                            }

                                        }
                                    }

                                // validate params
                                method.params.forEach(x => {
                                        let value = context[x.name];
                                        if(!value)
                                            throw new TypeException(`arguments passed to transaction [${_path}] missing property [${x.name}] `)

                                        let types = x.types;
                                        if(types.length && !_types?.find && !_classTypes)
                                            throw new TypeException(`Controller method [${_path}] => [${x.name}:${types.join(' | ')}] requires type validator - @type ${types.join(' | ')} - (key,value) => {}`)
                                        else
                                            types.forEach(typeName => {
                                                let evaluate:string = _classTypes[typeName]?typeName:_types?.find?.(y => y === typeName);
                                                if(!evaluate)
                                                    evaluate = _types?.find?.(y => y === method.declarations.find(x =>  x.name === y)?.type);
                                                if(!evaluate)
                                                    evaluate = method?.declarations?.find?.(x => x.name === typeName)?.type

                                                if(!evaluate)
                                                    throw new TypeException(`Missing type validation [${typeName}] for ${_path} - ${x.name}`)
                                                else
                                                    try{
                                                        (_classTypes?.[evaluate] || controller[evaluate])(x.name,value);
                                                    }catch(e){
                                                        throw new TypeException(e)
                                                    }
                                            })
                                    });


                                let value = await f.apply(
                                    controller,
                                    [...Object.values(context),socket]
                                );
                                // return interface schema
                                let schema;
                                if(method.interface){
                                    schema = method.interface.isArray?[]:{};
                                    // filter interfaces
                                    let interfaces = Object.keys(this.#interfaces).map(x => this.#interfaces[x].filter(y => y.name === method.interface.name)).flat();
                                        interfaces.forEach(x => set(schema,x.path.split('.'),{}));

                                        if(method.interface.isArray && value.map){
                                            if(method.interface.isArray ){
                                                value.forEach((x,i) => {
                                                    let obj = {}
                                                    interfaces.forEach(inter => {
                                                        if (get(x, inter.path) === undefined && inter.types[0].required) {
                                                            console.warn(`method [${_path}] returns a context<${inter.name}> but its missing a property value [${inter.path}] in array collection at index [${i}]`)
                                                            set(obj, inter.path, null)
                                                        } else {
                                                            set(obj, inter.path, get(x, inter.path) || null)
                                                        }
                                                    })
                                                    schema.push(obj)
                                                })
                                            }
                                        }else if (method.interface.isArray && !value.map)
                                            console.warn(`Interface for method [${_path}] defined as array but returns non array context.`)
                                        else
                                            interfaces.forEach(inter => {
                                                if(method.interface.isArray && !value.map){
                                                    console.warn(`Interface for method [${_path}] defined as array but returns non array context.`)
                                                }else {
                                                    if(get(value,inter.path) === undefined && inter.types[0].required){
                                                        set(schema,inter.path,null);
                                                        console.warn(`method [${_path}] returns a context which is missing a property value [${inter.name}.${inter.path}]`)
                                                    }else
                                                        set(schema,inter.path,get(value,inter.path) || null)
                                                }

                                            })
                                }
                                //console.log(schema)
                                complete(schema || value);
                            }catch (e) {
                                exception({
                                    path    : _path,
                                    message : e.message,
                                    name    : e.name,
                                    code    : e.code
                                });
                            }
                        })
                    }
                })
            }catch (e) {
                new FileControllerException('Service controller could not loaded:',file)
            }
        }

        next();
        return this;
    }
    test(){
        // run tests
        let tests = [];
        let files = this.#files.filter(x => x.module);
        for(let i = 0; i < files.length; i++){
            let file = files[i];
            tests = [...tests, ...(file.module?.prototype?._tests?.map?.(x => {
                x.className = file.module?.prototype?._alias || x.className;
                return x;
            }) || [])];
        }

        if(tests.length) {
            console.info(chalk.bold(`automated tests [${chalk.cyan(tests.length)}]`));
            (<any>console).info(`creating virtual client`);
            setTimeout(() => {
                if(this.#io.ip)
                    this.#io.port = [(this.#io.protocol || 'http://') , this.#io.ip , ':' , this.#io.port].join('')

                let client = new Client();
                    client.connect(this.#io.port).then(async (context) => {
                        console.info(chalk.bold('virtual client is ready'));
                        for(let i = 0 ; i < tests.length; i++){
                            console.info(chalk.yellow(`controller:`),tests[i].className + '.' + tests[i].methodName, chalk.blueBright(JSON.stringify(tests[i].arguments[0])));
                            try {
                                console.info(chalk.cyanBright(`output:`),await client.transaction([tests[i].className,tests[i].methodName].join('.'),tests[i].arguments[0]));
                            } catch (e) {
                                console.error(e.errors)
                            }
                        }
                    });
            },200);
        }
    }
    handshake(socket) {
        return {
            s : ''
        }
    }
}
