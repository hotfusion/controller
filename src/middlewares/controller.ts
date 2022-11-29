import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as glob from 'fast-glob'
import * as path from "path";
import * as fs from "fs";
import {utils} from "../classes/utils";
import MiddlewareFactory from "./index";
import {get,set} from 'lodash';
const chalk = require('chalk');


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
                                types : annotation?.types?.map?.(x => x.type) || (annotation?.type?[annotation?.typeName?.name|| annotation.type]:[])
                            })
                    }
                }
            })
        });

        return interfaces;
    }
}

export class Controller extends MiddlewareFactory implements MiddleWareInterface {
    #files = []
    readonly #source
    readonly #cwd
    readonly #interfaces = {}
    constructor({source}) {
        super();

        this.#cwd        = source.split('*')[0];
        this.#source     = utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length));
        this.#interfaces = Helper.getAllInterfaces(this.#cwd);
    }
    use(socket,next){
        for(let i = 0; i < this.#files.length; i++){
            let file = this.#files[i];
            let {_types,_public,_alias} = file.module.prototype, controller = new file.module();
            let interfaces = Object.keys(this.#interfaces).map(filename => {
                return this.#interfaces[filename]
            });
            //console.log('interfaces',interfaces)
            Object.keys(file.methods).forEach(_path => {
                let method = file.methods[_path];
                if(method.accessibility === 'protected'){
                    (<any>socket.transaction)(_path,async ({complete,exception,object}) => {
                        let f = get(controller, _path.split('.').splice(1).join('.'));
                        let errors = [];
                        method.params.forEach(x => {
                            let value = object[x.name]
                            let types = x.types;

                            if(types.length && !_types?.find)
                                console.error(`Controller method [${chalk.red(_path)}] => [${x.name}:${chalk.yellow(types.join(' | '))}] requires type declaration: @type ${chalk.yellow(types.join(' | '))} : (key,value) => {}`);
                            else
                                types.forEach(typeName => {
                                    let evaluate = _types.find(y => y === typeName);
                                    if(!evaluate)
                                        console.error(`Missing type validation [${typeName}] for ${_path}: ${x.name}`);
                                    else
                                        try{
                                            controller[evaluate](x.name,value);
                                        }catch(e){
                                            errors.push(e)
                                        }
                                })
                        });
                        if(errors.length)
                            return exception({
                                path   : _path,
                                errors : errors.map(x => x?.message || x)
                            });

                        try{
                            let value = await f.apply(
                                controller,
                                [...Object.values(object),socket]
                            );
                            // return interface schema
                            let schema;
                            if(method.interface){
                                schema = {}
                                let interfaces = Object.keys(this.#interfaces).map(x => this.#interfaces[x].filter(y => y.name === method.interface)).flat();
                                    interfaces.forEach(x => set(schema,x.path.split('.'),{}));

                                interfaces.forEach(inter => {
                                    if(get(value,inter.path) === undefined){
                                        set(schema,inter.path,null)
                                        return console.warn(`Returned object from method [${chalk.yellow(_path)}] is missing property  [${chalk.bold.white(inter.name)}.${chalk.redBright(inter.path)}]`)
                                    }else
                                        set(schema,inter.path,get(value,inter.path))
                                })
                            }

                            complete(schema || value);
                        }catch (e) {

                            console
                                .error(e);

                            exception({
                                path   : _path,
                                errors : ['Exception occurred in controller method, for details see the logs.']
                            });
                        }
                    })
                }
            })
        }

        next();
        return this;
    }
    async install (){
        this.#files = glob.sync([this.#source,'!node_modules'], { dot: true,cwd:this.#cwd }).map(x => path.resolve(this.#cwd,x));
        this.#files = this.#files.map(x => {
            let module = require(x.replace('.ts','.js')).default
            let methods = {}
            let code    = fs.readFileSync(x).toString();
            let ast     = parser.parse(code,{
                allowImportExportEverywhere:true,
                plugins: ["decorators","typescript"]
            });

            let parse = (f) => {
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
                let parent = f.parentPath, _path = [],accessibility = 'private',ignore = false;
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


                let types = (f.node?.callee || f.node).params.map(P => {
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
                        let A = P.typeAnnotation?.typeAnnotation
                        meta.params.push({
                            name    : P?.name,
                            default : P?.right?.value,
                            types   : (A?.types?.map?.(x => x?.typeName?.name || x.type) || [A?.elementType?.type || A?.type]).filter(x => x)
                        })
                    }
                    return meta.params;
                });

                if(_path.join('.').startsWith(module.name))
                    methods[_path.join('.')] = {
                        params        : types.flat().map(x => {
                            x.types = x.types.map(y => {
                                if(y === 'TSStringKeyword')
                                    return 'string';
                                if(y === 'TSNumberKeyword')
                                    return 'number';
                                if(y === 'TSBooleanKeyword')
                                    return 'boolean';
                                if(y === 'TSAnyKeyword')
                                    return 'any';
                                if(y === 'TSObjectKeyword')
                                    return 'object';

                                return y
                            });
                            return x;
                        }),
                        accessibility : accessibility,
                        interface     : f.node.returnType?.typeAnnotation?.typeName?.name || f.node.returnType?.typeAnnotation?.type || false
                    };
            }

            traverse(ast, {
                Function(path){
                    parse(path)
                }
            });

            console
                .info(`${chalk.magenta('controller:')} ${chalk.bold(module.name)} - [./${utils.$toLinuxPath(x).split('/').pop()}]`);

            return {
                methods : methods,
                module  : module,
                path    : x
            }
        });
        return this;
    }
    handshake(socket) {
        return {
            s : ''
        }
    }
}