/*service na posielanie veci z main controlleru (toho, co zodpoveda za primarny input) controlleru simulatoru*/

/*TODO unifikovat posielanie. Nieco sa posiela cez .valu, ine zas priamo, nejak lepsie to vymysliet. S tym suvisi aj chaos v simulation controlllery*/

app.service('simulationService', function() {
    var _kNumber = {};
    var _kSourceTracks = {};
    var _deltaFunction = {};
    var _mode = {};
    var _isActive = {};
    var _simulatingArray = []
    var _simulationStorageTapeArray = {} /*hoci to je array, budeme ho posielat vo value */
    this.simulationStorageTapeArray = _simulationStorageTapeArray;
    this.kNumber = _kNumber;
    this.kSourceTracks = _kSourceTracks;
    this.deltaFunction = _deltaFunction;
    this.mode = _mode;
    this.isActive = _isActive;
    this.simulatingArray = _simulatingArray;


    /*
	pouzijeme iny, prehladnejsi format:
		
	var addK = function(K) {
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