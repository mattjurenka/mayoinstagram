import { join } from 'path'

const quote_categories = ["Business", "Happiness", "Money"]
const image_categories = ["Sunset", "Skyline", "Trees"]

const project_filepath = "C:/Users/MJ Programming/Desktop/mayo/mayoinstagram"

const quotes_filepath = join(project_filepath, "raw_data", "quotes.txt")
const images_folder = join(project_filepath, "images")
const fonts_folder = join(project_filepath, "fonts")

const port = Number(process.env.PORT || 3000)

const database_string = 'mongodb://127.0.0.1/data'

export {
    quote_categories,
    image_categories,
    project_filepath,
    quotes_filepath,
    port,
    database_string,
    images_folder,
    fonts_folder
}