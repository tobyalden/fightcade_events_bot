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
dotenv.config();
// Create a Bluesky Agent 
const agent = new api_1.BskyAgent({
    service: 'https://bsky.social',
});
async function main() {
    // Get all upcoming events from Fightcade
    let args = { limit: 1, offset: 0 };
    const fc_response = await fetch("https://www.fightcade.com/api/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ req: 'searchevents', ...args }),
    });
    const events = (await fc_response.json()).results.results;
    for (const event of events) {
        let formatted_date = human_date_1.default.prettyPrint(new Date(event.date));
        let post = `
📣 ${event.name}

🕹️ ${event.gameid}
📅 ${formatted_date}
🌍 ${event.region}
🏆 ${event.link}
📺 ${event.stream}`;
        await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
        await agent.post({
            text: post,
            createdAt: new Date().toISOString()
        });
        console.log("Just posted!");
    }
}
main();
// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod
const job = new cron_1.CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing
job.start();
