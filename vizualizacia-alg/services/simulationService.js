/*service na posielanie veci z main controlleru (toho, co zodpoveda za primarny input) controlleru simulatoru*/

/*TODO unifikovat posielanie. Nieco sa posiela cez .valu, ine zas priamo, nejak lepsie to vymysliet. S tym suvisi aj chaos v simulation controlllery*/

app.service('simulationService', function() {
    var _kNumber = {};
    var _kSourceTapes = {};
    var _deltaFunction = {};
    var _mode = {};
    var _isActive = {};
    var _simulatingArray = []
    var _simulationStorageTapeArray = {} /*hoci to je array, budeme ho posielat vo value */
    this.simulationStorageTapeArray = _simulationStorageTapeArray;
    this.kNumber = _kNumber;
    this.kSourceTapes = _kSourceTapes;
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
	var addKSourceTapes = function(KST){
		kSourceTapes = KST;
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
  
  var getKSourceTapes = function(){
      return kSourceTapes;
  };
  
  var getDeltaFunction = function(){
      return deltaFunction;
  };
  
  var setActive(){
		isActive = true;  
  }

  return {
    addDeltaFunction: addDeltaFunction,
    addKSourceTapes: addKSourceTapes,
    addMode : addMode,
    getMode : getMode,
    getKNumber : getKNumber,
    getKSourceTapes : getKSourceTapes,
    getDeltaFunction : getDeltaFunction
  };*/

});