import { ISession, IFact } from "../..";

import {createInterface} from "readline"
import {createReadStream} from "fs"
import { find_or_create } from "../utils";
import { FactModel } from "../models";
import { get_plaintext_blocks } from "../templates";
import { get_confirm_fact_blocks } from "./templates";
import { crop_to_square } from "../images";
import { write_fact_over_image } from "./images";

const create_fact_post = async (session: ISession, params: any, respond: (blocks: any) => void) => {
    const {fact_id} = params

    const fact = await FactModel.findById(fact_id)

    const image = await read(url)
    const cropped = await crop_to_square(image)
    const with_text = await write_fact_over_image(fact, cropped)
}

const load_facts = async (session: ISession, params: any, respond: (blocks: any) => void) => {
    createInterface({
        input: createReadStream('raw_data/facts.txt'),
        output: process.stdout
    }).on('line', (line) => {
        find_or_create(FactModel, {fact: line})
    }).on("close", () => {
        respond(get_plaintext_blocks("Facts Loaded into Database"))
    })
}

const get_random_fact = async (session: ISession, params: any, respond: (blocks: any) => void) => {
    const fact:IFact = await FactModel.aggregate([
        {$match: {
            already_used: false,
            disabled: false
        }},
        {$sample: { size: 1 }},
    ]).exec()[0]
    
    respond(get_confirm_fact_blocks(fact))
}

const disable_fact = async (session: ISession, params: any, respond: (blocks: any) => void) => {
    const {fact_id} = params

    const fact = await FactModel.findByIdAndUpdate(fact_id, {disabled: true})
    respond(get_plaintext_blocks(`Fact: '${fact.text}' disabled`))
}

export {
    load_facts,
    get_random_fact,
    disable_fact
}