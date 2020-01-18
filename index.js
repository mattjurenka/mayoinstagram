require('dotenv').config();

const { createServer } = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const connectionStr = 'mongodb://127.0.0.1/data';
mongoose.connect(connectionStr, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
const Schema = mongoose.Schema;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const { WebClient } = require('@slack/web-api');
const web = new WebClient(process.env.SLACK_BOT_AUTH_TOKEN)
const { createMessageAdapter } = require('@slack/interactive-messages');
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const fs = require('fs')
const csv = require('csv-parser')

const quotes_filepath = "./raw_data/quotes.txt"
const port = process.env.PORT || 3000;

const { get_pick_quote_blocks, generate_pick_quote_section } = require("./templates")


const app = express();
app.use('/slack/events', slackEvents.expressMiddleware());
app.use('/slack/actions', slackInteractions.expressMiddleware())
app.use(bodyParser.json());

const QuoteSchema = new Schema({
    author: String,
    quote: String,
    category: String,
    already_used: {type: Boolean, default: false},
    disabled: {type: Boolean, default: false}
})

const QuoteModel = mongoose.model("QuoteModel", QuoteSchema)

slackEvents.on("message", (event) => {
    if (typeof event.user !== 'undefined') {
        if (event.channel_type === "im") {
            console.log(`Received a dm from ${event.user} in channel ${event.channel} says ${event.text}`);
            
            switch (event.text) {
                case "load quotes":
                    fs.createReadStream(quotes_filepath)
                    .on('error', () => {
                        console.log("Error Occurred")
                    })
                    .pipe(csv({separator: ';'}))
                    .on('data', (row) => {
                        QuoteModel.create({
                            quote: row.QUOTE,
                            author: row.AUTHOR,
                            category: row.GENRE
                        })
                    })
                    .on('end', () => {
                        web.chat.postMessage({
                            text: `Your message is: ${event.text}`,
                            channel: event.channel
                        }).then(() => {
                            console.log("Quotes Loaded")
                        })
                    })
                    break
                case "get quotes":
                    web.chat.postMessage({
                        blocks: JSON.parse(get_pick_quote_blocks([["Business", "business"], ["Happiness", "happiness"], ["Money", "money"]])),
                        channel: event.channel
                    }).then(() => {
                        console.log("Asked for quotes")
                    })
                    break
            }
        }
    }
})

const gen_get_quote_blocks = async (category) => {
    return QuoteModel.aggregate([
        {$match: {
            category,
            already_used: false,
            disabled: false
        }},
        {$sample: { size: 5 }},
    ]).exec()
}

slackInteractions.action({ type: 'overflow' }, (payload, respond) => {
    const [command, ...params] = payload.actions[0].selected_option.value.split(": ")
    console.log("Overflow", command, params)
    switch(command) {
        case "get-quotes":
            const category = params[0]
            gen_get_quote_blocks(category).then((quotes) => {
                respond({
                    blocks: JSON.parse(generate_pick_quote_section(quotes, category))
                })
            })  
            break
    }
    return {
        text: "Processing..."
    }
})

slackInteractions.action({ type: 'button' }, (payload, respond) => {
    const [command, ...params] = payload.actions[0].value.split(": ")
    console.log("Button", command, params)
    switch(command) {
        case "get-quotes":
            const category = params[0]
            gen_get_quote_blocks(category).then((quotes) => {
                console.log(quotes)
                respond({
                    blocks: JSON.parse(generate_pick_quote_section(quotes, category))
                })
            })
            break
    }
    return {
        text: "Processing..."
    }
})

const server = createServer(app);
server.listen(port, () => {
    console.log(`Listening for events on ${server.address().port}`);
});