FROM node:9

RUN useradd --create-home -s /bin/bash uploader

ARG CONTAINER_ENGINE_ARG
ARG USE_NGINX_PLUS_ARG
ARG USE_VAULT_ARG
ARG USE_MTLS_ARG


# CONTAINER_ENGINE specifies the container engine to which the
# containers will be deployed. Valid values are:
# - kubernetes (default)
# - mesos
# - local
ENV USE_NGINX_PLUS=${USE_NGINX_PLUS_ARG:-true} \
    USE_VAULT=${USE_VAULT_ARG:-false} \
    CONTAINER_ENGINE=${CONTAINER_ENGINE_ARG:-kubernetes} \
	NETWORK=${NETWORK_ARG:-fabric} \
	USE_MTLS=${USE_MTLS_ARG:-false}


#Install Required packages
RUN apt-get update && apt-get install -y \
	jq \
	libffi-dev \
	libssl-dev \
	make \
	wget \
	vim \
	curl \
	apt-transport-https \
	ca-certificates \
	curl \
	librecode0 \
	libsqlite3-0 \
	libxml2 \
	lsb-release \
	unzip \
	--no-install-recommends && rm -r /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY ./app /usr/src/app/
COPY ./test /usr/src/test/
RUN yarn install && \
    yarn global add pm2 && \
    cd ../test && \
    yarn install

# Install nginx and forward request and error logs to docker log collector
ADD install-nginx.sh /usr/local/bin/
COPY nginx/ssl /etc/ssl/nginx/
COPY ./nginx/ /etc/nginx/
RUN /usr/local/bin/install-nginx.sh && \
    ln -sf /dev/stdout /var/log/nginx/access_log && \
	ln -sf /dev/stderr /var/log/nginx/error_log

EXPOSE 443 80 3000

CMD ["./start.sh"]
