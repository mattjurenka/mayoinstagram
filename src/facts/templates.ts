import { IFact, ISimpleInteractiveElement } from "../..";
import {get_mrkdwn_section, get_actions_section} from "../templates"

const get_confirm_fact_blocks = (fact: IFact) => {
    const button_elements: ISimpleInteractiveElement[] = [
        {
            text: "Use This Fact",
            command_obj: {
                command: 'create-fact-post',
                params: {
                    fact_id: fact._id
                }
            }
        },
        {
            text: "Disable Fact",
            command_obj: {
                command: 'disable-fact',
                params: {
                    fact_id: fact._id
                }
            }
        },
        {
            text: "Get Another Fact",
            command_obj: {
                command: 'get-random-fact',
                params: {}
            }
        },
    ]

    return `[
        ${get_mrkdwn_section(`Select an image for the fact: '${fact.text}'`)},
        ${get_actions_section(button_elements)}
    ]`
}

export {
    get_confirm_fact_blocks
}