/* -*-javascript-*- */

/*
 * keep track of netstatd absence
 */
var away = 0;

function MainAssistant() {
        /* this is the creator function for your scene assistant object. It will be passed all the 
           additional parameters (after the scene name) that were passed to pushScene. The reference
           to the scene controller (this.controller) has not be established yet, so any initialization
           that needs the scene controller should be done in the setup function below. */
        try {
	    this.ifnames = {
		"wifigraph": "eth0",
		"wangraph":  "ppp0",
		"btgraph":   "bsl0"
	    };
        } catch (err) {
                Mojo.Log.error("MainAssistant()", err);
                Mojo.Controller.errorDialog(err);
        }
}

MainAssistant.prototype.setup = function() {
    try {
        /* default traffic limit (0 == unlimited) */
        this.limit = 0;

	/* by default we are active */
	this.active = true;

	/* load stats.json */
	this.ShowStats();

	/* setup the menu */
	this.appMenuModel = {
            visible: true,
            items: [
		Mojo.Menu.editItem,
                { label: "Preferences", command: "do-prefs"   },
                { label: "About",       command: 'do-about'   }
            ]
        };
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);

	/* setup the reload command button */
	this.cmdMenuModel = {
            visible:true,
            items: [
                {},
                {},
                {label:$L('Reload'), icon:'sync', command:'sync'}
            ]};
        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);

	/* interface list */
	this.listAttributes = { 
            itemTemplate:     "main/itemTemplate",
            listTemplate:     "main/listTemplate",
            swipeToDelete:    false,
            fixedHeightItems: true,
            reorderable:      false
	};
	this.listModel = {
            listTitle: $L("Interfaces"),
            items: []
	}
	this.controller.setupWidget('InterfaceList', this.listAttributes, this.listModel);
	this.historyHandler = this.InterfaceHistory.bindAsEventListener(this)
	this.controller.listen('InterfaceList', Mojo.Event.listTap, this.historyHandler);

	/* reload the app periodically */
	this.wakeupFunction = this.ShowStats.bind(this);

	var stageDocument = this.controller.stageController.document; 
	Mojo.Event.listen(stageDocument, Mojo.Event.stageActivate,   this.activateWindow.bindAsEventListener(this) );
	Mojo.Event.listen(stageDocument, Mojo.Event.stageDeactivate, this.deactivateWindow.bindAsEventListener(this) );
	
	}
    catch (err) {
        Mojo.Log.error("MainAssistant.setup()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.InterfaceHistory = function (event) {
    try {
	if(this.listModel.items[event.index].IsInterface) {
	    this.controller.stageController.pushScene( { name:"history", transition:Mojo.Transition.crossFade}, this.listModel.items[event.index] );
	    // "history", this.listModel.items[event.index]);
	}
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.InterfaceHistory()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.handleCommand = function (event) {
    try {
	this.controller=Mojo.Controller.stageController.activeScene();
	if(event.type == Mojo.Event.command) {      
            switch (event.command) {
            case 'do-about':
		this.controller.stageController.pushScene( { name:"showabout",   transition:Mojo.Transition.crossFade} );
		break;
            case 'do-prefs':
		this.controller.stageController.pushScene( { name:"preferences", transition:Mojo.Transition.crossFade} );
		break;
            case 'do-help':
		this.controller.stageController.pushScene( { name:"help",        transition:Mojo.Transition.crossFade} );
		break;
	    case 'sync':
		this.ShowStats();
		break;
	    }
	}
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.handleCommand()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.ShowStats = function() {
    try {
	var statsfile   = "/media/internal/.app-storage/file_.media.cryptofs.apps.usr.palm.applications.org.daemon.de.netstat_0/stats.json";
	var version     = 1;

	Mojo.Log.info("ShowStats() called");

	new Ajax.Request(statsfile, {
	    requestHeaders: {Accept: 'application/json'},
	    method:     'get',
	    onComplete: {},
	    onSuccess:  this.DisplayStats.bind(this),
	    onFailure:  this.ShowStatsVar.bind(this)
	});
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.ShowStats", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.ShowStatsVar = function() {
    try {
	var statsfile   = "/media/internal/.app-storage/file_.var.usr.palm.applications.org.daemon.de.netstat_0/stats.json";
	var version     = 1;

	Mojo.Log.info("ShowStatsVar() called");

	new Ajax.Request(statsfile, {
	    requestHeaders: {Accept: 'application/json'},
	    method:     'get',
	    onComplete: {},
	    onSuccess:  this.DisplayStats.bind(this),
	    onFailure:  this.FailedToReadStats.bind(this)
	});
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.ShowStats", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.noop = function() { }

MainAssistant.prototype.FetchPrefValue = function() {
    /* db opened, fetch the value */
    try {
	Mojo.Log.error("Main/FetchPrefValue()","Database opened OK"); 
	this.db.simpleGet("limit", this.CheckLimit.bind(this), this.noop.bind(this));
    }
    catch (err) {
	Mojo.Log.error("FetchPrefValue()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.CheckLimit = function(dbval) {
    /* value fetched */
    try {
	if (Object.toJSON(dbval) == "{}" || dbval === null) {
	  ; /* do nothing */
	}
	else {
	    if(dbval) {
	      this.limitmb = dbval;
	      if ( this.rawtrafficwan > (this.limitmb * 1024 * 1024) ) {
		this.db.simpleGet("limitacknowledged", this.CheckLimitAck.bind(this), this.noop.bind(this));
		/* notify or warn */
		/* FIXME: If banner acknowledged, save to DB and don't warn anymore (this time period) */
		/*
		if(this.active) {
		  this.controller.get('warning').innerHTML = "Warning: WAN traffic > " + this.limitmb + "MB!";
		}
		else {
		  Mojo.Controller.getAppController().showBanner("Warning: WAN traffic > " + this.limitmb + "MB!", {source: 'notification'});
		}
		*/
	      }
	    }
	} 
    }
    catch (err) {
	Mojo.Log.error("MainAssistant::CheckLimit()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.CheckLimitAck = function(dbval) {
    /* limitacknowledged pref value fetched */
    try {
	if (Object.toJSON(dbval) == "{}" || dbval === null) {
	  this.LimitWarning();
	}
	else {
	  if(dbval) {
	    if (dbval != 1) {
	      this.LimitWarning();
	    }
	    else {
	      /* limit already acknowledged, just warn if active */
	      if(this.active) {
		this.controller.get('warning').innerHTML = "Warning: WAN traffic > " + this.limitmb + "MB!";
	      }
	    }
	  }
	  else {
	    this.LimitWarning();
	  }
	}
    }
    catch (err) {
	Mojo.Log.error("MainAssistant::CheckLimit()", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.LimitWarning = function() {
  try {
    if(this.active) {
      /* card active, notify and set ack flag */
      this.controller.get('warning').innerHTML = "Warning: WAN traffic > " + this.limitmb + "MB!";
      this.db.simpleAdd(
			"limitacknowledged", 1, 
			function() {
			  Mojo.Log.error("limitacknowledged => 1");
			}, 
			function(transaction,result) { 
			  Mojo.Log.warn("Database save error (#", result.message, ") - can't save limitacknowledged.");
			  Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save limitacknowledged.");
			}
			);
    }
    else {
      /* inactive, just drop a banner and leave the user with it */
      Mojo.Controller.getAppController().showBanner("Warning: WAN traffic > " + this.limitmb + "MB!", {source: 'notification'});
    }
  }
  catch (err) {
    Mojo.Log.error("MainAssistant::LimitWarning()", err);
    Mojo.Controller.errorDialog(err);
  }
}

MainAssistant.prototype.FailedToReadStats = function() {
    Mojo.Log.error("MainAssistant.FailedToReadStats()", "Could not read stats file");
    Mojo.Controller.errorDialog("Netstat Service not running!");
}

MainAssistant.prototype.dbError = function() {
    Mojo.Log.error("Preferences(): failed to open Mojo.Depot!");
    Mojo.Controller.errorDialog("Preferences(): failed to open Mojo.Depot!");
}

MainAssistant.prototype.DisplayStats = function(transport) {
    try {
	var json = transport.responseText.evalJSON(true);
	if(json.wifigraph && json.wangraph && json.btgraph && json.lastupdate) {
	    var graph = new Array('wifigraph', 'wangraph', 'btgraph');
	    var items = new Array();

	    for(var i=0; i<3; i++) {
		items.push(
		    {
			"Image":       "<img src=\"images/" + graph[i] + ".png\"/>",
			"Traffic":     json[graph[i]].traffic,
			"Interface":   graph[i],
			"IsInterface": true
		    }
		);
	    }

	    items.push(
		{
		    "Image": "last update",
		    "Traffic": json.lastupdate,
		    "IsInterface": false
		}
	    );

	    this.listModel.items = items;
            this.controller.modelChanged(this.listModel);

	    /* check traffic limit */
	    this.rawtrafficwan = json.wangraph.rawtraffic;
	    this.db = new Mojo.Depot(
				     { name:"org.daemon.de.netstat", version: 1, replace: false },
				     this.FetchPrefValue.bind(this),
				     this.dbError.bind(this)
				     );

	    /* check if service is running */
	    var now = new Date().getTime() / 1000;
	    diff = now - json.timestamp;
	    if(diff > 310) {
		if(away > 1) {
		    /* normally the service runs every 5 min, we give it 3x5 */
		    Mojo.Log.error("DisplayStats(): no updates by netstatd after 15 minutes!");
		    this.controller.get('warning').innerHTML = "Warning: netstatd is not running!";
		}
		else {
		    /* give it another 5 min */
		    Mojo.Log.error("DisplayStats(): no updates by netstatd after " + away * 5 + " minutes, waiting ...");
		    away+= 1;
		}
	    }
	    else {
		/* remove warning, if any */
		this.controller.get('warning').innerHTML = '';
		/* netstatd is back */
		away = 0;
	    }
	}
	else {
	    this.controller.get('warning').innerHTML = "Warning: netstatd is not running!";
	}
	this.wakeupTaskId = this.controller.window.setTimeout(this.wakeupFunction, 30000);
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.DisplayStats", err);
        Mojo.Controller.errorDialog(err);
    }
}

MainAssistant.prototype.deactivate = function(event) {
}

MainAssistant.prototype.activate = function(event) {
}

MainAssistant.prototype.deactivateWindow = function(event) {
  this.active = false;
}

MainAssistant.prototype.activateWindow = function(event) {
  this.active = true;
}

MainAssistant.prototype.cleanup = function(event) {
    this.controller.window.clearTimeout(this.wakeupTaskId);
    Mojo.Event.stopListening(this.controller.get('InterfaceList'), Mojo.Event.listTap, this.historyHandler);
}

