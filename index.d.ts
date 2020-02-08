import { Document } from "mongoose"

interface ISimpleInteractiveElement {
    text: string,
    command_obj: {
        command: string,
        params: any
    }
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
    image?: string,
    quote?: string,
    fact?: string,
}

interface ISession extends Document {
    _id: string,
    channel: string,
    last_updated: Date,
    session_data: ISessionData
}

interface IUser extends Document {
    _id: string,
    user_id: string,
    auth_level: number
}

interface IFact extends Document {
    _id: string,
    text: string,
    disabled: boolean,
    already_used: boolean
}

type FontSize = (64 | 56 | 48 | 32)

interface ICoordinate {
    x: number,
    y: number
}

interface ICommandJSON {
    command: string,
    params: any
}

type Action = ("button" | "overflow" | "message")