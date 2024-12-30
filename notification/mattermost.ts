export async function sendMattermostMessage({
    message,
    channel,
    username,
    iconUrl,
}: {
    message: string;
    channel?: string;
    username?: string;
    iconUrl?: string;
}): Promise<Response> {
    const webhookUrl = Deno.env.get('MATTERMOST_WEBHOOK_URL');

    if (!webhookUrl) {
        throw new Error(`MATTERMOST_WEBHOOK_URL is required.`);
    }

    const payload = {
        channel,
        text: message,
        username,
        icon_url: iconUrl,
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
}
