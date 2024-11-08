import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import hdate from 'human-date';
import hash from 'object-hash';

const SimplDB = require('simpl.db');
const db = new SimplDB();

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
})

async function main() {
    // Get all upcoming events from Fightcade
    let args = { limit: 1, offset: 0};
    const fc_response = await fetch("https://www.fightcade.com/api/", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({req: 'searchevents', ...args}),
    });
    const events = (await fc_response.json()).results.results;

    for(const event of events) {
        let event_hash = hash(event);
        if(db.has(event_hash)) {
            console.log('Event already processed. Skipping...');
            continue;
        }
        console.log('New event! Posting...');
        db.set(event_hash, true);
        let formatted_date = hdate.prettyPrint(new Date(event.date));
        let post = `
📣 ${event.name}

🕹️ ${event.gameid}
📅 ${formatted_date}
🌍 ${event.region}
🏆 ${event.link}
📺 ${event.stream}`;

        await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
        await agent.post({
              text: post,
              createdAt: new Date().toISOString()
        });
        console.log("Just posted!")
    }
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();
