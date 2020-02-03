import Unsplash, { toJson } from 'unsplash-js';
import {
    loadFont,
    read,
    BLEND_SOURCE_OVER,
    measureTextHeight
} from "jimp"
import { get_font_filepath, get_image_filepath, log_error } from './utils';
import { max_image_size, quote_defaults } from './settings';
import { FontSize, IQuote, ICoordinate } from '..';
import Jimp = require('jimp');

require('es6-promise').polyfill();
require('isomorphic-fetch');

const unsplash = new Unsplash({ accessKey: process.env.UNSPLASH_ACCESS_KEY})

// Default function is broken
const measure_text_height = async (font: any, text: string, max_width: number): Promise<number> => {
    let height = 0
    const test_image = await read(get_image_filepath("artifacts/measure.png"))
    test_image.print(font, 0, 0, { text }, max_width, (err:any, image:any, end_coords:any) => {
        height = end_coords.y
    })
    return height
}

const measure_text_width = async (font: any, text: string): Promise<number> => {
    let width = 0
    const test_image = await read(get_image_filepath("artifacts/measure.png"))
    test_image.print(font, 0, 0, { text }, (err:any, image:any, end_coords:any) => {
        width = end_coords.x
    })
    return width
}

const get_quote_font_size = (width: Number): FontSize => {
    if (width > max_image_size * (7 / 8)) return 56
    if (width > max_image_size * (5 / 8)) return 48
    return 32
}

const get_inspirational_background_json = async (): Promise<any> => {
    try {
        const random_photo = await unsplash.photos.getRandomPhoto({ query: "trees" })
        return toJson(random_photo)
    } catch (err) {
        log_error(err, "getting background image")
    }
}

const get_image_url_from_id = async (image_id: string): Promise<string> => {
    try {
        
        const photo = await unsplash.photos.getPhoto(image_id)
        const json = await toJson(photo)
        return json.urls.regular
    } catch (err) {
        log_error(err, "getting background image url")
    }
}

const resize_to_maximum = async (image: any): Promise<any> => {
    try {
        const width = image.bitmap.width
        return width > max_image_size ? image.resize(max_image_size, max_image_size) : image
    } catch(err) {
        log_error(err, "ensuring background is less than the max size")
    }
}

const crop_to_square = async (image: any): Promise<any> => {
    try {
        const height = image.bitmap.height
        const width = image.bitmap.width

        const start_x = Math.max(0, (width - height) / 2)
        const start_y = Math.max(0, (height - width) / 2)
        const crop_width = Math.min(height, width)

        return image.crop(start_x, start_y, crop_width, crop_width)
    } catch(err) {
        log_error(err, "cropping background to square")
    }
}

const write_quote_over_image = async (quote: IQuote, image: any): Promise<any> => {
    try {
        const author = `- ${quote.author}`
        const text = `"${quote.quote}"`

        const width = image.bitmap.width

        const total_image_padding = 2 * quote_defaults.padding
        const total_box_padding = 2 * quote_defaults.black_box_padding
        const total_author_padding = 2 * quote_defaults.author_box_padding

        //width in pixels of the quote background box
        const quote_box_width = width * (1 - total_image_padding)
        //width in pixels of the quote text
        const quote_text_width = quote_box_width * (1 - total_box_padding)
        const quote_author_gap = width * quote_defaults.quote_author_padding

        const font_size = get_quote_font_size(width)
        const font = await loadFont(get_font_filepath("merriweather"))

        const quote_text_height = await measure_text_height(font, text, quote_text_width)
        const quote_vertical_padding = quote_box_width - quote_text_width
        const quote_box_height = quote_text_height + quote_vertical_padding

        const author_text_height = await measure_text_height(font, author, quote_text_width)
        const author_text_width = await measure_text_width(font, author)
        const author_box_width = author_text_width * (1 + total_author_padding)
        const author_vertical_padding = author_box_width - author_text_width
        const author_box_height = author_text_height + author_vertical_padding

        const quote_and_author_height = quote_box_height + quote_author_gap + author_box_height

        const quote_box_top_left = {
            x: width * quote_defaults.padding,
            y: (1/2) * (width - quote_and_author_height)
        }
        const quote_box_bottom_right = {
            x: width * (1 - quote_defaults.padding),
            y: quote_box_top_left.y + quote_box_height
        }
        const with_quote_box = await overlay_black_box(image, quote_box_top_left, quote_box_bottom_right)
        
        const quote_text_top_left = {
            x: quote_box_top_left.x + quote_box_width * quote_defaults.black_box_padding,
            y: quote_box_top_left.y + quote_vertical_padding / 2
        }

        const with_quote_text = await with_quote_box.print(
            font,
            quote_text_top_left.x,
            quote_text_top_left.y,
            {
                text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            },
            quote_text_width
        )

        const author_box_top_left = {
            x: quote_box_bottom_right.x - author_box_width,
            y: quote_box_bottom_right.y + quote_author_gap
        }

        const author_box_bottom_right = {
            x: quote_box_bottom_right.x,
            y: author_box_top_left.y + author_box_height
        }

        const with_author_box = await overlay_black_box(with_quote_text, author_box_top_left, author_box_bottom_right)
        
        const author_text_top_left = {
            x: author_box_top_left.x + author_box_width * quote_defaults.author_box_padding,
            y: author_box_top_left.y + author_vertical_padding / 2
        }

        return with_author_box.print(
            font,
            author_text_top_left.x,
            author_text_top_left.y,
            { text: author }
        )
    } catch(err) {
        log_error(err, "overlaying quote over background")
    }
}

const overlay_black_box = async (image: any, top_left: ICoordinate, bottom_right: ICoordinate): Promise<any> => {
    try {
        const height = bottom_right.y - top_left.y
        const width = bottom_right.x - top_left.x
        
        const black_box = await read(get_image_filepath("black.png"))
        const resized_box = black_box.resize(width, height)
        return image.composite(resized_box, top_left.x, top_left.y, {
            mode: BLEND_SOURCE_OVER,
            opacityDest: 1,
            opacitySource: 0.5
        })
    } catch(err) {
        log_error(err, "overlaying black box over background")
    }
}

export {
    get_inspirational_background_json,
    get_image_url_from_id,
    crop_to_square,
    write_quote_over_image,
    resize_to_maximum
}