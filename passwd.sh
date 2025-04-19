#!/bin/bash

read -s -p "New password: " password
echo "/:admin:$(httpd -m $password)" > www/httpd.conf; echo -e
systemctl restart quecadmin
