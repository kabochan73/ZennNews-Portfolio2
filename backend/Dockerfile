FROM dunglas/frankenphp:1-php8.4 AS base

RUN install-php-extensions \
    pdo_pgsql \
    intl \
    zip \
    opcache \
    pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Development: source code is bind-mounted, so dependencies are installed at startup.
FROM base AS dev

EXPOSE 8000

CMD ["sh", "-c", "composer install --no-interaction && frankenphp php-server --listen :8000 --root public/"]
