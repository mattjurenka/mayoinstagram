import Unsplash, { toJson } from 'unsplash-js';
import { IQuote } from './models';
import { loadFont, HORIZONTAL_ALIGN_CENTER, VERTICAL_ALIGN_MIDDLE, FONT_SANS_16_BLACK } from "jimp"
import { get_font_filepath } from './utils';

require('es6-promise').polyfill();
require('isomorphic-fetch');

const unsplash = new Unsplash({ accessKey: process.env.UNSPLASH_ACCESS_KEY})

const get_inspirational_background_json = async (): Promise<any> => {
    return unsplash.photos.getRandomPhoto({ query: "sunset" })
        .then(toJson)
        .then(json => {
            return json
        })
}

const get_image_url_from_id = async (image_id: string): Promise<string> => {
    return unsplash.photos.getPhoto(image_id)
        .then(toJson)
        .then(json => {
            return json.urls.regular
        })
}

const crop_to_square = (image: any): any => {
    const height = image.bitmap.height
    const width = image.bitmap.width

    const start_x = Math.max(0, (width - height) / 2)
    const start_y = Math.max(0, (height - width) / 2)
    const crop_width = Math.min(height, width)

    return image.crop(start_x, start_y, crop_width, crop_width)
}

const write_text = (quote: IQuote) => {
    return async (image: any): Promise<any> => {
        return loadFont(FONT_SANS_16_BLACK)
            .then(font => {
                return image.print(
                    font,
                    10,
                    10,
                    {
                        text: quote.quote,
                        alignmentX: HORIZONTAL_ALIGN_CENTER,
                        alignmentY: VERTICAL_ALIGN_MIDDLE,
                    },
                    500,
                    500
                )
            })
    }
}

export {
    get_inspirational_background_json,
    get_image_url_from_id,
    crop_to_square,
    write_text
}