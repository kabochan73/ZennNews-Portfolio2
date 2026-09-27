FROM dunglas/frankenphp:1-php8.4 AS base

RUN install-php-extensions \
    pdo_pgsql \
    intl \
    zip \
    opcache \
    pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# The image's built-in check calls Caddy's admin endpoint, which `php-server` does not
# serve, so the container always showed "unhealthy". Railway checks /up instead.
HEALTHCHECK NONE

WORKDIR /app

# Development: source code is bind-mounted, so dependencies are installed at startup.
FROM base AS dev

EXPOSE 8000

CMD ["sh", "-c", "composer install --no-interaction && frankenphp php-server --listen :8000 --root public/"]

# Production (Railway): the API server, and the cron service with its own start command.
FROM base AS prod

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

# Dependencies first, so this layer stays cached while only the code changes.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist --no-scripts --no-autoloader

COPY . .
RUN composer dump-autoload --no-dev --optimize \
    && useradd --no-create-home app \
    && chown -R app:app storage bootstrap/cache /config/caddy /data/caddy

USER app

EXPOSE 8000

# Caches are built at startup because they read the environment variables set on Railway.
CMD ["sh", "-c", "php artisan optimize && exec frankenphp php-server --listen :${PORT:-8000} --root public/"]
