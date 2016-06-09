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

	/*Funkcia na restartovanie celeho simulacneho procesu do state beginning*/
	$scope.restartSimulation = function() {
		$window.location.reload();
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
				tempString += "×";
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
					errLog += " " + (i+1) + " a " + (j+1) + ";";
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

		if (arr[0].length > 15) {
			deltaInvalid.value = true;
			errLog += "Stav musí mať najviac 15 znakov. ";
		}

		var orig_state = arr[0];
		var reading = [];
		for (var i = 1; i < 1 + $scope.kNumber.value; i++) {
			if (arr[i].length != 1) {
				deltaInvalid.value = true;
				errLog += "Hlava môže čítať práve jeden znak. Problém je v čítaní " + (i - 1 +1) + " pásky. ";
			} else {
				reading.push(arr[i]);
			}
		}

		if (arr[1 + $scope.kNumber.value].length != 1) {
			deltaInvalid.value = true;
			errLog += "Nový stav môže mať najviac 15 znakov. ";
		} else {
			var new_state = arr[1 + $scope.kNumber.value];
		}

		var printing = [];
		for (var i = $scope.kNumber.value + 2; i < 2 + 2 * $scope.kNumber.value; i++) {
			if (arr[i].length != 1) {
				deltaInvalid.value = true;
				errLog += "Hlava môže písať práve jeden znak. Problém je v prepisovaní " + (i - ($scope.kNumber.value + 2) +1) + " pásky. ";
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
				errLog += "Pohyb hlavy môže byť označovaný len -1 0 1. Problém je s hlavou " + (i - (2 + 2 * $scope.kNumber.value) +1) + ". ";
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