import * as Sentry from '@sentry/deno';

const sentryDsn = Deno.env.get('SENTRY_DSN');

if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
    });
}
