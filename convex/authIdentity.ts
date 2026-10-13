import { ConvexError } from 'convex/values';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireDataPolicy } from './v1Policy';
// existingUserId is supplied by Convex Auth from the proved provider account,
// never from a browser-supplied email or account ID.
export async function preserveIdentity(ctx:MutationCtx,args:{existingUserId:Id<'users'>|null;profile:{email?:string}}):Promise<Id<'users'>> {
 if(args.existingUserId){if(!await ctx.db.get(args.existingUserId))throw new ConvexError('This account is unavailable.');return args.existingUserId;}
 requireDataPolicy();const email=args.profile.email?.trim().toLowerCase();if(!email||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ConvexError('Enter a valid email address.');const collision=await ctx.db.query('users').withIndex('email',q=>q.eq('email',email)).take(2);if(collision.length)throw new ConvexError('This email already has an account. Use its existing sign-in method. Account linking requires proof of both identities.');return ctx.db.insert('users',{email});
}
