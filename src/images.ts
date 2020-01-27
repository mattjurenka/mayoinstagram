import Unsplash, { toJson } from 'unsplash-js';
import {
    loadFont,
    read,
    BLEND_SOURCE_OVER
} from "jimp"
import { get_font_filepath, get_image_filepath, log_error } from './utils';
import { max_image_size } from './settings';
import { FontSize, IQuote, ICoordinate } from '..';

require('es6-promise').polyfill();
require('isomorphic-fetch');

const unsplash = new Unsplash({ accessKey: process.env.UNSPLASH_ACCESS_KEY})

const get_quote_font_size = (width: Number): FontSize => {
    if (width > max_image_size * (7 / 8)) return 56
    if (width > max_image_size * (5 / 8)) return 48
    return 32
}

const get_inspirational_background_json = async (): Promise<any> => {
    try {
        const random_photo = await unsplash.photos.getRandomPhoto({ query: "sunset" })
        return toJson(random_photo)
    } catch (err) {
        log_error(err, "getting background image")
    }
}

const get_image_url_from_id = async (image_id: string): Promise<string> => {
    try {
        const photo = await unsplash.photos.getPhoto(image_id)
        return toJson(photo).urls.regular
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

const write_text_over_box = async (quote: IQuote, image: any): Promise<any> => {
    try {
        const with_box = await overlay_black_box(image, {x: 10, y: 10}, {x: 300, y: 300})
        const font = await loadFont(get_font_filepath("merriweather"))
        return with_box.print(
            font,
            10,
            10,
            { text: `"${quote.quote}"` },
            300,
            300
        )
    } catch(err) {
        log_error(err, "writing text over background")
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
    write_text_over_box,
    resize_to_maximum
}