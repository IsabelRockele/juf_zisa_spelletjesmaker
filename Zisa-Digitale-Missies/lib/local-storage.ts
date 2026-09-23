import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.ZISA_DATA_DIR || './data');
let connection:DatabaseSync|undefined;
function db(){
 if(!connection){mkdirSync(root,{recursive:true});connection=new DatabaseSync(path.join(root,'missies.sqlite'));connection.exec(`
 PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY,owner TEXT NOT NULL,code TEXT NOT NULL UNIQUE,title TEXT NOT NULL,open INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL REFERENCES lessons(id),name TEXT NOT NULL,object_key TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS lessons_owner ON lessons(owner,created_at);
 CREATE INDEX IF NOT EXISTS works_lesson ON works(lesson_id,created_at);
 `);}return connection;
}
export function database(){return {prepare(sql:string){return {bind(...values:(string|number|null)[]){return {
 async first<T>():Promise<T|null>{return (db().prepare(sql).get(...values) as T|undefined)??null;},
 async all(){return {results:db().prepare(sql).all(...values)};},
 async run(){const r=db().prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}
 };}};}};}
function objectPath(key:string){if(!/^works\/[a-f0-9-]+\/[a-f0-9-]+\.png$/.test(key))throw new Error('Invalid storage key');return path.join(root,key);}
export function bucket(){return {
 async put(key:string,bytes:Uint8Array,_options?:unknown){const target=objectPath(key);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});},
 async get(key:string){try{const bytes=await readFile(objectPath(key));return {body:new Uint8Array(bytes)};}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}},
 async delete(key:string){try{await unlink(objectPath(key));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}}
 };}
