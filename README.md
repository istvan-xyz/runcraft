# RunCraft

RunCraft is a powerful and intuitive task runner for the Deno ecosystem. It allows you to define, organize, and execute tasks with ease, making project automation a breeze.

## Logging

Logging is structured with `name` being the only mandatory field.

```ts
import { log } from '@istvan/runcraft/log';

log({
    name: 'My log',
    otherField: 5,
});
```
