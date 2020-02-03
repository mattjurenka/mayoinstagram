require('dotenv').config();

import { createServer } from 'http'
import express = require('express')
import bodyParser = require('body-parser')

import { createEventAdapter } from '@slack/events-api'
import { createMessageAdapter } from '@slack/interactive-messages'
import {
    parse_command_string,
    find_or_create_session,
    get_respond_fn,
    user_has_permission,
    PermissionLevel,
    find_or_create_user
} from "./utils"

import {
    commands, is_valid_command
} from "./commands"

import { port } from "./settings"
import { get_plaintext_blocks } from './templates';
import { Action } from '..';
import { UserModel } from './models';

const slackEvents:any = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

const app = express();
app.use('/slack/events', slackEvents.expressMiddleware());
app.use('/slack/actions', slackInteractions.expressMiddleware())
app.use(bodyParser.json());

const handle_command = async (command_str: string, params: string[], channel_id: string, action_type: Action, user_id: string) => {
    console.log(`Incoming command: ${command_str} of type: ${action_type}, with params: ${params.join(", ")}`)
    
    const session = await find_or_create_session(channel_id)
    if(!session) return {
        text: "Session not found"
    }

    const user = await find_or_create_user(user_id)
    const respond_fn = get_respond_fn(session)

    if (user_has_permission(user, PermissionLevel.Admin)) {
        if (is_valid_command(command_str)) {
            commands[command_str](session, params, respond_fn)
                .catch((err: Error) => {
                    respond_fn(
                        get_plaintext_blocks(`Error while executing ${command_str}: ${err.message}`)
                    )
                })
        } else {
            respond_fn(get_plaintext_blocks(`${command_str} is an invalid command`))
        }
    } else {
        respond_fn(get_plaintext_blocks(`You do not have permission to perform this command`))
    }
    
    return {
        text: "Processing..."
    }
}

slackInteractions.action({ type: 'overflow' }, async payload => {
    const channel_id = payload.channel.id
    const [command_str, params] = parse_command_string(payload.actions[0].selected_option.value)
    const user_id = payload.user.id
    return await handle_command(command_str, params, channel_id, "overflow", user_id)
})

slackInteractions.action({ type: 'button' }, async payload => {
    const channel_id = payload.channel.id
    const [command_str, params] = parse_command_string(payload.actions[0].value)
    const user_id = payload.user.id
    return await handle_command(command_str, params, channel_id, "button", user_id)
})

slackEvents.on("message", async (event: any) => {
    if (typeof event.user !== 'undefined') {
        if (event.channel_type === "im") {
            const channel_id = event.channel
            const user_id = event.user
            const [command_str, params] = parse_command_string(event.text)
            return await handle_command(command_str, params, channel_id, "message", user_id)
        }
    }
    return {
        text: "Processing..."
    }
})

const server = createServer(app);
server.listen(port, () => {
    console.log(`MayoInstagram server running on ${port}`);
});