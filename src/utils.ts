import { QuoteModel, SessionModel, UserModel } from "./models"
import { WebClient } from '@slack/web-api'
import { images_folder, fonts_folder, session_timeout_ms, default_admins } from "./settings"
import { join } from "path"
import { ISession, IUser } from ".."

const web = new WebClient(process.env.SLACK_BOT_AUTH_TOKEN)

enum PermissionLevel {
    None = 0,
    Standard,
    Admin
}

const post_text = async (text: string, event: any, log_message: string) => {
    await web.chat.postMessage({
        text,
        channel: event.channel
    })
    console.log(log_message)
}

const post_blocks = async (blocks: any, event: any, log_message: string) => {
    await web.chat.postMessage({
        text: "",
        blocks,
        channel: event.channel
    })
    console.log(log_message)
}

const parse_command_string = (cmd_string: string): [string, string[]] => {
    const [command, param_str] = cmd_string.split(":")
    return [
        command,
        typeof param_str == "string" ? param_str.trim().split(" ") : []
    ]
}

const get_random_quote_instances = async (category: string) => {
    return QuoteModel.aggregate([
        {$match: {
            category,
            already_used: false,
            disabled: false
        }},
        {$sample: { size: 5 }},
    ]).exec()
}

const log_error = (err: Error, task_description: string): void => {
    console.log(`${err.name} while ${task_description}: ${err.message}`)
}

const find_or_create = async (model: any, query: any): Promise<any> => {
    try {
        return await model.findOne(query).orFail()
    } catch(find_err) {
        try {
            return await model.create(query)
        } catch(create_err) {
            log_error(create_err, "creating document after not found")
        }
    }
}

const find_or_create_session = async (channel_id: string) => {
    const now = new Date()
    return SessionModel.findOneAndUpdate({
        channel: channel_id,
        last_updated: {
            "$gte": new Date(now.getTime() - session_timeout_ms),
            "$lte": now
        },
    }, {
        last_updated: now
    })
    .orFail()
    .catch(async () => {
        return SessionModel.create({
            channel: channel_id,
            last_updated: now
        }).catch(create_err => {
            log_error(create_err, "creating session after not found")
        })
    })
}

const find_or_create_user = async (user_id: string) => {
    return UserModel.findOne({ user_id }).orFail()
    .catch(async () => {
        return UserModel.create({
            user_id,
            auth_level: default_admins.includes(user_id) ? PermissionLevel.Admin : PermissionLevel.None
        })
    })
}

const get_image_filepath = (filename: string): string => join(images_folder, filename)

const get_font_filepath = (font: string): string => join(fonts_folder, font, `${font}.fnt`)

const get_respond_fn = (session: ISession) => {
    return (blocks: any) => {
        web.chat.postMessage({
            text: "",
            channel: session.channel,
            blocks: JSON.parse(blocks)
        })
    }
}

const user_has_permission = (user: IUser, level: PermissionLevel): boolean => {
    return user.auth_level >= level
}

export {
    post_text,
    post_blocks,
    parse_command_string,
    get_random_quote_instances,
    find_or_create,
    get_image_filepath,
    get_font_filepath,
    log_error,
    find_or_create_session,
    get_respond_fn,
    PermissionLevel,
    user_has_permission,
    find_or_create_user
}