import { QuoteModel, SessionModel, UserModel } from "./models"
import { WebClient } from '@slack/web-api'
import { images_folder, fonts_folder, session_timeout_ms, default_admins } from "./settings"
import { join } from "path"
import { ISession, IUser, ISessionData, FontSize, ICommandJSON } from ".."

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

const parse_command_string = async (cmd_string: string): Promise<ICommandJSON> => {
    try {
        return JSON.parse(cmd_string)
    } catch (err) {
        return {
            command: "error",
            params: {
                err
            }
        }
    }
}

const parse_message_as_command = async (message: string): Promise<ICommandJSON> => {
    try {
        const trimmed = message.trim()
        if (trimmed === "") {
            return {
                command: "none",
                params: {}
            }
        }

        const split = trimmed.split(":")
        if (split.length <= 1) {
            return {
                command: split[0],
                params: {}
            }
        } else {
            const param_pairs = split[1].trim().split(" ")
            const param_pairs_arr = param_pairs
                .map(val => val.trim())
                .filter(val => val !== "")
                .map(val => val.split("="))
                .filter(val => val.length === 2)
            const params:any = {}
            param_pairs_arr.forEach(val => {
                params[val[0]] = val[1]
            })
            return {
                command: split[0],
                params
            }
        }
    } catch (err) {
        return {
            command: "error",
            params: {
                err
            }
        }
    }
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
        /*last_updated: {
            "$gte": new Date(now.getTime() - session_timeout_ms),
            "$lte": now
        },*/
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

const update_session_data = async (session: ISession, key: string, value: any): Promise<void> => {
    SessionModel.findByIdAndUpdate(session._id, {
            $set: {
                [`session_data.${key}`]: value
            }
        }).exec().catch(err => {
            log_error(err, "updating the session")
        })
}

const get_image_filepath = (filename: string): string => join(images_folder, filename)
const get_artifact = (filename: string): string => get_image_filepath(join("artifacts", filename))
const get_output_filepath = (filename: string): string => get_image_filepath(join("completed", filename))

const get_font_filepath = (font: string, size: FontSize): string => join(fonts_folder, font, `${font}${size}.fnt`)

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
    get_font_filepath,
    log_error,
    find_or_create_session,
    get_respond_fn,
    PermissionLevel,
    user_has_permission,
    find_or_create_user,
    update_session_data,
    get_artifact,
    get_output_filepath,
    parse_message_as_command
}