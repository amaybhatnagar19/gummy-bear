import { cronJobs } from 'convex/server';import { internal } from './_generated/api';
const crons=cronJobs();crons.interval('expire temporary guest records',{hours:1},internal.guest.expire,{});export default crons;
