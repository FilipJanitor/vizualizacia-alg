var app = angular.module("App", []);

/*konstruktor pre objekt riadka deltafunkcie*/
function Delta(original_state, reading, new_state, printing, moving) {
	this._originalState = original_state;
	this._reading = reading;
	this._newState = new_state;
	this._printing = printing;
	this._moving = moving;

	this.getOriginalState = function() {
		return this._originalState;
	};
	this.getReading = function() {
		return this._reading;
	};
	this.getNewState = function() {
		return this._newState;
	};
	this.getPrinting = function() {
		return this._printing;
	};
	this.getMoving = function() {
		return this._moving;
	};
};

/*konstruktor pre objekt jedneho stlpca (dvoch stvorcekov pod sebou) na jednej stope storage pasky*/
function StorageNode(upper_level, lower_level) {
	/*Zatial kvoli vykreslovaniu pouzivame ako blank medzeru. Pouzivatel ju nebude moct dat do vstupu, takze je to rozumny blank asi*/
	/*stale sa k tomu pristupuje, tak to necham bez geterov a seterov*/
	this.upperLevel = upper_level;
	this.lowerLevel = lower_level;
	/*0 node je plny. 1 - node je poloprazdy. 2 - node je prazdny*/
	this.isEmpty = function() {
		if (this.upperLevel === " " && this.lowerLevel === " ") {
			return 2;
		}
		if (this.upperLevel === " " || this.lowerLevel === " ") {
			return 1;
		} else {
			return 0;
		}
	};
};

/*Nase specialne pole - ma aj negativne indexy a bude sa pouzivat na vykreslovanie. Nechceme nim prekryt vsetky polia, preto nemenime protoyp array. Toto je skor taky container.*/
/*Invariant pre na se pouzitie je aby bolo vzdy maximalny pozitivny aj negativny index rovnaky*/
function NegativeArray() {
	this.__positive = [];
	this.__negative = [];
	/*tato funkcia silently overwritne to co tam je povodne*/
	this.add = function(index, val) {
		if (typeof index == "number" && Math.round(index) === index) { /*zistime ci je to integer*/
			if (index >= 0) {
				this.__positive[index] = val;
			} else {
				this.__negative[(-index) - 1] = val;
			}
		} else {
			console.error("indexing to array must be done with integer");
		}
	};
	this.get = function(index) {
		if (typeof index == "number" && Math.round(index) === index) { /*zistime ci je to integer*/
			if (index >= 0) {
				return this.__positive[index];
			} else {
				return this.__negative[(-index) - 1];
			}
		} else {
			console.error("indexing to array must be done with integer - returning null");
			return null;
		}
	};

	/*tieto funkcie predpokladaju, ze pole obsahuje 0. Ak nie, budu sa robit diery. Ale pasky su konstruovbane tak, ze home row je na nule, teda situacia, ked by sa to pokazilo nevznikne*/
	/*this.ePush = function(val) {
		this.__positive.push(val);
	};
	this.ePop = function() {
		return this.__positive.pop();
	};
	this.bPush = function(val) {
		this.__negative.push(val);
	};
	this.bPop = function(val) {
		return this.__negative.pop();
	};*/
	this.positiveLength = function() {
		return this.__positive.length;
	};
	this.negativeLength = function() {
		return this.__negative.length + 1;
	};
	this.getLength = function() {
		return this.__positive.length + this.__negative.length + 1;
	};
};

/*objekt, v ktorom si pamatame interval <) ktory bude vykreslovany na paskach stroja. Pre kazdu pasku originalneho bude jeden a budeme pomocou neho vykreslovat.(pomocou in range)*/
function MachineView() {
	this._beginning = 0;
	this._end = 17;
	this._head = 8;
	this._originalViewBeginning = 0;
	this._originalViewEnd = 17;
	this.changeInterval = function(beg, end) {
		if(beg + 17 != end){
			return false;
		}
		this._beginning = beg;
		this._end = end;
	};
	this.reInitialise = function(beg,end,head){
		if(beg + 17 != end || beg + 8 != head){
			return false;
		}
		this._beginning = beg;
		this._end = end;
		this._head =head;
	}
	this.getCurrentHeadPosition = function() {
		return this._head;
	};
	this.getViewHeadPosition = function() {
		return this._head - (this._beginning + 8);
	};
	this.moveRight = function() {
		this._beginning++;
		this._end++;
		this._head++;
	};
	this.moveLeft = function() {
		this._beginning--;
		this._end--;
		this._head--;
	};
	this.getBeginning = function() {
		return this._beginning;
	};
	this.getEnd = function() {
		return this._end;
	};
	this.moveView = function(direction){
		this._beginning += direction;
		this._end += direction;
	};
	this.reInitialiseOriginal = function(){
		this._beginning = this._head-8
		this._end = this._beginning + 17;
	};
};

/*Objekt, obsahuci vsetky potrebne informacie pre podkrok simulacie. Je tvoreny mainsimulation funkciou a citany nextstepom*/
function StepInformationContainer(step_state, original_track, block_number, overwrite_symbol) {
	this._stepState = step_state;
	this._indexOfOriginalTrack = original_track;
	this._iBlockNumber = block_number;
	this._overwriteSymbol = overwrite_symbol;
	this.getStepState = function() {
		return this._stepState;
	};
	this.getIndexOfOriginalTrack = function() {
		return this._indexOfOriginalTrack;
	};
	this.getIBlockNumber = function() {
		return this._iBlockNumber;
	};
	this.getOverwriteSymbol = function() {
		return this._overwriteSymbol;
	};
	this.getStepState = function() {
		return this._stepState;
	};
}

/*Objekt stvorceka*/
function PrintingSquare(index,row, simulatedTrack) {
	this._row = row; /*1 znamena spodny riadok, 0 vrchny*/
	this._index = index;
	this._simulatedTrack = simulatedTrack;
	this.getRow = function(){
		return this._row;
	}
	this.getIndex = function(){
		return this._index;
	}
	this.getSimulatedTrack = function(){
		return this._simulatedTrack;
	}
};


function CircularStack(){
	var stack  = [];
	var beginning = 0;
	var end = 0;
 	var LENGTH = 100;
	/*dlzka obsahu fronty*/
	this.getLength = function(){
		return (stack.length - offset);
	}
	this.isEmpty = function(){
		return (stack.length == 0);
	}

	this.isFull = function(){
		return (stack.length == LENGTH)
	}
	this.push = function(item){
 		stack[end] = item;
 		end = (end+1)%LENGTH;
 		if(end == beginning){
 			beginning = (beginning+1)%LENGTH;
 		}
	}

	this.pop = function(){
    	if (beginning == end){
    		return undefined;
		} else {
			end -= 1;
			if(end < 0){
				end += LENGTH;
			}
			item = stack[end];
			return item;
		}
	}
}

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

app.controller('mainController', ['$scope', 'simulationService', '$window', '$log', function($scope, simulationService, $window, $log) {

	/*Enumerator hovoriaci, v akom stave simulacie sa nachadzame*/
	$scope.stateEnum = {
		BEGINNING: 1,
		MODE_1_CHOOSE_INPUT: 2,
		MODE_2_CHOOSE_INPUT: 3,
		MODE_2_CHOOSE_DELTA: 4,
		MODE_1_SIMULATE: 5,
		MODE_2_SIMULATE: 6,
	};
	/*pocet pasok originalneho stroja*/
	$scope.kNumber = {
		'value': undefined
	};
	/*pole obsahujuce stringy vstupnych slov na k paskach*/
	$scope.kSourceTapes = [];
	/*Najskor sa nachadzame v stave BEGINNING, to sa bude casom menit podla uzivatelovho progresu. CurrentState obsahuje aktualny stav*/
	$scope.currentState = $scope.stateEnum.BEGINNING;
		/*pole objektov riadkov deltafunkcii*/
	$scope.deltaFunction = [];
	/*pole stringov, ktore budu pri submitnuti otestovane a pretransformovane do deltafunkcnych objektov*/
	$scope.deltaArrayTemp = [];
	/*templat pre vyplnanie placeholderu formularu deltafunkcie*/
	$scope.masterFormCommas = "";
	/*pole negativeArrayov, ktore budu reprezentovat stopy na simulacnej paske*/
	$scope.simulationStorageTapeArray = [];

	/*Angular nevie evalovat ng-minlength a ng-maxlength v inputoch, musi tam byt bud konstanta alebo premenna - vyraz nie. Tieto premenne su len na toto urcene*/
	$scope.myMinLength = 0;
	$scope.myMaxLength = 0;

	/*premenna indikujuca, ci je automat s zvolenou deltafunkciou deterministicky*/
	$scope.isDeterministic = {
		'value': true,
		'errLog': ""
	};

	/*reseter temp. stringu delta funkcie na ciarky v spravnom pocte. deltaTemp sa pouziva ako placeholder*/
	$scope.deltaTemp = {
		value: ""
	};
	$scope.resetDelta = function() {
		$scope.deltaTemp.value = angular.copy($scope.masterFormCommas);
	};

	/*funkcia volana z formularu nastavujuceho k. Inicializuje vstupne pasky a nastavi dalsi STATE*/
	$scope.setMode = function(mode) {
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.kSourceTapes.push("");
		}
		if (mode == 1) {
			$scope.currentState = $scope.stateEnum.MODE_1_CHOOSE_INPUT;
		} else {
			$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_INPUT;
			for (var i = 0; i < 3 * $scope.kNumber.value + 1; i++) {
				$scope.masterFormCommas += ",";
			}
			$scope.myMinLength = (3 * $scope.kNumber.value) + 2;
			$scope.myMaxLength = (4 * $scope.kNumber.value) + 2;
		}
	};

	/*Funkcia pripravi pole objektov, ktore sa bude pouzivat pri simulacii(budu obsahovat udaje o pohyboch a zmenach na paskach orig. stroja)*/
	$scope.prepareSimulatingArray = function() {
		var tempArray = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			tempArray.push({
				'movement': "0"
			});
		}
		return tempArray;
	};


	/*Funkcia volana z mode2choosein pre presunutie do vyberu delty*/
	$scope.changeStateToChooseDelta = function() {
		$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
		$scope.resetDelta();
	};


	/*Funkcia volana v stavoch CHOOSE. Pre value 1 zacne simulaciu modu 1. Pre ine zacne simulaciu MODU 2. Je garantovane, ze v slovach sa nepouzivaju ciarky ani medzery ako symbol */
	$scope.startSimulation = function(value) {
		$scope.simulatingArray = $scope.prepareSimulatingArray();
		/*na zaciatku sa pred kazdy string pasky pridaju medzery, tak aby sa pohodlne vykreslovalo.*/
		if($scope.kSourceTapes[0].length < 9){
			var tempString = "";
			for(var temp = 9 - $scope.kSourceTapes[0].length;temp > 0; temp--){
				tempString += "×"
			}
			$scope.kSourceTapes[0] = $scope.kSourceTapes[0] + tempString;
		}
		$scope.kSourceTapes[0] = "××××××××" + $scope.kSourceTapes[0];
		for (var i = 1; i < $scope.kNumber.value; i++) {
			$scope.kSourceTapes[i] = "×××××××××××××××××" + $scope.kSourceTapes[i];
		}
		/*vypocitame udaje, na vyplnanie stop blankami a dorovnavanie prvej stopy*/
		var endOfLastBlockAfterLength = Math.pow(2, (Math.floor(Math.log($scope.kSourceTapes[0].length - 8 -1) / Math.LN2) + 1)) - 1; /*je to index posledneho prvku*/
		var endOfCopy = Math.max(endOfLastBlockAfterLength, 8);
		/*pre kSourceTapes vyrobime negativearrays tak aby bol zachovany invariant Pozor aby to nevracalo undefiend pri skorolovani - vyriesime tak, ze vsetky negativearrays budu mat vzdy rovnaku dlzku aj do plusu aj do minusu*/
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.simulationStorageTapeArray.push(new NegativeArray());
			/*prvu stopu naplnime doplna, alebo viac , podla toho, ci uzivatel zadal dostatocne dlhe vstupne slovo Ak zada dlhe, dorovame to blankmi tak, aby bol skonceny uplny posledny blok*/
			if (i === 0) {
				for (var j = 0; j < $scope.kSourceTapes[0].length-8; j++) {
					$scope.simulationStorageTapeArray[0].add(j, new StorageNode(" ", $scope.kSourceTapes[0].charAt(j + 8)));
				}
				for (var r = $scope.kSourceTapes[0].length-8; r <= endOfCopy; r++) {
					$scope.simulationStorageTapeArray[0].add(r, new StorageNode(" ", "×"));
				}
				for (var f = 1; f <= endOfCopy; f++) {
					$scope.simulationStorageTapeArray[0].add(-f, new StorageNode(" ", "×"));
				}
			} else {
				for (var j = -endOfCopy; j <= endOfCopy; j++) {
					$scope.simulationStorageTapeArray[i].add(j, new StorageNode(" ", "×"));
				}
			}
		}
		simulationService.kNumber.value = $scope.kNumber.value;
		simulationService.kSourceTapes.value = $scope.kSourceTapes;
		simulationService.simulatingArray.value = $scope.simulatingArray;
		simulationService.simulationStorageTapeArray.value = $scope.simulationStorageTapeArray;
		if (value == 1) {
			$scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
			simulationService.mode.value = $scope.stateEnum.MODE_1_SIMULATE;
		} else {
			$scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
			simulationService.deltaFunction.value = $scope.deltaFunction;
			simulationService.mode.value = $scope.stateEnum.MODE_2_SIMULATE;
		}
		simulationService.isActive.value = true;
	};

	/*Funkcie na dynamicke pridavanie a vyhadzovanie inputov pre deltafunkciu*/
	$scope.addNewDeltaTemp = function() {
		$scope.deltaArrayTemp.push({
			'value': angular.copy($scope.masterFormCommas),
			'invalid': false,
			'err': ""
		});
	};
	$scope.removeDeltaTemp = function(index) {
		$scope.deltaArrayTemp.splice(index, 1);
	};

	/*funkcia ktora najprv zvaliduje vstupy pouzivatela, potom overi deterministickost deltafunkcie a ak sa vsetko podari, spusti simulaciu*/
	$scope.validateDeltaStartSimulation = function() {
		$scope.deltaFunction.length = 0; /*pred spracovanim vyhodime vsetky veci z toho pola prec*/
		var success;
		var overallSuccess = true;
		var determinism = true;

		/*vsetky riadky pretavime do objektov deltafunkcii*/
		for (var i = 0; i < $scope.deltaArrayTemp.length; i++) {
			success = $scope.registerDelta($scope.deltaArrayTemp[i]);
			if (success === true) {

				$scope.deltaArrayTemp[i].invalid = false;
				$scope.deltaArrayTemp[i].err = "";
				continue;
			} else {
				overallSuccess = false;
				$scope.deltaArrayTemp[i].invalid = true;
				$scope.deltaArrayTemp[i].err = success;
				continue;
			}
		}
		var errLog = "Chyba nedeterminizmu pri riadkoch: ";
		for (var i = 0; i < $scope.deltaFunction.length; i++) {
			for (var j = i + 1; j < $scope.deltaFunction.length; j++) {
				if ($scope.deltaFunction[i].getOriginalState() == $scope.deltaFunction[j].getOriginalState() && $scope.deltaFunction[i].getReading().toString() === $scope.deltaFunction[j].getReading().toString()) {
					overallSuccess = false;
					determinism = false;
					errLog += " " + i + " a " + j + ";";
				}
			}
		}
		if (overallSuccess) {
			$scope.isDeterministic.value = true;
			$scope.isDeterministic.errLog = "";
			$scope.startSimulation(3);
		} else {
			if (!determinism) {
				$scope.isDeterministic.value = false;
				$scope.isDeterministic.errLog = errLog;
			}
		}
	};

	/*Funkcia na zaregistrovanie noveho objektu deltafunkcie(vytvara sa z stringu ). Zaroven vykonava vstrupnu kontrolu, ci je vstup korektny*/
	$scope.registerDelta = function(deltaTempRow) {
		var arr = deltaTempRow.value.split(",");
		var errLog = "";
		var deltaInvalid = {
			'value': false
		};

		/*Zistit, ci to je potrebne alebo dovolime lubovolne dlhe stavy*/
		if (arr.length != 3 * $scope.kNumber.value + 2) {
			deltaInvalid.value = true;
			errLog += "Zlá dĺžka vstupu. ";
		}

		/*toto mozno netreba - mozno povolime viacznakove stavy TODO*/
		if (arr[0].length != 1) {
			deltaInvalid.value = true;
			errLog += "Stav musí mať 1 znak. ";
		}

		/*tieto _state premenne su iba tempy, preto nepouzivaju camelcase*/
		var orig_state = arr[0];
		var reading = [];
		for (var i = 1; i < 1 + $scope.kNumber.value; i++) {
			if (arr[i].length != 1) {
				deltaInvalid.value = true;
				errLog += "Hlava môže čítať práve jeden znak. Problém je v čítaní " + (i - 1) + " pásky. ";
			} else {
				reading.push(arr[i]);
			}
		}

		/*toto sa mozno tiez vyhodi - mozno povolime viacznakove stavy TODO*/
		if (arr[1 + $scope.kNumber.value].length != 1) {
			deltaInvalid.value = true;
			errLog += "Nový stav môže byť len 1 znak. ";
		} else {
			var new_state = arr[1 + $scope.kNumber.value];
		}

		var printing = [];
		for (var i = $scope.kNumber.value + 2; i < 2 + 2 * $scope.kNumber.value; i++) {
			if (arr[i].length != 1) {
				deltaInvalid.value = true;
				errLog += "Hlava môže písať práve jeden znak. Problém je v prepisovaní " + (i - ($scope.kNumber.value + 2)) + " pásky. ";
			} else {
				printing.push(arr[i]);
			}
		}
		var moving = [];

		for (var i = 2 + 2 * $scope.kNumber.value; i < 2 + 3 * $scope.kNumber.value; i++) {
			if (arr[i] == "0" || arr[i] == "-1" || arr[i] == "1") {
				moving.push(arr[i]);
			} else {
				deltaInvalid.value = true;
				errLog += "Pohyb hlavy môže byť označovaný len -1 0 1. Problém je s hlavou " + (i - (2 + 2 * $scope.kNumber.value)) + ". ";
			}
		}
		if (deltaInvalid.value == true) {
			return errLog;
		}

		deltaInvalid.value = false;

		$scope.deltaFunction.push(new Delta(orig_state, reading, new_state, printing, moving));
		return true;
	};
}]);

app.controller('simulationController', ['$scope', '$window', '$log', 'simulationService', function($scope, $window, $log, simulationService) {
	/*UPRAVIT SWITCH BLOCK TAK ABY SA ZBYTOCNE NEOPAKOVAL KOD 0- VYROBIT FALL THROUGH BLOCK. ZAROVEN TO TREBA ZJEDNOTIT - MIESTO IF ELSE BLOKOV POUZIT JEDNU DEDIKOVANU FUNKCIU - ULAHCI TO FAKT< ZE TIE VECI SU REALNE SYMETRICKE, CI SU POZITIVNE CI NEGATIVNE - OTAZKA JE,CI TO POJDE LEBO UPPPER A LOWER LEVELS. CO TREBA - V SWITCHI PORIEDNE ZJEDNOTIT INTERVALY A CACHOVAT VSETKY CYKLOVEW BOUNDY*/
	/*Co sa tyka stavov, z storage pasky sa maze hned pri presune na copy - bude to indikovane zelenym stvorcekom. Pri presune z copy sa bude hned mazat z copy
	*/
	/*hlavne stavy. Maju dopad na to, co sa objavuje na obrazovke*/
	$scope.stateEnum = {
		IDLE: 1,
		IN_PROGRESS: 2,
		MODE_1_SIMULATE: 5,
		MODE_2_SIMULATE: 6,
	};

	/*body simulacie. Musia byt pre kazdu pasku orig. stroja ulozene v poradi od najmensieho po najvacsi aby sa to spravne spracuval*/
	$scope.simulationStateEnum = {
		OVERWRITING_HOME_COLUMN: 1,
		EMPTY_BLOCK_REARRANGE_SYMBOLS: 2,
		EMPTY_BLOCK_FROM_COPY_TAPE: 3,
		HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS: 4,
		HALF_EMPTY_BLOCK_FROM_COPY_TAPE: 5,
		FULL_BLOCK_ON_OPPOSITE_SIDE: 6,
		FULL_BLOCK_FROM_COPY_TAPE: 7,
		HALF_FULL_BLOCK_ON_OPPOSITE_SIDE: 8,
		HALF_FULL_BLOCK_FROM_COPY_TAPE: 9,
	};


	/*Pomocne polia na spravne vykreslenie*/
	/*pole, ktore sa nebude menit a bude sluzit len na iterovanie cez view na paskach. Je na vykreslenie celeho riadku / tj textu*/
	$scope.CONSTANT_VIEW_ARRAY = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
	/*je na vykreslovanie stvorcekov ako riadku, ma spravne suradnice okrem prostredneho stvorceka, ten chyba*/
	$scope.CONSTANT_X_VIEW_ARRAY = [60, 100, 140, 180, 220, 260, 300, 340,/**/380,/**/ 420, 460, 500, 540, 580, 620, 660, 700];

	/*Offsety sluziace na orientaciu na ploche svg. Na zaklade nich vieme urcit, kde sa zacinaju jednotlive pasky strojov, hoci je ich poloha dynamicka*/
	$scope.reducedMachineCopyTapeOffset = {
		'value': 0
	};
	$scope.neededHeightOfSvg = {
		'value': 0
	};
	$scope.storageTapeOffset = {
		'value': 0
	};

	/*pole obsahujuci pre kazdu pasku orig. stroja interval <) ktory bude vykreslovany */
	$scope.originalMachineViews = [];
	/*pole obsahujuci pre storage pasku simulacneho stroja interval <) ktory bude vykreslovany. On sa asi bude posuvat len pre stav, ze sa cosi bude diat as na moc vzdialenom konci, tak aby to uzivatel videl. Ma mat beginning nastavey na -8 */
	$scope.reducedMachineStorageTapeViews = new MachineView();
	/*pole obsahujuci pre copy pasku simulacneho stroja interval <) ktory bude vykreslovany. On sa asi bude posuvat len pre stav, ze sa cosi bude diat as na moc vzdialenom konci, tak aby to uzivatel videl. Ma mat beginning nastavey na -8 */
	$scope.reducedMachineCopyTapeViews = new MachineView();


	/*Objekty s datami, ktore su odoslane cez service z maincontrolleru. Obsahuju presne to, co aj tam - aj nazvy su rovnake. Vsetko je v  .value*/
	$scope.kSourceTapes = simulationService.kSourceTapes;
	$scope.kNumber = simulationService.kNumber;
	$scope.mainMode = simulationService.mode;
	$scope.deltaFunction = simulationService.deltaFunction;
	$scope.activeSimulation = simulationService.isActive;

	/*pole obsahujuce objekty s udajmi o pohyboch a prepisovaniach na paskach. Je k tomuto polu pripojeny formular*/
	$scope.simulatingArray = simulationService.simulatingArray;
	/*pole obsahujuce pre kazdu pasku orig stroja jedno negativearray reprezentujuce dvojstopu na storage paske*/
	$scope.simulationStorageTapeArray = simulationService.simulationStorageTapeArray;

	/*TODO ZMENIT NA POLE MEDZERNIKOV< BUDE SA POUZIVAT MISTO STRINGU*/
	/*String copy zatial obsahuje iba medzerniky*/
	$scope.reducedMachineCopyTape = "                 ";
		/*ZATIAL TEMPOVE POLE NA POUZIVANIE< NIE NA VYKRESLOVANIE*/
	$scope.reducedMachineCopyTapeArray = [];

	/*Sucasny stav originalneho TS. Defaultne to bude stav 0 nula*/
	$scope.originalMachineState = "0";

	/*Dolezite objekty urcujuce stav simulacie*/
	/*IDLE alebo in progress - ci prave simulujeme, alebo len nahadzujeme vstup*/
	$scope.simulationMode = $scope.stateEnum.IDLE;
	/*premenna ktoru naplni mainSimulationFunkcia objektami, ktore budu obsahovat riadiace prikazy pre simulaciu a pointer do tohoto pola. Nextstep ho bude inkrementovat*/
	$scope.currentSimulationStateArray = [];
	$scope.pointerToCurrentSimulationState = 0;

	/*Polia na printing textu a stvorcov. Obsahuju dynamicky ulozene suradnice*/
	$scope.originalMachinePrintingArray = [];
	$scope.reducedMachineStorageTapePrintingArray = [];

	/*pole na printing zelenych storage stvorcov - treba ich robit dynamicky na zaklade toho, co sa deje a aka cast pasky sa vykresluje*/
	$scope.greenStoragePrintingArray = [];

	/*stack historie. Obsahuje poslednych 100 pohybov*/
	$scope.historyStack = new CircularStack();

	/*Pole, obsahujuce suradnice separatorov, relativne ku stredu vykreslovaneho stroju. Pozitivne a negativne. Budu v nich  mocniny dvojky*/
	$scope.separatorArrayPositive = [0];
	$scope.separatorArrayNegative = [0];

	/*Watch, ktory spravne nastavi prazdne polia na vykreslovanie, ked sa nastavi kNumber.Robi sa to takto, pretoze kNumber sa pocas simulacie menit nebude, na rozdiel od ksourceTapes, takze nebude treba spracuvat tolko eventov - tento by sa mal invariantne spustit prave raz pocaz celeho pouzitia aplikacie(raz pri spusteni a inicializovani tohoto controlleru, ale to nepocitame)*/
	$scope.$watch('kNumber.value', function() {
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.originalMachinePrintingArray.push({
				'value': 40 + i * 60
			});
		}
		$scope.storageTapeOffset.value = 40 + 40 + $scope.kNumber.value * 60;
		/*kriz nad home column sa bude posuvat, teda do tychto objektov nepatri - ak ta mvobec bude*/
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.reducedMachineStorageTapePrintingArray.push({
				'value': $scope.storageTapeOffset.value + i * 80
			});
			$scope.reducedMachineStorageTapePrintingArray.push({
				'value': $scope.storageTapeOffset.value + 40 + i * 80
			});
		}
		$scope.reducedMachineCopyTapeOffset.value = $scope.storageTapeOffset.value + 40 + (80 * $scope.kNumber.value);
		$scope.neededHeightOfSvg.value = $scope.reducedMachineCopyTapeOffset.value + 100;

		/*nastavenie pointrov vykreslovania pasok orig. stroja*/
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.originalMachineViews.push(new MachineView());
		}

		/*ked sa spusti tento watch - on sa spusti aj pri uplnej inicializacii vsetkeho aj pri nastaveni ksourcetapes - nastavime rovno aj spravny zaciatok storage tejpu*/
		$scope.reducedMachineStorageTapeViews.reInitialise(-8, 9, 0);
	}, true);

	/*Funkcia na restartovanie celeho simulacneho procesu do state beginning*/
	$scope.restartSimulation = function() {
		$window.location.reload();
	};

	/*Funkcia, ktorá prijme vstup od používateľa, spracuje ho a pošle hlavnej simulačnej funkcií*/
	$scope.checkAndStartStep = function() {
		/*zapne simulaciu*/
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.originalMachineViews[i].reInitialiseOriginal();
		}
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		var writing = [];
		var moving = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			writing.push($scope.simulatingArray.value[i].overwriteValue);
			//chyba s znamienkami v pohybe. Musim ich otocit. robim to v dvoch funkciach redraw a main
			moving.push($scope.simulatingArray.value[i].movement);
		}

		$scope.backupTapes();
		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia, ktorá porovná aktuálnu konfiguráciu s deltafunkciou a na základe toho stroj buď zasekne, alebo zavolá hlavnú simulačnú funkciu*/
	$scope.findDeltaAndStartStep = function() {
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		var readingArr = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			readingArr.push($scope.kSourceTapes.value[i].charAt($scope.originalMachineViews[i].getCurrentHeadPosition()));
			$scope.originalMachineViews[i].reInitialiseOriginal();
		}
		var writing;
		var moving;
		var wasSet = false;
		for (var i = 0; i < $scope.deltaFunction.value.length; i++) {
			if ($scope.deltaFunction.value[i].getOriginalState() == $scope.originalMachineState) {
				if ($scope.deltaFunction.value[i].getReading().toString() === readingArr.toString()) {
					writing = $scope.deltaFunction.value[i].getPrinting();
					moving = $scope.deltaFunction.value[i].getMoving();
					$scope.originalMachineState = $scope.deltaFunction.value[i].getNewState();
					wasSet = true;
					break;
				}
			}
		}
		/*Ak sa nenasla zhoda v deltavunkcii, stroj sa zasekne - zatial temporary*/
		if (!wasSet) {
			$window.alert("Žiadna zhoda s deltafunkciou, stroj sa zasekol");
			$scope.simulationMode = $scope.stateEnum.IDLE;
			return;
		}
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.simulatingArray.value[i].movement = moving[i];
		}
		$scope.backupTapes();
		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia upravuje výstup simulačnej funkcie tak, aby bol vykresliteľný*/
	/*TODO _ ZELENE STVORCEKY SA ESTE NEDEJU< TAKZE TO TREBA ESTE PODOPLNAT*/
	/*TODO OSETRIT DIVNE VSTUPY - I = 0*/
	/*Kazdy krok zrestuje view storagetape.*/
	$scope.nextStep = function() {
		/*ak sme vsetko posimulovali, upraceme a vypneme simulaciu*/
		if ($scope.pointerToCurrentSimulationState === $scope.currentSimulationStateArray.length) {
			$scope.currentSimulationStateArray.length = 0;
			$scope.pointerToCurrentSimulationState = 0;
			$scope.greenStoragePrintingArray.length = 0;
			$scope.simulationMode = $scope.stateEnum.IDLE;
			return;
		}
		/*vratime pohlad na stred*/
		$scope.reducedMachineStorageTapeViews.reInitialise(-8, 9, 0);
		var tempContainer = $scope.currentSimulationStateArray[$scope.pointerToCurrentSimulationState];

		/*pridanie novej ciary bloku ak je to potrebne (stroj cita blok, na ktorom este nebol)*/
		if(tempContainer.getStepState() == $scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS || tempContainer.getStepState() == $scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS){
			if(tempContainer.getIBlockNumber() > 0){
				if(Math.pow(2,tempContainer.getIBlockNumber())-1 > $scope.separatorArrayPositive[$scope.separatorArrayPositive.length-1]){
					$scope.separatorArrayPositive.push(Math.pow(2,tempContainer.getIBlockNumber())-1);
				}
			} else {
				if(Math.pow(2,-tempContainer.getIBlockNumber())-1>$scope.separatorArrayNegative[$scope.separatorArrayNegative.length-1]){
					$scope.separatorArrayNegative.push(Math.pow(2,-tempContainer.getIBlockNumber())-1);
				}
			}
		}

		if(tempContainer.getStepState() == $scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE || tempContainer.getStepState() == $scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE){
			if(tempContainer.getIBlockNumber() > 0){
				if(Math.pow(2,tempContainer.getIBlockNumber())-1 > $scope.separatorArrayPositive[$scope.separatorArrayPositive.length-1]){
					$scope.separatorArrayPositive.push(Math.pow(2,tempContainer.getIBlockNumber())-1);
				}
			} else {
				if(Math.pow(2,-tempContainer.getIBlockNumber())-1>$scope.separatorArrayNegative[$scope.separatorArrayNegative.length-1]){
					$scope.separatorArrayNegative.push(Math.pow(2,-tempContainer.getIBlockNumber())-1);
				}
			}
		}

		switch (tempContainer.getStepState()) {

			case $scope.simulationStateEnum.OVERWRITING_HOME_COLUMN:
				$scope.greenStoragePrintingArray.length = 0;
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get($scope.reducedMachineStorageTapeViews.getCurrentHeadPosition()).lowerLevel = tempContainer.getOverwriteSymbol();

				$scope.greenStoragePrintingArray.push(new PrintingSquare(0,1,tempContainer.getIndexOfOriginalTrack()));
				break;


			case $scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS:
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					/*var lastIndexOfUsedBlock = Math.pow(2, iBlockIndex-1) - 1; CO JE UCEL TEJTO PREMENNEJ - ONO TO JE LEN PRE UCEL TOHO NASLEDNEHO VRACANIA NA TIE BLOKY*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var endBlocksArray = [0];
					for (var i = 0; i < iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(Math.pow(2, i));
					}
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
						}
					}

					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe TODO doplnit na copy pasku*/
					for (var i = 1; i < endBlocksArray[endBlocksArray.length-1]; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne. Robim to vsetko len zmenami znamienok, tie cykly by boli skarede, ak by boli negativne*/
					/*var lastIndexOfUsedBlock = Math.pow(2, -(iBlockIndex+1)) - 1;*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var endBlocksArray = [0];
					for (var i = 0; i < -iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(-Math.pow(2, i) /*-1*/ );
					}
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = endBlocksArray.length -1; j > 0 ; j--) {
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							/*if(k===0){
							 	  	   	  $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
											  continue;
							 	  	   }*/
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
						}
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
						}
					}
					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe TODO doplnit na copy pasku*/
					for (var i = -1; i > endBlocksArray[endBlocksArray.length-1]; i--) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;

			case $scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length = 0;
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					for (var i = 1; i < lastIndexOfIBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				/*Lava strana*/
				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					for (var i = lastIndexOfIBlock + 1; i <= -1; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIBlock -1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;


			case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS:
				/*preusporiadaj symboly v blokoch B0;B1;:::;Bi-1 tak, aby boli ulozene na spodnych urovniach blokov B1;B2....Bi-1 a hornej urovni Bi a aby reprezentovane slovo zostalo nezmenene.*/
				var iBlockIndex = tempContainer.getIBlockNumber();

				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var endBlocksArray = [0];
					for (var i = 0; i < iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(Math.pow(2, i) /*-1*/ );
					}
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE - toto je totiz rovnake pre half empty aj empty*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
						}
					}
					/*zelene pomocne stvorceky*/
					for (var i = 1; i < endBlocksArray[endBlocksArray.length-1]; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var endBlocksArray = [0];
					for (var i = 0; i < -iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(-Math.pow(2, i) /*-1*/ );
					}
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE- toto je rovnake v empty aj v halfempty*/
					for (var j = endBlocksArray.length - 1; j > 0; j--) {
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
						}
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
						}
					}
					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe TODO doplnit na copy pasku*/
					for (var i = -1; i > endBlocksArray[endBlocksArray.length-1]; i--) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length = 0;
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;:::;Bi-1 tak, aby boli ulozene na spodnych urovniach blokov B1;B2....Bi-1 a hornej urovni Bi a aby reprezentovane slovo zostalo nezmenene.*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					var lastIndexOfIMinusOneBlock = Math.pow(2,iBlockIndex-1);
					for (var i = 1; i < lastIndexOfIMinusOneBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
					for (var j = lastIndexOfIMinusOneBlock; j < lastIndexOfIBlock; j++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = $scope.reducedMachineCopyTapeArray[j - 1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}

				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					var lastIndexOfIMinusOneBlock = -Math.pow(2,-iBlockIndex-1);
					var counter = 0;
					for (var j = lastIndexOfIBlock + 1; j <= lastIndexOfIMinusOneBlock; j++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = $scope.reducedMachineCopyTapeArray[j-lastIndexOfIBlock-1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
						counter++;

					}
					for (var i = lastIndexOfIMinusOneBlock + 1; i <= -1; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[counter/*i-lastIndexOfIMinusOneBlock-1*/];
						counter++;
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;

			case $scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE:
				$scope.greenStoragePrintingArray.length=0;
				/*Ak je blok B-i plný, preusporiadaj symboly na hornej úrovni bloku B-i tak, aby boli uložené na spodných úrovniach blokov B-(i-1) az B0 a aby slovo zostalo nezmenene*/
				/*iBlockindex obsahuje uz to -I*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex - 1);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = lastIndexOfMinusIFullBlock + 1; j <= firstIndexOfMinusIFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = " ";
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok, tie cykly by boli skarede, ak by boli negativne*/
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex-1);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = firstIndexOfMinusIFullBlock; j < lastIndexOfMinusIFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = " ";
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;

			case $scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length =0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex -1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1 ; i <= 0; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIMinusOneEmptyBlock - 1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;

			case $scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE:
				/*Ak je blok B-i poloprázdny, preusporiadaj symboly na spodnej úrovni bloku B-i tak, aby boli uložené na spodných úrovniach blokov B-i-1 az B0 a aby reprezentovane slovo ostalo nezmenene*/
				$scope.greenStoragePrintingArray.length=0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex-1);
					for (var j = lastIndexOfMinusIHalfFullBlock + 1; j <= firstIndexOfMinusIHalfFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel = " ";
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok, */
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIHalfFullBlock = Math.pow(2, iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIHalfFullBlock = Math.pow(2, iBlockIndex-1);
					for (var j = firstIndexOfMinusIHalfFullBlock; j < lastIndexOfMinusIHalfFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel = " ";
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}

				break;

			case $scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length=0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex-1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1; i <= 0; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIMinusOneEmptyBlock-1];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;
			default:
				break;
		}
		$scope.pointerToCurrentSimulationState++;
	};

	/*tato funkcia bude vsetko pocitat*/
	/*TODO dat tam nejake medzi stavy tak, aby sa tie veci dali pekne obrazkovo ukazovat*/
	/*opravit to treba aby to bolo krajsie*/
	$scope.mainSimulatingFunction = function(writingArr, movementArr) {
		/*najskor vyprazdnime pole, v ktrom zostali veci z prerdch. simulacie*/
		$scope.currentSimulationStateArray.length = 0;
		/*velky cyklus, prechadzajuci cez vsetky pasky postupne odhora dolu*/
		for (var j = 0; j < $scope.kNumber.value; j++) {
			/*musime sa spravne pohybovat a najst ity blok co splna nasu podmienku (Pouzivam algoritmus z Petovho clanku, nie ten originalny, pretoze jednoduchost)*/
			/*prepis znaku*/
			$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.OVERWRITING_HOME_COLUMN, j, null, writingArr[j]));
			if (movementArr[j] == 0) {
				continue;
			}
			var blockNumber;
			/*osetrenie pohybu hlavy dolava*/
			/*najdeme prvy neplny stlpec v danom smere. Na zaklade neho vyratame blok*/
			if (movementArr[j] == -1) { /*mozno je dobre cachovat tu dlzku*/
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].positiveLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 1) {
						blockNumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 2) {
						blockNumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else {
						continue;
					}
				}
				/*tu treba skontrolovat, ci skutocne plati invariant, ze zaporny index je vzdy rovnaky ako kladny. Pridame invariant, pocet blokov na kazdej stope nalavo aj napravo je vzdy jednotny*/
				if (blockNumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
					var poslednyIndex = $scope.simulationStorageTapeArray.value[j].positiveLength() - 1; /*posledny zaplneny index, ktory este mame definovany*/
					var poslednyBlok = Math.floor(Math.log(poslednyIndex) / Math.LN2) + 1;/*posledny blok, co este mame*/
					var poslednyIndexVNovomBloku = Math.pow(2, (poslednyBlok + 2)-1) - 1; /*+2 -1 je tam preto, lebo blok i ma dlzku 2^(i-1)*/
					for(var f = 0; f < $scope.kNumber.value;f++){
						for (var m = poslednyIndex + 1; m <= poslednyIndexVNovomBloku; m++) { /*pridavame symetricky na obe strany. Povodne tam bolo tapeArray.value[j], ale teraz to rpidavame vsetkym*/
							$scope.simulationStorageTapeArray.value[f].add(m, new StorageNode(" ", "×"));
							$scope.simulationStorageTapeArray.value[f].add(-m, new StorageNode(" ", "×"));
						}
					}
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -poslednyBlok - 1, null));
				}
			}
			/*osetrenie pohybu hlavy doprava*/
			if (movementArr[j] == 1) { /*mozno je dobre cachovat tu dlzku*/
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].negativeLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 1) {
						blockNumber = -(Math.floor(Math.log(k) / Math.LN2)+1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 2) {
						blockNumber = -(Math.floor(Math.log(k) / Math.LN2) + 1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else {

					}
				}
				if (blockNumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
					var poslednyIndex = - ($scope.simulationStorageTapeArray.value[j].negativeLength() - 1);
					var poslednyBlok = -(Math.floor(Math.log(-poslednyIndex) / Math.LN2) +1);
					var poslednyIndexVNovomBloku = -(Math.pow(2, (-poslednyBlok + 2) -1) - 1);
					for(var f = 0; f < $scope.kNumber.value;f++){
						for (var m = -poslednyIndex + 1; m <= -poslednyIndexVNovomBloku; m++) {
							$scope.simulationStorageTapeArray.value[j].add(-m, new StorageNode(" ", "×"));
							$scope.simulationStorageTapeArray.value[j].add(m, new StorageNode(" ", "×"));
						}
					}
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -poslednyBlok + 1, null));
				}
			}
		}
	};

	/*funkcia, ktora prekresli pasky na orig stroji. O realne nastavenie movementu pre posun cervenych stvorcekov sa stara funkcia, ktora ju vola. Tato len prepisuje a posuva pointre*/
	$scope.redrawOriginalMachine = function(writingArr, movementArr) {
		for (var i = 0; i < $scope.kNumber.value; i++) {

			/*prepis*/
			var arr = $scope.kSourceTapes.value[i].split("");
			arr[$scope.originalMachineViews[i].getCurrentHeadPosition()] = writingArr[i];
			$scope.kSourceTapes.value[i] = arr.join("");

			/*shiftnutie*/
			if (movementArr[i] == 0) {
				continue;
			}

			if (movementArr[i] == 1) {
				$scope.originalMachineViews[i].moveRight();
				/*ak sme sa posunuli tak daleko, ze pozerame za pomysleny koniec pasky - koniec stringu ktory pasku reprezentuje, apendneme mu blank*/
				if ($scope.originalMachineViews[i].getEnd() > $scope.kSourceTapes.value[i].length) {
					$scope.kSourceTapes.value[i] += "×";
				}
				continue;
			}
			if (movementArr[i] == -1) {
				$scope.originalMachineViews[i].moveLeft();
				/*ak sme sa posunuli tak daleko, ze pozerame pred pomysleny koniec pasky - zaciatok stringu ktory pasku reprezentuje, preppendneme mu blank a nastavime spravne view (posunu sa prependnutim indexy)*/
				if ($scope.originalMachineViews[i].getBeginning() < 0) {
					$scope.kSourceTapes.value[i] = "×" + $scope.kSourceTapes.value[i];
					$scope.originalMachineViews[i].moveRight();
				}
				continue;
			}
		}
	};

	/*funkcia posuvajuca nas view na storage paske.*/
	$scope.moveStorageTape = function(direction){
		$scope.reducedMachineStorageTapeViews.moveView(-direction);
	};

	/*funkcia posuvajuca view na paskach origo stroja*/
	$scope.moveOriginalTapes = function(index,direction){
		/*$scope.originalMachineViews[index].moveOriginalView(-direction);*/
		$scope.originalMachineViews[index].moveView(-direction);
	};

	/*funkcia volana pri kazdom kroku simulacie - ulozi aktualny stav celeho automatu tak, aby sa dal neskor obnovit*/
	$scope.backupTapes = function(){
		var backup = new Object();
		backup.originalTapes = $scope.kSourceTapes.value;
		backup.originalViews = $scope.originalMachineViews;
		backup.storageTape = $scope.simulationStorageTapeArray.value;
		backup.storageTapeViews = $scope.reducedMachineStorageTapeViews;
		backup.originalMachineState = $scope.originalMachineState;
		backup.separatorArrayPositive = $scope.separatorArrayPositive;
		backup.separatorArrayNegative = $scope.separatorArrayNegative;
		$scope.historyStack.push(angular.copy(backup));
	};

	$scope.previousStep = function(){
		var backup = $scope.historyStack.pop();
		if(backup == null){
			return;
		}

		$scope.kSourceTapes.value = backup.originalTapes;
		$scope.originalMachineViews = backup.originalViews;
		$scope.simulationStorageTapeArray.value = backup.storageTape;
		$scope.reducedMachineStorageTapeViews = backup.storageTapeViews;
		$scope.originalMachineState = backup.originalMachineState;
		$scope.separatorArrayNegative = backup.separatorArrayNegative;
		$scope.separatorArrayPositive = backup.separatorArrayPositive;

	};
}]);
