import {expect,test} from 'vitest';
// Historical pre-V1 schema from e623093, not a production data export.
import legacy from '../fixtures/legacy-production-schema';
import current from '../../convex/schema';
const serialized=(schema:unknown):{schemaValidation:boolean;tables:{tableName:string;indexes:{indexDescriptor:string;fields:string[]}[]}[]}=>JSON.parse((schema as {export():string}).export());
test('every legacy auth, payment, access and analytics table keeps its exact validator and indexes',()=>{
 const old=serialized(legacy),next=serialized(current);
 for(const table of old.tables)expect(next.tables.find((t:{tableName:string})=>t.tableName===table.tableName)).toEqual(table);
 expect(next.tables.length-old.tables.length).toBe(11);
});

import live from '../fixtures/production-schema-2026-10-14.json';
test('actual read-only production schema retains every existing table definition and only adds tables',()=>{
 const next=serialized(current);expect(next.schemaValidation).toBe(live.schema.schemaValidation);
 for(const table of live.schema.tables){
  const {stagedDocumentType,...rest}=table;expect(stagedDocumentType).toBeNull();
  // Convex appends an implicit timestamp to deployed database indexes and
  // sorts their presentation. Preserve all explicit fields and descriptors.
  const indexes=rest.indexes.map(index=>{expect(index.fields.at(-1)).toBe('_creationTime');return {...index,fields:index.fields.slice(0,-1)};}).sort((a,b)=>a.indexDescriptor.localeCompare(b.indexDescriptor));
  const candidate=next.tables.find((t:{tableName:string})=>t.tableName===table.tableName);expect({...candidate,indexes:[...candidate!.indexes].sort((a,b)=>a.indexDescriptor.localeCompare(b.indexDescriptor))}).toEqual({...rest,indexes});
 }
 expect(next.tables.length-live.schema.tables.length).toBe(11);
});
