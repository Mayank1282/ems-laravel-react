# Pure PHP API image — PHP 8.4, no npm/Vite. Bypasses Nixpacks/Railpack.
FROM php:8.4-cli

# System deps + PHP extensions Laravel needs.
RUN apt-get update && apt-get install -y \
        git unzip libzip-dev libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath \
    && rm -rf /var/lib/apt/lists/*

# Composer.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist \
    && php artisan storage:link || true

# Railway provides $PORT.
CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host 0.0.0.0 --port ${PORT:-8000}
