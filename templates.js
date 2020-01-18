const option_template = (option) => {
    const [text, value] = option
    return `{
        "text": {
            "type": "plain_text",
            "text": "${text}",
            "emoji": true
        },
        "value": "get-quotes: ${value}"
    }`
}


const get_pick_quote_blocks = (quote_options) => {
    const option_strings = quote_options.map(option_template)

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

const generate_quote_section = (quote_instance) => {
    const {quote, _id, author} = quote_instance
    return `{
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "'${quote.replace(/\.$/, "")}' - ${author}"
        },
        "accessory": {
            "type": "overflow",
            "options": [
                {
                    "text": {
                        "type": "plain_text",
                        "text": "Choose Quote",
                        "emoji": true
                    },
                    "value": "choose-quote: ${_id}"
                },
                {
                    "text": {
                        "type": "plain_text",
                        "text": "Disable Quote",
                        "emoji": true
                    },
                    "value": "disable-quote: ${_id}"
                },
                {
                    "text": {
                        "type": "plain_text",
                        "text": "Disable All Quotes by Author",
                        "emoji": true
                    },
                    "value": "disable-author: ${_id}"
                }
            ]
        }
    }`
}

const generate_pick_quote_section = (quotes, category) => {
    const quote_sections = quotes.map(generate_quote_section)
    return `[
        {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Here are ${quotes.length} quotes to choose from the category ${category}:"
			}
        },
        ${quote_sections.join(",")},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Refresh Quotes",
						"emoji": true
					},
					"value": "get-quotes: ${category}"
				}
			]
        }
    ]`
}

module.exports = {
    get_pick_quote_blocks,
    generate_pick_quote_section
}