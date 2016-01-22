/*service na posielanie veci z prveho controllearu (toho, co zodpoveda za input) simulatoru*/
app.service('simulationService', function() {
  var _kNumber;
  var _kSourceTracks;
  var _deltaFunction;
  var _mode;
  var _isActive = false;
	
	this.kNumber = _kNumber;
  this.kSourceTracks = _kSourceTracks;
  this.deltaFunction =_deltaFunction;
  this.mode = _mode;
  this.isActive =  _isActive;
	
	
	/*var addK = function(K) {
		kNumber = K;		
	};
	var addDeltaFunction = function(DF){
		deltaFunction = DF;
	};
	var addKSourceTracks = function(KST){
		kSourceTracks = KST;
	};
   var addMode = function(MODE){
		  mode = MODE;
   };  
  
  var getMode = function(){
      return mode;
  };

  var getKNumber = function(){
      return kNumber;
  };
  
  var getKSourceTracks = function(){
      return kSourceTracks;
  };
  
  var getDeltaFunction = function(){
      return deltaFunction;
  };
  
  var setActive(){
		isActive = true;  
  }

  return {
    addDeltaFunction: addDeltaFunction,
    addKSourceTracks: addKSourceTracks,
    addMode : addMode,
    getMode : getMode,
    getKNumber : getKNumber,
    getKSourceTracks : getKSourceTracks,
    getDeltaFunction : getDeltaFunction
  };*/

});