require('dotenv').config();

import { createServer } from 'http'
import express = require('express')
import bodyParser = require('body-parser')

import { createEventAdapter } from '@slack/events-api'
import { createMessageAdapter } from '@slack/interactive-messages'
import { parse_command_string } from "./utils"

import {
    overflow_commands,
    button_commands,
    message_commands
} from "./commands"

import { port } from "./settings"

const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const app = express();
app.use('/slack/events', slackEvents.expressMiddleware());
app.use('/slack/actions', slackInteractions.expressMiddleware())
app.use(bodyParser.json());

slackInteractions.action({ type: 'overflow' }, (payload, respond) => {
    const [command, params] = parse_command_string(payload.actions[0].selected_option.value)
    console.log("Overflow", command, params)
    overflow_commands[command](params, respond)
    return {
        text: "Processing..."
    }
})

slackInteractions.action({ type: 'button' }, (payload, respond) => {
    const [command, params] = parse_command_string(payload.actions[0].value)
    console.log("Button", command, params)
    button_commands[command](params, respond)
    return {
        text: "Processing..."
    }
})

slackEvents.on("message", (event) => {
    if (typeof event.user !== 'undefined') {
        if (event.channel_type === "im") {
            const [command, params] = parse_command_string(event.text)
            console.log("Message", command, params)
            message_commands[command](params, event)
        }
    }
})

const server = createServer(app);
server.listen(port, () => {
    console.log(`Listening for events on ${port}`);
});