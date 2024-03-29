import { join } from 'path'

const quote_categories = ["Business", "Happiness", "Money"]
const image_categories = ["Sunset", "Skyline", "Trees"]

const project_filepath = "../"

const quotes_filepath = join(project_filepath, "raw_data", "quotes.txt")
const images_folder = join(project_filepath, "images")
const fonts_folder = join(project_filepath, "fonts")

//Default: 30 mins. Format: (hours * s per hr * ms per s)
const session_timeout_ms = 0.5 * 3600 * 1000

const port = 3000

const max_image_size = 1080

const database_string = 'mongodb://127.0.0.1/data'

const default_admins = [""]

const quote_defaults = {
    padding: 1/8,
    black_box_padding: 1/16,
    quote_author_padding: 1/16,
    author_box_padding: 1/16,
}

const fact_defaults = {
    padding: 1/8,
    fact_box_padding: 1/16
}

export {
    quote_categories,
    image_categories,
    project_filepath,
    quotes_filepath,
    port,
    database_string,
    images_folder,
    fonts_folder,
    max_image_size,
    session_timeout_ms,
    default_admins,
    quote_defaults,
    fact_defaults
}
