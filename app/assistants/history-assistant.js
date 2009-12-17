function HistoryAssistant(history) {
    try {
	this.history = history;
	this.space   = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	this.dbdir   = "/media/internal/.app-storage/file_.var.usr.palm.applications.org.daemon.de.netstat_0/";
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
         * Ifname:      Interface Name (eg eth0)
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
	this.controller.get('title').innerHTML = this.space + "Traffic History " + this.history.Ifname;

	new Ajax.Request(this.dbdir + "aggregate-" + this.history.Ifname + ".json", {
	    requestHeaders: {Accept: 'application/json'},
	    method:     'get',
	    onComplete: {},
	    onSuccess:  this.DisplayHistory.bind(this),
	    onFailure:  this.FailedToReadHistory.bind(this)
	});
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.setup", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.DisplayHistory = function(transport) {
    try {
	var json  = transport.responseText.evalJSON(true);
	var items = new Array();
	for (var i=0; i<json.count; i++) {
	    items.push(
		{
		    "Traffic": parseInt(json.items[i].rx) + parseInt(json.items[i].tx),
		    "Date":    json.items[i].date
		}
	    );
	}
	this.listModel.items = items;
        this.controller.modelChanged(this.listModel);
	
    }
    catch (err) {
        Mojo.Log.error("HistoryAssistant.DisplayHistory", err);
        Mojo.Controller.errorDialog(err);
    }
}

HistoryAssistant.prototype.FailedToReadHistory = function() {
    try {
	Mojo.Log.error("HistoryAssistant.FailedToReadHistory()", "Could not read stats file");
	Mojo.Controller.errorDialog("No aggregate data so far for this interface!");
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
