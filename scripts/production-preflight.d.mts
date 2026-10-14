import { productionTarget } from '../shared/productionTarget.js';
export function validateProductionBuild(env:Record<string,string|undefined>):typeof productionTarget;
export function requireSafeDeploy(approvedCommit:string|undefined,currentCommit:string):void;

export function requireCleanRelease(trackedClean:boolean,stagedClean:boolean,untrackedSourceCount:number):void;
