#!/bin/sh
NGINX_PID="/var/run/nginx.pid"    # /   (root directory)
APP="pm2 start app.js"

NGINX_CONF="/etc/nginx/nginx.conf";

if [ "$NETWORK" = "fabric" ]
then
    echo fabric configuration set;
fi

if [ "$DEV_MODE" = "true" ]
then
    APP="$APP --watch"
fi

npm install
$APP 

nginx -c "$NGINX_CONF" -g "pid $NGINX_PID;"

sleep 10
#APP gets rendered as PM2
APP=PM2
APP_PID=`ps aux | grep "$APP" | grep -v grep`

while [ -f "$NGINX_PID" ] &&  [ "$APP_PID" ];
do 
	sleep 5;
	APP_PID=`ps aux | grep "$APP" | grep -v grep`;
done
