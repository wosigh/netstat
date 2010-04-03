all: sync clean

sync:
	cp -PRp ../Netstat-Service/DEBIAN/* control/
	cp -PRp ../Netstat-Service/usr .
	cp -PRp ../Netstat-Service/etc/event.d/org* upstart/


clean:
	find . -name "*~" -exec rm {} \;
