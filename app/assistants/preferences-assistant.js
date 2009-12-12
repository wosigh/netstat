/* -*-javascript-*- */

function PreferencesAssistant() {
    try {
	
    } catch (err) {
        Mojo.Log.error("PreferencesAssistant()", err);
        Mojo.Controller.errorDialog(err);
    }
}

PreferencesAssistant.prototype.setup = function() {
    /* configure integer widget for startday setting */
    this.StartDayAttr = {
        label: 'Day when to reset counters',
        modelProperty:    'value',
        min: 1,
        max: 28
    };
    this.StartDayModel = { value: '' };

    this.controller.setupWidget("startday", this.StartDayAttr, this.StartDayModel);

    this.ChangeStartDayHandler = this.ChangeStartDay.bindAsEventListener(this);
    this.controller.listen("startday", Mojo.Event.propertyChange, this.ChangeStartDayHandler);

    /* open the database and start the cascade to display it's value */
    /* db location: /var/palm/data/file_.var.usr.palm.applications.org.daemon.de.netstat_0/000000000000001e.db */
    this.db = new Mojo.Depot(
	{ name:"org.daemon.de.netstat", version: 1, replace: false },
	this.FetchPrefValue.bind(this),
	this.dbError.bind(this)
    );
}

PreferencesAssistant.prototype.FetchPrefValue = function() {
    /* db opened, fetch the value */
    try {
	Mojo.Log.error("FetchPrefValue()","Database opened OK"); 
	this.db.simpleGet("startday", this.SetStartDay.bind(this), 
		     this.SetDefaultStartDay.bind(this));
    }
    catch (err) {
	Mojo.Log.error("FetchPrefValue()", err);
        Mojo.Controller.errorDialog(err);
    }
}

PreferencesAssistant.prototype.SetStartDay = function(dbval) {
    /* value fetched, set the settings screen to it, if any */
    try {
	if (Object.toJSON(dbval) == "{}" || dbval === null) { 
            Mojo.Log.error("Retrieved empty or null value from DB"); 
            this.SetDefaultStartDay(); 
	}
	else {
            Mojo.Log.error("Retrieved value from DB: " + dbval);
	    this.StartDayModel.value = dbval;
	    this.controller.modelChanged(this.StartDayModel);
	} 
    }
    catch (err) {
	Mojo.Log.error("PreferencesAssistant()", err);
        Mojo.Controller.errorDialog(err);
    }
}


PreferencesAssistant.prototype.SetDefaultStartDay = function(dbval) {
    /* no db, no value, or error: use default value */
    try {
	this.StartDayModel.value = 1;
	this.controller.modelChanged(this.StartDayModel);
	this.db.simpleAdd(
	    "startday", 1, 
            function() {
		Mojo.Log.error("Default startday set to 1");
	    }, 
            function(transaction,result) { 
		Mojo.Log.warn("Database save error (#", result.message, ") - can't save default startday item.")
		Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save custom start day.");
            }
	);
    }
    catch (err) {
	Mojo.Log.error("PreferencesAssistant()", err);
        Mojo.Controller.errorDialog(err);
    }
}

PreferencesAssistant.prototype.ChangeStartDay = function(event) {
    /* event triggerd by user: integer list value changed.
     * fetch it and store it to the db
     */
    try {
	Mojo.Log.error("Preferences ChangeStartDayHandler; value = ", this.StartDayModel.value);
	this.db.simpleAdd(
	    "startday", this.StartDayModel.value, 
            function() {
		Mojo.Log.error("Default startday set to " + this.StartDayModel.value);
	    }, 
            function(transaction,result) { 
		Mojo.Log.warn("Database save error (#", result.message, ") - can't save custom startday item.")
		Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save custom start day.");
            }
	);
    }
    catch (err) {
	Mojo.Log.error("ChangeStartDay()", err);
        Mojo.Controller.errorDialog(err);
    }
}

PreferencesAssistant.prototype.dbError = function() {
    Mojo.Log.error("Preferences(): failed to open Mojo.Depot!");
    Mojo.Controller.errorDialog("Preferences(): failed to open Mojo.Depot!");
}


PreferencesAssistant.prototype.activate = function(event) {
}


PreferencesAssistant.prototype.deactivate = function(event) {
}

PreferencesAssistant.prototype.cleanup = function(event) {
    this.controller.stopListening("startday", Mojo.Event.propertyChange,
        this.ChangeStartDayHandler);
}
