require('dotenv').config();

import { createServer } from 'http'
import express = require('express')
import bodyParser = require('body-parser')

import { createEventAdapter } from '@slack/events-api'
import { createMessageAdapter } from '@slack/interactive-messages'
import { parse_command_string, find_or_create, find_or_create_session, post_text, get_respond_fn, log_error } from "./utils"

import {
    command_structure
} from "./commands"

import { port } from "./settings"
import { get_plaintext_blocks } from './templates';
import { Action } from '..';

const slackEvents:any = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const app = express();
app.use('/slack/events', slackEvents.expressMiddleware());
app.use('/slack/actions', slackInteractions.expressMiddleware())
app.use(bodyParser.json());

const handle_command = async (command_str: string, params: string[], channel_id: string, action_type: Action) => {
    console.log(`Incoming command: ${command_str} of type: ${action_type}, with params: ${params.join(", ")}`)
    
    const session = await find_or_create_session(channel_id)
    if(!session) return {
        text: "Session not found"
    }

    const respond_fn = get_respond_fn(session)
    
    const structure:any = command_structure[action_type]

    if (structure.validator(command_str)) {
        structure.commands[command_str](session, params, respond_fn)
            .catch((err: Error) => {
                respond_fn(
                    get_plaintext_blocks(`Error while executing ${command_str}: ${err.message}`)
                )
            })
    } else {
        respond_fn(get_plaintext_blocks(`${command_str} is an invalid command`))
    }

    return {
        text: "Processing..."
    }
}

slackInteractions.action({ type: 'overflow' }, async (payload) => {
    const channel_id = payload.channel.id
    const [command_str, params] = parse_command_string(payload.actions[0].selected_option.value)
    return await handle_command(command_str, params, channel_id, "overflow")
})

slackInteractions.action({ type: 'button' }, async (payload, respond) => {
    console.log(payload)
    const channel_id = payload.channel.id
    const [command_str, params] = parse_command_string(payload.actions[0].value)
    return await handle_command(command_str, params, channel_id, "button")
})

slackEvents.on("message", async (event: any) => {
    if (typeof event.user !== 'undefined') {
        if (event.channel_type === "im") {
            console.log(event)
            const channel_id = event.channel
            const [command_str, params] = parse_command_string(event.text)
            return await handle_command(command_str, params, channel_id, "button")
        }
    }
})

const server = createServer(app);
server.listen(port, () => {
    console.log(`Listening for events on ${port}`);
});