#!/bin/sh
NGINX_PID="/var/run/nginx.pid"    # /   (root directory)
NGINX_CONF=""
APP="pm2 start app.js"

npm install

if [ "$DEV_MODE" = "true" ]
then
    APP="pm2 start app.js --watch"
fi

su uploader -c "$APP" &

sleep 10
#APP gets rendered as PM2
APP=PM2
APP_PID=`ps aux | grep "$APP" | grep -v grep`

case "$NETWORK" in
    fabric)
        NGINX_CONF="/etc/nginx/fabric_nginx_$CONTAINER_ENGINE.conf"
        echo 'Fabric configuration set'
        nginx -c "$NGINX_CONF" -g "pid $NGINX_PID;" &

        sleep 20
        while [ -f "$NGINX_PID" ] &&  [ "$APP_PID" ];
        do
	        sleep 5;
	        APP_PID=`ps aux | grep "$APP" | grep -v grep`;
        done
        ;;
    router-mesh)
        while [ "$APP_PID" ];
        do
	        sleep 5;
	        APP_PID=`ps aux | grep "$APP" | grep -v grep`;
        done
        ;;
    *)
        echo 'Network not supported'
        exit 1
esac
