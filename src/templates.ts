import { capitalize } from "lodash"
import { ISimpleInteractiveElement, IQuote, IImage } from ".."

const option_template = (simple_element: ISimpleInteractiveElement): string => {
    return `{
        "text": {
            "type": "plain_text",
            "text": "${simple_element.text}",
            "emoji": true
        },
        "value": "${JSON.stringify(simple_element.command_obj)}"
    }`
}

const get_category_selection_blocks = (categories: string[]): string => {
    const simple_elements = categories.map((category) => {
        return {
            text: capitalize(category),
            command_obj: {
                command: "get-quotes",
                params: {
                    category: category.toLowerCase()
                }
            }
        }
    })
    const option_strings = simple_elements.map(option_template)
    return `[{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Pick a quote category"
        },
        "accessory": {
            "type": "overflow",
            "options": [
                ${option_strings.join(",")}
            ]
        }
    }]`
}

const get_image_category_selection_blocks = (categories: string[], quote: IQuote): string => {
    const simple_elements = categories.map((category) => {
        return {
            text: capitalize(category),
            command_obj: {
                command: "confirm-image",
                params: {
                    category
                }
            }
        }
    })
    const option_strings = simple_elements.map(option_template)
    return `[{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Pick an image category for quote '${quote.quote}'"
        },
        "accessory": {
            "type": "overflow",
            "options": [
                ${option_strings.join(",")}
            ]
        }
    }]`
}

const get_quote_section = (quote: IQuote): string => {
    const overflow_elements: ISimpleInteractiveElement[] = [
        {
            text: "Choose Quote",
            command_obj: {
                command: 'select-image-category',
                params: {
                    quote_id: quote._id
                }
            }
        },
        {
            text: "Disable Quote",
            command_obj: {
                command: 'disable-quote',
                params: {
                    quote_id: quote._id
                }
            }
        },
        {
            text: "Disable All Quotes by Author",
            command_obj: {
                command: 'disable-author',
                params: {
                    quote_id: quote._id
                }
            }
        }
    ]
    const option_strings = overflow_elements.map(option_template)
    return `{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "'${quote.quote.replace(/\.$/, "")}' - ${quote.author}"
        },
        "accessory": {
            "type": "overflow",
            "options": [
                ${option_strings.join(",")}
            ]
        }
    }`
}



const get_button_section = (button_element: ISimpleInteractiveElement): string => {
    return `{
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "${button_element.text}",
            "emoji": true
        },
        "value": "${JSON.stringify(button_element.command_obj)}"
    }`
}

const get_mrkdwn_section = (text: string): string => {
    return `{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "${text}"
        }
    }`
}

const get_actions_section = (button_elements: ISimpleInteractiveElement[]) => {
    const button_sections = button_elements.map(get_button_section)
    return `{
        "type": "actions",
        "elements": [
            ${button_sections.join(",")}
        ]
    }`
}

const get_image_section = (url: string, title: string): string => {
    return `{
        "type": "image",
        "title": {
            "type": "plain_text",
            "text": "${title}",
            "emoji": true
        },
        "image_url": "${url}",
        "alt_text": "${title}"
    }`
}

const get_pick_quote_section = (quotes: IQuote[], category: string): string => {
    const quote_sections = quotes.map(get_quote_section)
    const action_buttons: ISimpleInteractiveElement[] = [{
        text: "Refresh Quotes",
        command_obj: {
            command: 'get-quotes',
            params: {},
        }
    }]
    return `[
        ${get_mrkdwn_section(`Here are ${quotes.length} quotes to choose from the category ${category}:`)}\,
        ${quote_sections.join(",")},
		${get_actions_section(action_buttons)}
    ]`
}

const get_confirm_background_blocks = (quote: IQuote, image_data: any, image: IImage): string => {
    const image_url = image_data.urls.small
    const full_name = `${image_data.user.first_name} ${image_data.user.last_name}`
    const image_id = image_data.id

    const button_elements: ISimpleInteractiveElement[] = [
        {
            text: "Use This Image",
            command_obj: {
                command: 'create-post',
                params: {
                    image_id: image._id
                }
            }
        },
        {
            text: "Disable Image",
            command_obj: {
                command: 'disable-image',
                params: {
                    image_id: image._id
                }
            }
        },
        {
            text: "Get Another Image",
            command_obj: {
                command: 'refresh-image',
                params: {}
            }
        },
    ]

    return `[
        ${get_mrkdwn_section(`Select an image for the quote: '${quote.quote}'`)},
        ${get_mrkdwn_section(`Photo will be attributed to: ${full_name}`)},
        ${get_image_section(image_url, image_id)},
        ${get_actions_section(button_elements)}
    ]`
}

const get_plaintext_blocks = (text: string): string => {
    return `[{
        "type": "section",
        "text": {
            "type": "plain_text",
            "text": "${text}",
            "emoji": true
        }
    }]`
}

export {
    get_category_selection_blocks,
    get_pick_quote_section,
    get_confirm_background_blocks,
    get_image_category_selection_blocks,
    get_plaintext_blocks,
    get_mrkdwn_section,
    get_actions_section
}