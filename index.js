"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@atproto/api");
const dotenv = __importStar(require("dotenv"));
const cron_1 = require("cron");
const process = __importStar(require("process"));
const human_date_1 = __importDefault(require("human-date"));
const object_hash_1 = __importDefault(require("object-hash"));
const simpl_db_1 = __importDefault(require("simpl.db"));
const db = (0, simpl_db_1.default)();
dotenv.config();
// Create a Bluesky Agent 
const agent = new api_1.BskyAgent({
    service: 'https://bsky.social',
});
async function main() {
    // Get all upcoming events from Fightcade
    const args = { limit: 1, offset: 0 };
    try {
        const fc_response = await fetch("https://www.fightcade.com/api/", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ req: 'searchevents', ...args }),
        });
        const events = (await fc_response.json()).results.results;
        for (const event of events) {
            const event_hash = (0, object_hash_1.default)(event);
            if (db.has(event_hash)) {
                console.log('Event already processed. Skipping...');
                continue;
            }
            console.log('New event! Posting...');
            db.set(event_hash, true);
            const formatted_date = human_date_1.default.prettyPrint(new Date(event.date));
            const formatted_stream_url = event.stream.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
            const post = `📣 ${event.name}
    🕹️ ${event.gameid}
    🗓️ ${formatted_date}
    🌍 ${event.region}
    🏆 ${event.link}
    📺 ${formatted_stream_url}`;
            const rt = new api_1.RichText({
                text: post,
            });
            await rt.detectFacets(agent);
            await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
            await agent.post({
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString()
            });
            console.log("Just posted!");
        }
    }
    catch (error) {
        console.error(error);
    }
}
main();
// Run this on a cron job
//const scheduleExpression = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 * * * *'; // Run every hour in prod
const job = new cron_1.CronJob(scheduleExpression, main);
job.start();
