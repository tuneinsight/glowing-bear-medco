FROM node:16 as dev

# build time env
ENV GB_SRC="/glowing-bear-src"

VOLUME $GB_SRC
EXPOSE 4300
WORKDIR $GB_SRC
ENTRYPOINT  npm install && \
            cp node_modules/@tuneinsight/geco-cryptolib/geco-cryptolib.wasm src/assets/ && \
            exec npm start -- --port 4300 --host 0.0.0.0


# -------------------------------------------
FROM node:16 as build

# build time env
ENV GB_SRC="/glowing-bear-src" \
    GB_DIST="/glowing-bear-dist"

COPY . $GB_SRC
RUN --mount=type=secret,id=TI_ACCESS_TOKEN export TI_ACCESS_TOKEN=$(cat /run/secrets/TI_ACCESS_TOKEN) && \
    cd $GB_SRC && \
    npm install && \
    cp node_modules/@tuneinsight/geco-cryptolib/geco-cryptolib.wasm src/assets/ && \
    npm run package && \
    mv $GB_SRC/dist $GB_DIST

# Remove unecessary files from the build
RUN rm -rf $GB_DIST/*.map
RUN rm -rf $GB_DIST/assets/icons/psd/*.psd

# -------------------------------------------
FROM nginx:1.23.0-alpine as release

RUN apk add bash

# build time env
ENV GB_DIST="/glowing-bear-dist" \
    NGINX_ROOT="/usr/share/nginx/html"

COPY --from=build --chown=www-data:www-data $GB_DIST $NGINX_ROOT/glowing-bear
COPY deployment/write-gb-config.sh /
RUN chmod +x /write-gb-config.sh

# run-time env
ENV GB_MEDCO_NODE_URL="http://localhost:3100" \
    GB_KEYCLOAK_URL="http://localhost:8080/auth" \
    GB_KEYCLOAK_REALM="ti-realm" \
    GB_KEYCLOAK_CLIENT_ID="glowing-bear" \
    GB_FOOTER_TEXT=""

ENTRYPOINT /bin/bash -c "/write-gb-config.sh && exec nginx -g 'daemon off;'"
