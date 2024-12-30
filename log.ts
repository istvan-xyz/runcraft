// deno-lint-ignore no-explicit-any
const createCircularReplacer = (): any => {
    const seen = new WeakSet();
    return (_key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

export interface LogEvent {
    name: string;
    [key: string]: unknown;
}

export const format = (event: LogEvent): string =>
    JSON.stringify({ ...event, time: new Date().toISOString() }, createCircularReplacer());

const log = (event: LogEvent) => {
    console.log(format(event));
};

const isPromise = (value: unknown): value is Promise<unknown> => {
    const { then } = value as { then?: unknown };

    if (!then) {
        return false;
    }

    return typeof then === 'function';
};

// deno-lint-ignore no-explicit-any
export const instrument = <F extends (...args: any[]) => any>(
    logEvent: Record<string, unknown>,
    fn: F,
): ((...args: Parameters<F>) => ReturnType<F>) => {
    return (...args: Parameters<F>): ReturnType<F> => {
        const startTime = Date.now();
        log({
            name: 'start',
            ...logEvent,
        });

        try {
            const result = fn(...args);

            if (isPromise(result)) {
                return result.then((value) => {
                    log({
                        name: 'end',
                        ...logEvent,
                        duration: (Date.now() - startTime) / 1000,
                    });
                    return value;
                }) as unknown as ReturnType<F>;
            } else {
                log({
                    name: 'end',
                    ...logEvent,
                    duration: (Date.now() - startTime) / 1000,
                });
            }

            return result;
        } catch (error) {
            log({
                name: 'error',
                error: `${error}`,
                ...logEvent,
            });
            throw error;
        }
    };
};
