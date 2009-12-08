function ShowaboutAssistant(imageurl) {
}

ShowaboutAssistant.prototype.setup = function() {
    try {
    }
    catch (err) {
        Mojo.Log.error("ShowaboutAssistant()", err);
        Mojo.Controller.errorDialog(err);
    }
}

ShowaboutAssistant.prototype.activate = function(event) {
}


ShowaboutAssistant.prototype.deactivate = function(event) {
}

ShowaboutAssistant.prototype.cleanup = function(event) {
}
