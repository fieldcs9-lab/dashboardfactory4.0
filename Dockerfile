FROM php:8.2-apache

WORKDIR /var/www/html

COPY . /var/www/html
COPY docker/start-apache.sh /usr/local/bin/start-apache.sh

RUN sed -i 's/\r$//' /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

EXPOSE 10000

CMD ["sh", "/usr/local/bin/start-apache.sh"]
