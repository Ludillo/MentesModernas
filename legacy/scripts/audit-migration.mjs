// Read-only inventory; no user identifiers, answers, hashes or secrets in output.
import {createClient} from '@supabase/supabase-js'
import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
const db=createClient(process.env.VITE_SUPABASE_URL,process.env.MM_SERVICE_KEY,{auth:{persistSession:false}})
const sql=readdirSync('supabase/migrations').map(f=>readFileSync('supabase/migrations/'+f,'utf8')).join('\n')
const tables=[...new Set([...sql.matchAll(/create table if not exists public\.([a-z_]+)/gi)].map(x=>x[1]))]
const counts={}
for(const table of tables){const {count,error}=await db.from(table).select('*',{count:'exact',head:true});if(error)throw error;counts[table]=count}
const {data:buckets,error}=await db.storage.listBuckets();if(error)throw error
const storage=[]
for(const bucket of buckets){let objects=0;let pending=[''];while(pending.length){const prefix=pending.pop();let offset=0;while(true){const {data,error}=await db.storage.from(bucket.id).list(prefix,{limit:100,offset});if(error)throw error;for(const item of data){if(item.id)objects++;else pending.push(prefix?`${prefix}/${item.name}`:item.name)}if(data.length<100)break;offset+=100}}storage.push({name:bucket.name,public:bucket.public,objects})}
let users=0,page=1,providers={};while(true){const {data,error}=await db.auth.admin.listUsers({page,perPage:100});if(error)throw error;for(const u of data.users){users++;for(const p of u.app_metadata.providers??[])providers[p]=(providers[p]??0)+1}if(data.users.length<100)break;page++}
const summary={checkedAt:new Date().toISOString(),counts,auth:{users,providers},storage,edgeFunctions:readdirSync('supabase/functions',{withFileTypes:true}).filter(f=>f.isDirectory()&&!f.name.startsWith('_')).map(f=>f.name)}
mkdirSync('work',{recursive:true});writeFileSync('work/migration-inventory.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2))
