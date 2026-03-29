FROM php:8.2-cli

WORKDIR /var/www/html

COPY . /var/www/html
COPY docker/start-server.sh /usr/local/bin/start-server.sh

RUN sed -i 's/\r$//' /usr/local/bin/start-server.sh \
    && chmod +x /usr/local/bin/start-server.sh

EXPOSE 10000

CMD ["sh", "/usr/local/bin/start-server.sh"]
