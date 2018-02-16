#!/bin/sh
APP="pm2 start app.js"

if [ "$NETWORK" = "fabric" ]
then
    NGINX_PID="/var/run/nginx.pid"    # /   (root directory)
    NGINX_CONF="/etc/nginx/nginx.conf";
    echo fabric configuration set;
    nginx -c "$NGINX_CONF" -g "pid $NGINX_PID;"
fi

if [ "$DEV_MODE" = "true" ]
then
    APP="$APP --watch"
fi

npm install
$APP 

sleep 10
#APP gets rendered as PM2
APP=PM2
APP_PID=`ps aux | grep "$APP" | grep -v grep`

if [ "$NETWORK" = "fabric" ]
then
    while [ -f "$NGINX_PID" ] &&  [ "$APP_PID" ];
    do
	    sleep 5;
	    APP_PID=`ps aux | grep "$APP" | grep -v grep`;
    done
else
    while [ "$APP_PID" ];
    do
	    sleep 5;
	    APP_PID=`ps aux | grep "$APP" | grep -v grep`;
    done
fi