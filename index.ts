import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import hdate from 'human-date';
import hash from 'object-hash';

import SimplDB from 'simpl.db';
const db = SimplDB();

dotenv.config();

// TODO: Lint?

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
})

async function main() {
    // Get all upcoming events from Fightcade
    const args = { limit: 1, offset: 0};
    const fc_response = await fetch("https://www.fightcade.com/api/", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({req: 'searchevents', ...args}),
    });
    const events = (await fc_response.json()).results.results;

    for(const event of events) {
        const event_hash = hash(event);
        if(db.has(event_hash)) {
            console.log('Event already processed. Skipping...');
            continue;
        }
        console.log('New event! Posting...');
        db.set(event_hash, true);
        const formatted_date = hdate.prettyPrint(new Date(event.date));
        const formatted_stream_url = event.stream.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
        const post = `📣 ${event.name}
🕹️ ${event.gameid}
🗓️ ${formatted_date}
🌍 ${event.region}
🏆 ${event.link}
📺 ${formatted_stream_url}`;

        const rt = new RichText({
            text: post,
        });
        await rt.detectFacets(agent);

        await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
        await agent.post({
              text: rt.text,
              facets: rt.facets,
              createdAt: new Date().toISOString()
        });
        console.log("Just posted!")
    }
}

main();


// Run this on a cron job
//const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();
