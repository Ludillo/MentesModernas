import { readFileSync, writeFileSync } from 'node:fs'
const config=JSON.parse(readFileSync(new URL('../mentesmodernas.config',import.meta.url),'utf8'))
if(config.schemaVersion!==1||!config.firebase?.projectId||!config.firebase?.apiKey)throw Error('Configuración de Firebase incompleta.')
const allowed=['apiKey','authDomain','projectId','appId','messagingSenderId']
const firebase=Object.fromEntries(allowed.map(k=>[k,config.firebase[k]]))
writeFileSync(new URL('../src/lib/firebase-config.json',import.meta.url),JSON.stringify(firebase,null,2)+'\n')
console.log('Configuración pública de Firebase actualizada.')
