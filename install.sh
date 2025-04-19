#!/bin/bash

# adjust permissions
chown -R root:root $(pwd)
find $(pwd) -type f -exec chmod 755 {} \;
find $(pwd) -type f -exec chmod 644 {} \;
find $(pwd) -type f -name "*.sh" -exec chmod +x {} \;
find $(pwd)/www/cgi-bin -type f -exec chmod +x {} \;
chmod +x,u+s $(pwd)/bin/atcmd

# install service
mount -o remount,rw /
ln -s $(pwd)/bin/atcmd /usr/bin
cp systemd/quecadmin.service /lib/systemd/system
ln -sf /lib/systemd/system/quecadmin.service /lib/systemd/system/multi-user.target.wants
systemctl daemon-reload
mount -o remount,ro /
systemctl start quecadmin

# reconfigure device
echo -en 'AT+QNWCFG="csi_ctrl",1,1\r\n' | atcmd # enable acquisition of cqi/ri/mcs
echo -en 'AT+QNWCFG="dis_rplmnact",1\r\n' | atcmd # prefer efs rat_acq_order over nv rplmnact
echo -en 'AT+QNWCFG="thin_ui_cfg",1\r\n' | atcmd # ensure modem is online after power-up
echo -en 'AT+QSIMSTAT=1;+QSIMDET=1,1\r\n' | atcmd # enable sim hot-swap
