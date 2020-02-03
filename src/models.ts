import { connect, connection, Schema, model, set} from 'mongoose'

set('useNewUrlParser', true);
set('useFindAndModify', false);
set('useCreateIndex', true);
set('useUnifiedTopology', true);

import { database_string } from "./settings"
import { IQuote, ISession, IImage, IUser } from '..';

connect(database_string, { useNewUrlParser: true, useUnifiedTopology: true });
connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

const QuoteSchema: Schema = new Schema({
    author: String,
    quote: String,
    category: String,
    already_used: {type: Boolean, default: false},
    disabled: {type: Boolean, default: false}
})

const ImageSchema: Schema = new Schema({
    unsplash_id: String,
    already_used: {type: Boolean, default: false},
    disabled: {type: Boolean, default: false}
})

const session_data_keys = ["image_category", "quote_category", "unsplash_id", "image", "quote"]

const SessionSchema: Schema = new Schema({
    channel: String,
    last_updated: { type: Date, default: () => new Date()},
    session_data: {
        image_category: { type: String, default: "" },
        quote_category: { type: String, default: "" },
        unsplash_id: { type: String, default: "" },
        image: { type: Schema.Types.ObjectId, ref: 'ImageModel', default: null },
        quote: { type: Schema.Types.ObjectId, ref: 'QuoteModel', default: null },
    }
})

const UserSchema: Schema = new Schema({
    user_id: String,
    auth_level: {type: Number, default: 0}
})

const QuoteModel = model<IQuote>("QuoteModel", QuoteSchema)
const SessionModel = model<ISession>("SessionModel", SessionSchema)
const ImageModel = model<IImage>("ImageModel", ImageSchema)
const UserModel = model<IUser>("UserModel", UserSchema)

export {
    QuoteModel,
    ImageModel,
    SessionModel,
    UserModel,
    session_data_keys
}