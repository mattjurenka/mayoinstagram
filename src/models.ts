import { connect, connection, Schema, model, Types } from 'mongoose'

import { database_string } from "./settings"

connect(database_string, { useNewUrlParser: true, useUnifiedTopology: true });
connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

const QuoteSchema: Schema = new Schema({
    author: String,
    quote: String,
    category: String,
    already_used: {type: Boolean, default: false},
    disabled: {type: Boolean, default: false}
})

interface IQuote extends Document {
    _id: string,
    already_used: boolean,
    disabled: boolean,
    quote: string,
    author: string,
    category: string
}

const QuoteModel = model("QuoteModel", QuoteSchema)

const ImageSchema: Schema = new Schema({
    unsplash_id: String,
    already_used: {type: Boolean, default: false},
    disabled: {type: Boolean, default: false}
})

interface IImage extends Document {
    _id: string,
    unsplash_id: string,
    already_used: boolean,
    disabled: boolean
}

const ImageModel = model("ImageModel", ImageSchema)


export {
    QuoteModel,
    ImageModel,
    IQuote,
    IImage,
}