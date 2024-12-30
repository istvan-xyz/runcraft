# RunCraft

RunCraft is a powerful and intuitive task runner for the Deno ecosystem. It allows you to define, organize, and execute tasks with ease, making project automation a breeze.

This library aims to be as lightweight as possible with minimal dependencies and steps taken to avoid making you pay for code that you don't use.

## Logging

Logging is structured with `name` being the only mandatory field.

```ts
import { log } from '@istvan/runcraft/log';

log({
    name: 'My log',
    otherField: 5,
});
```

## Notification

Tasks need to be able to send notifications for various important events like failures, the following notification methods are supported.

### AWS SES

The `AWS_REGION` and `AWS_PROFILE` are required to be configured for this method to work.

```ts
import { sendEmail } from '@istvan/runcraft/notification/aws_ses';

sendEmail({
    from: 'test@example.com',
    to: ['test2@example.com'],
    subject: 'test',
    body: 'test body',
});
```
