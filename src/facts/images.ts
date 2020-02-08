import { IFact } from "../..";
import Jimp = require("jimp/*");
import { fact_defaults } from "../settings";
import { loadFont } from "jimp/*";
import { get_font_filepath } from "../utils";
import { measure_text_height, overlay_black_box } from "../images";

const write_fact_over_image = async (fact:IFact, image: Jimp) => {
    const text = fact.text
    const width = image.bitmap.width

    const total_box_padding = width * 2 * fact_defaults.fact_box_padding
    const fact_box_width = width * (1 - total_box_padding)
    const fact_text_width = fact_box_width * (1 - total_box_padding)
    
    const font = await loadFont(get_font_filepath("merriweather", 48))
    
    const fact_text_height = await measure_text_height(font, text, fact_text_width)
    const fact_vertical_padding = fact_box_width - fact_text_width
    const fact_box_height = fact_text_height + fact_vertical_padding

    const fact_box_top_left = {
        x: width * fact_defaults.fact_box_padding,
        y: (1/2) * (width - fact_box_height)
    }
    const fact_box_bottom_right = {
        x: width * (1 - fact_defaults.fact_box_padding),
        y: fact_box_top_left.y + fact_box_height
    }

    const with_fact_box = await overlay_black_box(image, fact_box_top_left, fact_box_bottom_right)

    const fact_text_top_left = {
        x: fact_box_top_left.x + fact_box_width * fact_defaults.fact_box_padding,
        y: fact_box_top_left.y + fact_vertical_padding / 2
    }

    return with_fact_box.print(
        font,
        fact_text_top_left.x,
        fact_text_top_left.y,
        {
            text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
        },
        fact_text_width
    )
}

export {
    write_fact_over_image
}