function HistoryAssistant(history) {
    try {
	this.history = history;
	this.space   = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	this.dbdirvar   = "/media/internal/.app-storage/file_.var.usr.palm.applications.org.daemon.de.netstat_0/";
	this.dbdircrypt = "/media/internal/.app-storage/file_.media.cryptofs.apps.usr.palm.applications.org.daemon.de.netstat_0/";
    } catch (err) {
        Mojo.Log.error("HistoryAssistant()", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.setup = function() {
    try {
	/*
         * this.history contains:
         * Image:       Interface Logo
         * Traffic:     Current Traffic
         * Interface:   Widget Name (eg wifigraph)
         * IsInterface: false if "lastupdate" item, else true
         */
	
	/* traffic list */
	this.listAttributes = { 
            itemTemplate:     "history/itemTemplate",
            listTemplate:     "history/listTemplate",
            swipeToDelete:    false,
            fixedHeightItems: true,
            reorderable:      false
	};
	this.listModel = {
            listTitle: $L("Traffic"),
	    items: []
	}
	this.controller.setupWidget('TrafficList', this.listAttributes, this.listModel);

	new Ajax.Request(this.dbdircrypt + "aggregate-" + this.history.Interface + ".json", {
	    requestHeaders: {Accept: 'application/json'},
	    method:     'get',
	    onComplete: {},
	    onSuccess:  this.DisplayHistory.bind(this),
	    onFailure:  this.ReadHistoryVar.bind(this)
	});
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.setup", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.ReadHistoryVar = function() {
    try {
	new Ajax.Request(this.dbdirvar + "aggregate-" + this.history.Interface + ".json", {
	    requestHeaders: {Accept: 'application/json'},
	    method:     'get',
	    onComplete: {},
	    onSuccess:  this.DisplayHistory.bind(this),
	    onFailure:  this.FailedToReadHistory.bind(this)
	});
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.ReadHistoryVar", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.DisplayHistory = function(transport) {
    try {
	/* patch by cmusik, no json output, croak */
	if (transport.responseText === "") {
            this.ReadHistoryVar();
            return;
        }

	var json  = transport.responseText.evalJSON(true);
	var items = new Array();
	for (var i=0; i<json.count; i++) {
	    items.push(
		{
		    "Traffic": json.items[i].bytes,
		    "Date":    json.items[i].date
		}
	    );
	}
	this.listModel.items = items;
        this.controller.modelChanged(this.listModel);

	this.controller.get('title').innerHTML = this.space + "Traffic History " + json.ifname;
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.DisplayHistory", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.FailedToReadHistory = function() {
    try {
	var items = new Array();
	items.push(
	    {
		"Traffic": "No traffic history yet",
		"Date":    ''
	    }
	);
	this.listModel.items = items;
        this.controller.modelChanged(this.listModel);
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.FailedToReadHistory", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.activate = function(event) {
}


HistoryAssistant.prototype.deactivate = function(event) {
}

HistoryAssistant.prototype.cleanup = function(event) {
}
