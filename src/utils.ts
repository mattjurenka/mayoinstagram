import { QuoteModel, IImage } from "./models"
import { WebClient } from '@slack/web-api'
import { Model } from "mongoose"
import { images_folder, fonts_folder } from "./settings"
import { join } from "path"

const web = new WebClient(process.env.SLACK_BOT_AUTH_TOKEN)

const post_text = (text: string, event, log_message: string) => {
    web.chat.postMessage({
        text,
        channel: event.channel
    }).then(() => {
        console.log(log_message)
    })
}

const post_blocks = (blocks, event, log_message: string) => {
    web.chat.postMessage({
        text: "",
        blocks,
        channel: event.channel
    }).then(() => {
        console.log(log_message)
    })
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

const find_or_create = (model: any, query: any) => {
    return model.findOne(query, (err: any, image: IImage) => {
        return err ? model.create(query) : image
    })
}

const get_image_filepath = (filename: string): string => join(images_folder, filename)

const get_font_filepath = (filename: string): string => join(fonts_folder, filename)

export {
    post_text,
    post_blocks,
    parse_command_string,
    get_random_quote_instances,
    find_or_create,
    get_image_filepath,
    get_font_filepath
}