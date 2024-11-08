import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { Fightcade } from 'fightcade-api';

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
})


async function main() {
    // Get all upcoming events from Fightcade
    let args = { limit: 1, offset: 0};
    const response = await fetch("https://www.fightcade.com/api/", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({req: 'searchevents', ...args}),
    });
    const events = (await response.json()).results.results;

    for(const event of events) {
        console.log(event.name);
    }

    //name: "Good Fighters' JoJo's Bizarre Adventure HFTF Tournament #1",
    //author: 'stressedin',
    //date: 1731117600000,
    //gameid: 'jojobanr1',
    //link: 'https://www.start.gg/tournament/good-fighters-vip-selection-jojo-s-bizarre-adventure-heritage-for/details',
    //region: 'Region Free',
    //stream: 'https://www.youtube.com/@GoodFighters37'
    //
    let event = events[0];
    let date = new Date(event.date).toDateString();
    let post = `${event.name}\n${date}\n${event.link}`;
    console.log(post);

    // TODO: Figure out how I want to schedule posts - daily digest? one-off alerts?
    // TODO: Add rich text for links: https://docs.bsky.app/docs/tutorials/creating-a-post#mentions-and-links

    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
    await agent.post({
        text: post,
        createdAt: new Date().toISOString()
    });
    console.log("Just posted!")
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 */3 * * *'; // Run once every three hours in prod

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();
