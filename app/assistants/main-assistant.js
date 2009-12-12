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

        } catch (err) {
                Mojo.Log.error("MainAssistant()", err);
                Mojo.Controller.errorDialog(err);
        }
}

MainAssistant.prototype.setup = function() {
    try {
	this.ShowStats();
	/*
	this.controller.setupWidget("reloadbutton",
				    this.attributes = { },
				    this.model = {
					label : "Reload Netstat",
					buttonClass: 'affirmative',
					disabled: false
				    });
	Mojo.Event.listen(this.controller.get('reloadbutton'), Mojo.Event.tap, this.ShowStats.bind(this));
        */
	this.appMenuModel = {
            visible: true,
            items: [
		Mojo.Menu.editItem,
                { label: "Preferences...", command: "do-prefs"},
                { label: "About...", command: 'do-about' }
            ]
        };
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);

	/* reload the app periodically */
	this.wakeupFunction = this.ShowStats.bind(this);
	// console.log("msg");
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.setup()", err);
        Mojo.Controller.errorDialog(err);
    }
}


MainAssistant.prototype.handleCommand = function (event) {
    try {
	this.controller=Mojo.Controller.stageController.activeScene();
	if(event.type == Mojo.Event.command) {      
            switch (event.command) {
            case 'do-about':
		this.controller.stageController.pushScene({name:"showabout",transition:Mojo.Transition.crossFade} );
		break;
            case 'do-prefs':
		this.controller.stageController.pushScene({name:"preferences",transition:Mojo.Transition.crossFade} );
		break;
            case 'do-help':
		this.controller.stageController.pushScene({name:"help",transition:Mojo.Transition.crossFade} );
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
	var statsfile   = "/media/internal/.app-storage/file_.var.usr.palm.applications.org.daemon.de.netstat_0/stats.json"
	var version     = 1;

	Mojo.Log.info("ShowStats() called");

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


MainAssistant.prototype.FailedToReadStats = function() {
    Mojo.Log.error("MainAssistant.FailedToReadStats()", "Could not read stats file");
    Mojo.Controller.errorDialog("Netstat Service not running!");
}


MainAssistant.prototype.DisplayStats = function(transport) {
    try {
	var json = transport.responseText.evalJSON(true);
	if(json.wifigraph && json.wangraph && json.btgraph && json.lastupdate) {
	    this.controller.get('wifigraph').innerHTML  = json.wifigraph;
	    this.controller.get('wangraph').innerHTML   = json.wangraph;
	    this.controller.get('btgraph').innerHTML    = json.btgraph;
	    this.controller.get('lastupdate').innerHTML = json.lastupdate;

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
	this.wakeupTaskId = this.controller.window.setTimeout(this.wakeupFunction, 300000);
    }
    catch (err) {
        Mojo.Log.error("MainAssistant.DisplayStats", err);
        Mojo.Controller.errorDialog(err);
    }
}


MainAssistant.prototype.deactivate = function(event) {
}

MainAssistant.prototype.cleanup = function(event) {
    this.controller.window.clearTimeout(this.wakeupTaskId);
}

