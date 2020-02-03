import * as fs from 'fs'
import * as csv from 'csv-parser'
import { read } from 'jimp';

import {
    get_category_selection_blocks,
    get_pick_quote_section,
    get_confirm_background_blocks,
    get_image_category_selection_blocks,
    get_plaintext_blocks
} from "./templates"
import { post_blocks, post_text, get_random_quote_instances, find_or_create, get_image_filepath, log_error, update_session_data } from "./utils"
import { QuoteModel, ImageModel } from "./models"
import {
    quote_categories,
    quotes_filepath,
    image_categories
} from "./settings"
import {
    get_inspirational_background_json,
    get_image_url_from_id,
    crop_to_square,
    write_quote_over_image
} from './images'
import { ISession, IQuote, IImage } from '..';

// Loads quotes from a hardcoded txt file to MongoDB
const load_quotes = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    fs.createReadStream(quotes_filepath)
        .on('error', (err) => {
            log_error(err, "loading quotes")
        })
        .pipe(csv({separator: ';'}))
        .on('data', (row: any) => {
            QuoteModel.create({
                quote: row.QUOTE,
                author: row.AUTHOR,
                category: row.GENRE
            })
        })
        .on('end', () => {
            respond(get_plaintext_blocks("Quotes Loaded"))
        })
}

// Sends a block where a user can select a category of quotes
const select_quotes = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    respond(get_category_selection_blocks(quote_categories))
}

//Sends 5 quotes given a category
const get_quotes = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [category] = params
    await update_session_data(session, "quote_category", category)
    const quotes = await get_random_quote_instances(category)
    respond(get_pick_quote_section(quotes, category))
}

// Disables a quote given a quote ID
const disable_quote = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [quote_id] = params
    try {
        const quote = await QuoteModel.findOneAndUpdate({ _id: quote_id }, { disabled: true }).orFail()
        respond(get_plaintext_blocks(`Disabled the quote: ${quote.quote}`))
    } catch (err) {
        log_error(err, "disabling quote")
    }
}

// Disables all quotes by a given author
const disable_author_of_quote = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [quote_id] = params
    const quote = await QuoteModel.findById(quote_id)
    const author = quote.author
    await QuoteModel.updateMany({ author }, { disabled: true })
    respond(get_plaintext_blocks(`Disabled all quotes from ${author}`))
}

const confirm_image = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [quote_id] = params
    const image_data = await get_inspirational_background_json()
    await find_or_create(ImageModel, { unsplash_id: image_data.id })
    const quote = await QuoteModel.findById(quote_id)
    respond(get_confirm_background_blocks(quote, image_data))
}

const select_image_category = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [quote_id] = params
    const quote = await QuoteModel.findById(quote_id)
    respond(get_image_category_selection_blocks(image_categories, quote))
}

const create_post = async (session: ISession, params: string[], respond: (blocks: any) => void) => {
    const [quote_id, image_id] = params
    const url = await get_image_url_from_id(image_id)
    const quote = await QuoteModel.findById(quote_id)
    const image = await read(url)
    const cropped = await crop_to_square(image)
    const with_text = await write_quote_over_image(quote, cropped)
    with_text.write(get_image_filepath(`${image_id}.png`))
    respond(get_plaintext_blocks(`File ${image_id}.png created`))
}

// All map the user-supplied command string to its handler function
const commands = {
    "get-quotes": get_quotes,
    "disable-author": disable_author_of_quote,
    "disable-quote": disable_quote,
    "confirm-image": confirm_image,
    "select-image-category": select_image_category,
    "create-post": create_post,
    "select-quotes": select_quotes,
    "load-quotes": load_quotes
}

const is_valid_command = (command_str: string): command_str is keyof typeof commands => {
    return command_str in commands
}

export {
    commands,
    is_valid_command
}