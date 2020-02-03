import { Document } from "mongoose"

interface ISimpleInteractiveElement {
    text: string,
    command: string,
    params: string[]
}

interface IQuote extends Document {
    _id: string,
    already_used: boolean,
    disabled: boolean,
    quote: string,
    author: string,
    category: string
}

interface IImage extends Document {
    _id: string,
    unsplash_id: string,
    already_used: boolean,
    disabled: boolean
}

interface ISessionData {
    image_category?: string,
    quote_category?: string,
    unsplash_id?: string,
    image_id?: string,
    quote_id?: string,
}

interface ISession extends Document {
    _id: string,
    channel: string,
    last_updated: Date,
    session_data: ISessionData
}

interface IUser extends Document {
    user_id: string,
    auth_level: number
}

type FontSize = (64 | 56 | 48 | 32)

interface ICoordinate {
    x: number,
    y: number
}

type Action = ("button" | "overflow" | "message")