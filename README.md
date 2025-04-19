# QuecAdmin

Simple web interface for managaging Qualcomm-based Quectel modules running in router/gateway mode.
This project is heavily based on SimpleAdmin 2.0 from [quectel-rgmii-toolkit](https://github.com/iamromulan/quectel-rgmii-toolkit/tree/SDXLEMUR).

Currently supported platforms:
- SDXLEMUR

## Installation

### Initial setup
To use module with PHY, we need to perform some basic configuration:
```
> AT+QCFG="data_interface",0,0
OK

> AT+QETH="eth_driver","r8125",1
OK

> AT+QCFG="pcie/mode",1
OK

> AT+QCFG="usbnet",1
OK

> AT+QMAPWAC=1
OK

> AT+CFUN=1,1
OK
```

### Unlocking Secure Debugging
Modules with newer firmware versions can additionally benefit from Secure Debugging. This functionality can create persistent password that will be required to authorize future changes to certain debugging functions, ADB access including. If your module was previous locked in this way, follow these steps to authorize debugging session:

```
> AT+QSECCFG="dbg_pwd"
+QSECCFG: "dbg_pwd",1,0

OK

> AT+QSECCFG="dbg_pwd",3,"<password>"
OK

> AT+QSECCFG="dbg_pwd"
+QSECCFG: "dbg_pwd",1,1

OK
```

### Enabling ADB
To install QuecAdmin, ADB access to module's AP (Application Processor) must be enabled. We'll rely on it to upload new files and start web server. Enablement is a two-step process. First step authorizes user by presenting challenge that should be sent to your local Quectel FAE. Valid response to this challenge creates persistent file `/data/.adb_enable` and allows second step to be executed. Second step requires user to probe module's current USB composition configuration by `AT+QCFG="usbcfg"`. The response to this command takes format of `<vid>,<pid>,<diag>,<nmea>,<at>,<modem>,<net>,<adb>,<uac>`. To enable ADB access, sixth parameter is changed from `0` to `1`.

#### Legacy method
This is method that was applicable before introduction of Secure Debugging and might still be present on some firmware revisions. It uses simple SHA1 over module serial number alongside pepper to generate authorization challenge.

```
> AT+QADBKEY?
+QADBKEY: 12345678

OK

> AT+QADBKEY="0jXKXQwSwMxYoeg"
OK

> AT+QCFG="usbcfg"
+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,0,0

OK

> AT+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,1,0
OK

> AT+CFUN=1,1
OK
```

#### New method
This is new method present since introduction of Secure Debugging. It creates 16-byte authorization key by probing `/dev/urandom` and encrypting it with 2048-bit RSA public key.

```
> AT+QSECCFG="adb_auth"
+QSECCFG: "adb_auth","OhcwQYud+/1inxRvlzErGxV1+HXUH7c0TAxzpl7W5y6RdlV1bLXbxIZtUa
cX3S1ugEMQeY1umpD3KtuyycJJrhd7sqvTk6E19/7y33VekYzQ3EnpHavtz+Pd3huK3VeV6dc38OR
aSNRYRXrz7T/juHkNYDpZHqv8KyF1wkxHmnsG8sFTC+db4kjJYKoYycutfWXEIZobQOrCFve3cMI
mIsNgEgsaU6U7LFfOeVezLEGOSXFVU5wWgMargcje/cBDgyDO2EIr6Oy6cO+283sGYx0+uvuNmP
sompvRZ6XoP0TF+Gsty2zErcsCTSSKlpPWE7lEAsHx9efYS0XTxSpZvg=="

OK

> AT+QSECCFG="adb_auth","056c9c994197ee33"
OK

> AT+QCFG="usbcfg"
+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,0,0

OK

> AT+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,1,0
OK

> AT+CFUN=1,1
OK
```

### Copying files
Before proceeding, ensure you have ADB utility and drivers enabled. Navigate to directory you downloaded release files and execute commands as follows:
```
user@workstation:~$ adb push sdxlemur.tar.gz /usrdata
user@workstation:~$ adb shell
root@sdxlemur:/# cd /usrdata
root@sdxlemur:/usrdata# tar -xzvf sdxlemur.tar.gz
root@sdxlemur:/usrdata# cd quecadmin
root@sdxlemur:/usrdata/quecadmin# ./install.sh
root@sdxlemur:/usrdata/quecadmin# sync; reboot
```

After module comes back online, navigate to `http://192.168.225.1` to begin your journey. Remember to visit Settings page and set your Network Mode to desired value.

## Changing password
QuecAdmin comes with no password protection by default. To configure password simply drop into ADB shell, navigate to `/usrdata/quecadmin` and execute `./passwd.sh`. Username is always `admin`.
Login happens over HTTP Basic Authorization and should **not** be relied upon for remote access, as it can be easily sniffed due to lack of TLS support on BusyBox built-in web server.

Example:
```
user@workstation:~$ adb shell
root@sdxlemur:/# cd /usrdata/quecadmin
root@sdxlemur:/usrdata/quecadmin# ./passwd.sh
New password: <hidden>
root@sdxlemur:/usrdata/quecadmin#
```


## Removal

### Uninstallation
Drop into ADB shell and execute `./uninstall.sh` script.

Example:
```
user@workstation:~$ adb shell
root@sdxlemur:/# cd /usrdata/quecadmin
root@sdxlemur:/usrdata/quecadmin# ./uninstall.sh
root@sdxlemur:/usrdata/quecadmin# cd /
root@sdxlemur:/# rm -rf /usrdata/quecadmin
```

### Disabling ADB
Additionally, if user wishes to return modem to stock state, they should ensure ABD port is removed from USB composition by reversing changes made to `AT+QCFG="usbcfg"` configuration during installation (sixth parameter is changed from `1` to `0`), as well as remove persistent file `/data/.adb_enable`.

```
user@workstation:~$ adb shell
root@sdxlemur:/# echo -en 'AT+QCFG="usbcfg"\r\n' | atcmd
AT+QCFG="usbcfg"

+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,1,0
OK
root@sdxlemur:/# echo -en 'AT+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,1,0\r\n' | atcmd
AT+QCFG="usbcfg",0x2C7C,0x0801,1,1,1,1,1,0,0

OK
root@sdxlemur:/# rm /data/.adb_enable; sync
root@sdxlemur:/# reboot
```

### Locking Secure Debugging
Modules with newer firmware versions can additionally benefit from Secure Debugging. This functionality can create persistent password that will be required to authorize future changes to certain debugging functions, ADB access including. Following example demonstrates how to create new password and de-authorize debugging actions:

```
> AT+QSECCFG="dbg_pwd"
+QSECCFG: "dbg_pwd",0,0

OK

> AT+QSECCFG="dbg_pwd",1,"","<password>"
OK

> AT+QSECCFG="dbg_pwd"
+QSECCFG: "dbg_pwd",1,0

OK

> AT+QSECCFG="dbg_pwd",3,"<password>"
OK
```

Please note that password may not be longer than 8 characters.