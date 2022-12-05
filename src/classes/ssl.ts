import * as  path from 'path';
const pathToLib =  path.resolve(__dirname,'../lib/openssl/win');
const pathToFile = path.resolve(__dirname,'../../admin/ssl/173.198.248.26/certificate.crt')
import {exec} from 'child_process';


exec(`"${path.resolve(pathToLib,'./openssl.exe')}" x509 -in "${pathToFile}" -text  -noout`,(error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});