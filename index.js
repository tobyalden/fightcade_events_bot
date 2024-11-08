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
    //name: "Good Fighters' JoJo's Bizarre Adventure HFTF Tournament #1",
    //author: 'stressedin',
    //date: 1731117600000,
    //gameid: 'jojobanr1',
    //link: 'https://www.start.gg/tournament/good-fighters-vip-selection-jojo-s-bizarre-adventure-heritage-for/details',
    //region: 'Region Free',
    //stream: 'https://www.youtube.com/@GoodFighters37'
    //let event = events[0];
    // TODO: Figure out how I want to schedule posts - daily digest? one-off alerts?
    // Challonge links: use Challonge API
    //console.log(event);
    //const options = { url: event.link};
    //let data = await ogs(options).catch(error => {
    //console.log(`onRejected function called: ${JSON.stringify(error)}`);
    //})
    //console.log(data);
    //const { error, html, result, response } = data;
    //console.log('error:', error);  // This returns true or false. True if there was an error. The error itself is inside the result object.
    //console.log('result:', result); // This contains all of the Open Graph results
    // TODO: result.ogImage could be empty
    // TODO: Post limit
    // TODO: Challonge API
    // TODO: Non challonge/start.gg fallthrough
    //if(result.ogImage) {
    //const r = await axios.get(result.ogImage[0].url, { responseType: 'arraybuffer' });
    //let buffer = Buffer.from(r.data, 'binary');
    //console.log(buffer);
    ////let jpeg_buffer = await pngToJpeg({quality: 40})(buffer);
    ////let jpeg_buffer = await sharp(buffer).resize(100).jpeg({ mozjpeg: true }).toBuffer();
    //let jpeg_buffer = await sharp(buffer).jpeg({ mozjpeg: true }).toBuffer();
    //await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
    //const { data } = await agent.uploadBlob(jpeg_buffer, { encoding:'image/jpeg'} )
    //await agent.post({
    //text: 'website embed test IV',
    //embed: {
    //$type: 'app.bsky.embed.external',
    //external: {
    //uri: result.ogUrl,
    //title: event.name,
    //description: result.ogDescription,
    //thumb: data.blob
    //}
    //},
    //createdAt: new Date().toISOString()
    //});
    //console.log("Just posted!")
    //}
}
main();
// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod
const job = new cron_1.CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing
job.start();
