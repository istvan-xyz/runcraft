import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

const createSendEmailCommand = ({
    toAddresses,
    fromAddress,
    subject,
    body,
}: {
    toAddresses: string[];
    fromAddress: string;
    subject: string;
    body: string;
}): SendEmailCommand => {
    return new SendEmailCommand({
        Destination: {
            ToAddresses: toAddresses,
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: body,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject,
            },
        },
        Source: fromAddress,
    });
};

export const sendEmail = async ({
    from,
    to,
    subject,
    body,
}: {
    from: string;
    to: string[];
    subject: string;
    body: string;
}): Promise<void> => {
    const sesClient = new SESClient();

    const sendEmailCommand = createSendEmailCommand({ toAddresses: to, fromAddress: from, subject, body });

    // deno-lint-ignore no-explicit-any
    await sesClient.send(sendEmailCommand as any);
};
