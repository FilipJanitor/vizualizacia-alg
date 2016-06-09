/*service na posielanie veci z main controlleru (toho, co zodpoveda za primarny input) controlleru simulatoru*/
app.service('simulationService', function() {
    var _kNumber = {};
    var _kSourceTapes = {};
    var _deltaFunction = {};
    var _mode = {};
    var _isActive = {};
    var _simulatingArray = {};
    var _simulationStorageTapeArray = {}; /*hoci to je array, budeme ho posielat vo value */
    this.simulationStorageTapeArray = _simulationStorageTapeArray;
    this.kNumber = _kNumber;
    this.kSourceTapes = _kSourceTapes;
    this.deltaFunction = _deltaFunction;
    this.mode = _mode;
    this.isActive = _isActive;
    this.simulatingArray = _simulatingArray;
});