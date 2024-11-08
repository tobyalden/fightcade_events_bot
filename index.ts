import { BskyAgent, RichText } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import ogs from 'open-graph-scraper';
import axios from 'axios';
import sharp from 'sharp';
declare const Buffer;

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
        console.log(event.name);
    }

    //name: "Good Fighters' JoJo's Bizarre Adventure HFTF Tournament #1",
    //author: 'stressedin',
    //date: 1731117600000,
    //gameid: 'jojobanr1',
    //link: 'https://www.start.gg/tournament/good-fighters-vip-selection-jojo-s-bizarre-adventure-heritage-for/details',
    //region: 'Region Free',
    //stream: 'https://www.youtube.com/@GoodFighters37'
    
    let event = events[0];
    let date = new Date(event.date).toDateString();
    let post = `${event.name}\n${date}\n${event.link}`;
    console.log(post);

    // TODO: Figure out how I want to schedule posts - daily digest? one-off alerts?
    // TODO: Add rich text for links: https://docs.bsky.app/docs/tutorials/creating-a-post#mentions-and-links

    const options = { url: 'https://www.start.gg/tournament/good-fighters-vip-selection-jojo-s-bizarre-adventure-heritage-for/details' };
    let ogs_data = await ogs(options);
    const { error, html, result, response } = ogs_data;
    console.log('error:', error);  // This returns true or false. True if there was an error. The error itself is inside the result object.
    //console.log('html:', html); // This contains the HTML of page
    console.log('result:', result); // This contains all of the Open Graph results
    //console.log('response:', res); // This contains response from the Fetch API

    const r = await axios.get('https://images.start.gg/images/tournament/720151/image-8b772e28ab1bca5fcdd861b2fdf5662c-optimized.png?ehk=t9WS35nBlaQ1MNDSlGwrdxsdtiZwnFFAzxlGDTlnE1c%3D&ehkOptimized=q%2BWAjSkrVklkdY4dQJYw62uMF5om8IhhDoBDUH2FFRk%3D', { responseType: 'arraybuffer' });
    let buffer = Buffer.from(r.data, 'binary');
    console.log(buffer);

    //let jpeg_buffer = await pngToJpeg({quality: 40})(buffer);

    //let jpeg_buffer = await sharp(buffer).resize(100).jpeg({ mozjpeg: true }).toBuffer();
    let jpeg_buffer = await sharp(buffer).jpeg({ mozjpeg: true }).toBuffer();

    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
    const { data } = await agent.uploadBlob(jpeg_buffer, { encoding:'image/jpeg'} )
    await agent.post({
          text: 'website embed test 2',
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: 'https://www.start.gg/tournament/good-fighters-vip-selection-jojo-s-bizarre-adventure-heritage-for/details',
              title: 'Jojo Tournament',
              description: 'heres a description',
              thumb: data.blob
            }
          },
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
