import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as glob from 'fast-glob'
import * as path from "path";
import * as fs from "fs";
import {utils} from "./utils";

const chalk = require('chalk');
export class Controller implements MiddleWareInterface {
    #files
    #source
    #cwd
    constructor({source}) {
        this.#cwd = source.split('*')[0];
        this.#source = utils.$toLinuxPath(source.slice(source.indexOf('*'),source.length));
        (<any>this.use).install = this.install.bind(this);
    }
    use(socket,next){
        for(let i = 0; i < this.#files.length; i++){
            let file = this.#files;
            let {_types,_public, _packages,_alias} = file.module.prototype;

            _packages = _packages || [];
            _public   = _public   || [];

            let controller = new file.module();


            let validateType = async (name, object) => {
                for (let i = 0 ; i < Object.keys(object).length;i++) {
                    let key = Object.keys(object)[i];
                    let type =
                        file.methods?.[name]?.[i]?.type;

                    if(!type)
                        throw new Error(
                            `exception in transaction: missing type => {${key}}`
                        );

                    await controller[type](object[key]);
                }
            }
            _public.forEach(name => {
                let channels = [[_alias || file.module.name,name]];
                if(_packages.find(x => x === name))
                    channels = Object.keys(controller[name])
                        .map(key => [_alias || file.module.name,name,key])

                channels.forEach(channelName => {
                    (<any>socket.transaction)(channelName.join('.'),async ({complete,exception,object}) => {
                        try{
                            await validateType(name, object);
                            let values = Object.values(object);

                            let key = _packages.find(x => x === name);
                            console.log(key,values)
                            if(key)
                                return complete(
                                    await controller[name][key].apply(
                                        controller, [...(values.length?values:[object]),socket]
                                    )
                                );

                            complete(
                                await controller[name].apply(
                                    controller, [...(values.length?values:[object]),socket]
                                )
                            );
                        }catch (e) {
                            exception(e.message)
                        }
                    })
                });

            });
        }


        next();
    }
    install (){
        this.#files = glob.sync([this.#source,'!node_modules'], { dot: true,cwd:this.#cwd }).map(x => path.resolve(this.#cwd,x));
        this.#files = this.#files.map(x => {
            let module = require(x.replace('.ts','.js')).default
            let methods = {}
            let code    = fs.readFileSync(x).toString();
            let ast     = parser.parse(code,{
                allowImportExportEverywhere:true,
                plugins: ["decorators","typescript"]
            });

            traverse(ast, {
                Function(f){

                    let decNames = f.parentPath.parent.decorators?.map?.(x => x.expression.callee.property.name) || []
                    let parent   = f.parentPath, _path = []

                    while(true){
                        if(!parent)
                            break;

                        if(parent.parent?.key?.name) _path.unshift(parent.parent?.key?.name);
                        if(parent.parent?.id?.name)  _path.unshift(parent.parent?.id?.name);

                        parent = parent.parentPath
                    }

                    _path.push(f.node.key.name)

                    let types = f.node.params.map(P => {
                        let meta = {
                            params : []
                        }
                        if(P.left && P.right){
                            let A = P?.left?.typeAnnotation?.typeAnnotation;
                            meta.params.push({
                                name    : P?.left?.name,
                                default : P?.right?.value,
                                types   : (A?.types?.map?.(x => x?.elementType?.type || x?.typeName?.name || x.type) || [A?.elementType?.type || A?.type]).filter(x => x)
                            })
                        }
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

                    methods[_path.join('.')] = types.flat();
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
    }
}
