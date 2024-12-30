import { debounce } from '@std/async/debounce';
import type { DataSource } from 'typeorm';
import { TaskRun } from './entities/TaskRun.ts';
import { format, instrument, log } from './log.ts';
import { sendEmail } from './notification/aws_ses.ts';
import { sendMattermostMessage } from './notification/mattermost.ts';

export type TaskRunnerContext = { log: typeof log; db: DataSource };

type TaskDefinition<Context extends TaskRunnerContext> = {
    name: string;
    task: (context: Context) => Promise<void>;
    schedule: string;
};

const EMAIL_NOTIFICATION_FROM = Deno.env.get('EMAIL_NOTIFICATION_FROM');
const EMAIL_NOTIFICATION_TO = Deno.env.get('EMAIL_NOTIFICATION_TO')?.split(',');
const MATTERMOST_WEBHOOK_URL = Deno.env.get('MATTERMOST_WEBHOOK_URL');
const MATTERMOST_WEBHOOK_CHANNEL = Deno.env.get('MATTERMOST_WEBHOOK_CHANNEL');
const MATTERMOST_WEBHOOK_USERNAME = Deno.env.get('MATTERMOST_WEBHOOK_USERNAME');

export const createTaskRun =
    <Context extends TaskRunnerContext>(
        context: Context,
        { name, task: taskFn }: TaskDefinition<Context>,
    ): (() => void) =>
    () => {
        const { db } = context;

        const taskRunRepository = db.getRepository(TaskRun);
        const task = new TaskRun();
        task.logs = [];
        task.type = name;
        task.start = new Date();

        (async () => {
            log({ name: `Creating task "${task.type}"` });

            await taskRunRepository.save(task);

            const updateTask = debounce(() => {
                taskRunRepository.save(task).catch((error) => {
                    throw error;
                });
            }, 500);

            await instrument(
                { target: task.type },
                taskFn,
            )({
                ...context,
                log: (event) => {
                    const line = format(event);
                    task.logs.push(event);
                    console.log(line);
                    updateTask();
                },
            });

            task.end = new Date();
            task.status = 'complete';
            await taskRunRepository.save(task);
        })().catch((error) => {
            const errorMessage = `Task #${task.id} errored "${task.type}": ${error} ${error.stack}`;
            log({ name: errorMessage });

            if (EMAIL_NOTIFICATION_FROM && EMAIL_NOTIFICATION_TO) {
                sendEmail({
                    to: EMAIL_NOTIFICATION_TO,
                    from: EMAIL_NOTIFICATION_FROM,
                    subject: `Task #${task.id} errored "${task.type}": ${error} ${error.stack}`,
                    body: errorMessage,
                }).catch((error) => {
                    throw error;
                });
            } else {
                log({
                    name: 'send_email_disabled',
                });
            }

            if (MATTERMOST_WEBHOOK_URL) {
                sendMattermostMessage({
                    message: errorMessage,
                    channel: MATTERMOST_WEBHOOK_CHANNEL,
                    username: MATTERMOST_WEBHOOK_USERNAME,
                }).catch((error) => {
                    throw error;
                });
            } else {
                log({
                    name: 'mattermost_message_disabled',
                });
            }

            if (task) {
                task.end = new Date();
                task.status = 'error';
                task.error = `${error} ${error.stack}`;

                taskRunRepository.save(task).catch((error) => {
                    throw error;
                });
            } else {
                throw error;
            }
        });
    };

export const registerTasks = <Context extends TaskRunnerContext>(
    context: Context,
    definitions: TaskDefinition<Context>[],
): void => {
    for (const task of definitions) {
        log({
            name: 'register_task',
            task: name,
            schedule: task.schedule,
        });
        Deno.cron(task.name, task.schedule, createTaskRun(context, task));
    }
};
