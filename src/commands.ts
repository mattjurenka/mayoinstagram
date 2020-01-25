import fs from 'fs'
import csv from 'csv-parser'
import { read } from 'jimp';

import {
    get_category_selection_blocks,
    get_pick_quote_section,
    get_confirm_background_blocks,
    get_image_category_selection_blocks
} from "./templates"
import { post_blocks, post_text, get_random_quote_instances, find_or_create, get_image_filepath } from "./utils"
import { QuoteModel, IQuote, ImageModel, IImage } from "./models"
import {
    quote_categories,
    quotes_filepath,
    image_categories
} from "./settings"
import {
    get_inspirational_background_json,
    get_image_url_from_id,
    crop_to_square,
    write_text
} from './images'

// Loads quotes from a hardcoded txt file to MongoDB
const load_quotes = (event: symbol) => {
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
            post_text(
                "Quotes Loaded",
                event,
                "Quotes Loaded"
            )
        })
}

// Sends a block where a user can select a category of quotes
const select_quotes = (params: string[], event) => {
    post_blocks(
        get_category_selection_blocks(quote_categories),
        event,
        "Asked for quotes"
    )
}

// Sends 5 quotes given a category
const get_quotes = (params: string[], respond: (data: any) => void) => {
    const [category] = params
    get_random_quote_instances(category).then((quotes) => {
        respond({
            blocks: JSON.parse(get_pick_quote_section(quotes, category))
        })
    })
}

const get_quotes_from_message = (params: string[], event) => {
    const [category] = params
    get_random_quote_instances(category).then((quotes) => {
        post_blocks(
            JSON.parse(get_pick_quote_section(quotes, category)),
            event,
            "Quotes Generated"
        )
    })
}

// Disables a quote given a quote ID
const disable_quote = (params: string[], respond: (data: any) => void) => {
    const [quote_id] = params
    QuoteModel.findOneAndUpdate({ _id: quote_id }, { disabled: true }, (err, quote) => {
        // @ts-ignore: Bug with mongoose model constructor
        // prevents types from working well with certain functions
        respond({ text: `Disabled the quote: ${quote.quote}` })
    })
}

// Disables all quotes by a given author
const disable_author_of_quote = (params: string[], respond: (data: any) => void) => {
    const [quote_id] = params
    QuoteModel.findById(quote_id, (err, quote: IQuote) => {
        const author = quote.author
        QuoteModel.updateMany({ author }, { disabled: true }, () => {
            respond({ text: `Disabled all quotes from ${author}` })
        })
    })
}

const confirm_image = (params: string[], respond: (data: any) => void) => {
    const [quote_id] = params
    get_inspirational_background_json()
        .then((image_data: any) => {
            find_or_create(ImageModel, {
                unsplash_id: image_data.id
            }).then((image: IImage) => {
                QuoteModel.findById(quote_id, (err, quote: IQuote) => {
                    if(err) console.log(err)
                    respond({
                        blocks: JSON.parse(get_confirm_background_blocks(quote, image_data))
                    })
                })
            })
        })
}

const select_image_category = (params: string[], respond: (data: any) => void) => {
    const [quote_id] = params
    QuoteModel.findById(quote_id, (err, quote: IQuote) => {
        respond({
            blocks: JSON.parse(get_image_category_selection_blocks(image_categories, quote))
        })
    })
}

const create_post = (params: string[], respond: (data: any) => void) => {
    const [quote_id, image_id] = params
    get_image_url_from_id(image_id)
        .then((url: string) => {
            QuoteModel.findById(quote_id, (err, quote: IQuote) => {
                read(url)
                    .then(crop_to_square)
                    .then(write_text(quote))
                    .then(image => {
                        image.write(get_image_filepath(`${image_id}.png`))
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
        })
    
}

// All map the user-supplied command string to its handler function
const overflow_commands = {
    "get-quotes": get_quotes,
    "disable-author": disable_author_of_quote,
    "disable-quote": disable_quote,
    "confirm-image": confirm_image,
    "select-image-category": select_image_category
}

const button_commands = {
    "get-quotes": get_quotes,
    "create-post": create_post
}

const message_commands = {
    "get-quotes": get_quotes_from_message,
    "select-quotes": select_quotes,
    "load-quotes": load_quotes
}

export {
    overflow_commands,
    button_commands,
    message_commands
}