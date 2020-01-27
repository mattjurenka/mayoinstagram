require('dotenv').config();

import { createServer } from 'http'
import express = require('express')
import bodyParser = require('body-parser')

import { createEventAdapter } from '@slack/events-api'
import { createMessageAdapter } from '@slack/interactive-messages'
import { parse_command_string, find_or_create, find_or_create_session, post_text, get_respond_fn } from "./utils"

import {
    overflow_commands,
    button_commands,
    message_commands,
    is_valid_overflow_command
} from "./commands"

import { port } from "./settings"

const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const app = express();
app.use('/slack/events', slackEvents.expressMiddleware());
app.use('/slack/actions', slackInteractions.expressMiddleware())
app.use(bodyParser.json());

const proccessing_text = {
    text: "Processing..."
}

slackInteractions.action({ type: 'overflow' }, async (payload) => {
    const channel_id = payload.channel.id
    const [command_str, params] = parse_command_string(payload.actions[0].selected_option.value)
    console.log("Overflow", command_str, params)
    
    const session = await find_or_create_session(channel_id)
    
    if (is_valid_overflow_command(command_str)) {
        overflow_commands[command_str](session, params, get_respond_fn(session))
    } else {
    }

    return proccessing_text
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