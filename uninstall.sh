#!/bin/bash

# restore device configuration
echo -en 'AT+QNWCFG="csi_ctrl",0,0\r\n' | atcmd # disable acquisition of cqi/ri/mcs
echo -en 'AT+QSIMSTAT=0;+QSIMDET=0,1\r\n' | atcmd # disable sim hot-swap

# uninstall service
systemctl stop quecadmin
mount -o remount,rw /
rm /usr/bin/atcmd
rm /lib/systemd/system/multi-user.target.wants/quecadmin.service /lib/systemd/system/quecadmin.service
systemctl daemon-reload
mount -o remount,ro /

# remove setuid from atcmd
chmod u-s $(pwd)/bin/atcmd
