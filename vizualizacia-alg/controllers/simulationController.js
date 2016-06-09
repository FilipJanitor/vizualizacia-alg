app.controller('simulationController', ['$scope', '$window', '$log', 'simulationService', function($scope, $window, $log, simulationService) {
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
		VISUALIZE_OVERWRITING_HOME_COLUMN: 11,
		VISUALIZE_EMPTY_BLOCK_REARRANGE_SYMBOLS: 12,
		VISUALIZE_EMPTY_BLOCK_FROM_COPY_TAPE: 13,
		VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS: 14,
		VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE: 15,
		VISUALIZE_FULL_BLOCK_ON_OPPOSITE_SIDE: 16,
		VISUALIZE_FULL_BLOCK_FROM_COPY_TAPE: 17,
		VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE: 18,
		VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE: 19,
	};

	/*pomocne mody pre vizualizaciu niektorych medzikrookov*/
	$scope.visualizationStateEnum = {
		NO_VISUALIZATION:0,
		MODE_1_VISUALIZE:1,
		MODE_2_VISUALIZE:2,
	};


	/*Pomocne polia na spravne vykreslenie*/

	/*pole, ktore sa nebude menit a bude sluzit len na iterovanie cez view na paskach. Je na vykreslenie celeho riadku / tj textu*/
	$scope.CONSTANT_VIEW_ARRAY = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

	/*pole na vykreslovanie stvorcekov ako riadku*/
	$scope.CONSTANT_X_VIEW_ARRAY = [60, 100, 140, 180, 220, 260, 300, 340,380, 420, 460, 500, 540, 580, 620, 660, 700];

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
	/*pole obsahujuci pre storage pasku simulacneho stroja interval <) ktory bude vykreslovany. */
	$scope.reducedMachineStorageTapeViews = new MachineView();
	/*pole obsahujuci pre copy pasku simulacneho stroja interval <) ktory bude vykreslovany. */
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

	/*String copy zatial obsahuje iba medzerniky*/
	$scope.reducedMachineCopyTape = "                 ";
	$scope.reducedMachineCopyTapeArray = [];

	/*Sucasny stav originalneho TS. Defaultne to bude stav 0*/
	$scope.originalMachineState = "0";

	/*Dolezite objekty urcujuce stav simulacie*/
	/*IDLE alebo IN_PROGRESS - ci prave simulujeme, alebo len nahadzujeme vstup*/
	$scope.simulationMode = $scope.stateEnum.IDLE;
	/*premenna ktoru naplni mainSimulationFunkcia objektami, ktore budu obsahovat riadiace prikazy pre simulaciu a pointer do tohoto pola. Nextstep ho bude inkrementovat*/
	$scope.currentSimulationStateArray = [];
	$scope.pointerToCurrentSimulationState = 0;

	/*Polia na printing textu a stvorcov. Obsahuju dynamicky ulozene suradnice*/
	$scope.originalMachinePrintingArray = [];
	$scope.reducedMachineStorageTapePrintingArray = [];

	/*pole na printing zelenych storage a copy stvorcov - treba ich robit dynamicky na zaklade toho, co sa deje a aka cast pasky sa vykresluje*/
	$scope.greenStoragePrintingArray = [];
	$scope.greenCopyPrintingArray = [];

	/*stack historie. Obsahuje poslednych 100 pohybov*/
	$scope.historyStack = new CircularStack();

	/*Stav oznacujuci, ci sa nachadzame v pomocnom vizualizacnom stave*/
	$scope.visualizationMode = $scope.visualizationStateEnum.NO_VISUALIZATION;

	/*Pole, obsahujuce suradnice separatorov, relativne ku stredu vykreslovaneho stroju. Pozitivne a negativne. Budu v nich  mocniny dvojky*/
	$scope.separatorArrayPositive = [0];
	$scope.separatorArrayNegative = [0];

	/*Aktualne pouzity riadok deltafunkcie*/
	$scope.currentDelta = undefined;

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
		$scope.visualizationMode = $scope.visualizationStateEnum.NO_VISUALIZATION;
		var writing = [];
		var moving = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			writing.push($scope.simulatingArray.value[i].overwriteValue);
			moving.push($scope.simulatingArray.value[i].movement);
		}

		$scope.reducedMachineStorageTapeViews.reInitialise(-8, 9, 0);
		$scope.backupTapes();
		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia, ktorá porovná aktuálnu konfiguráciu s deltafunkciou a na základe toho stroj buď zasekne, alebo zavolá hlavnú simulačnú funkciu*/
	$scope.findDeltaAndStartStep = function() {
		$scope.currentDelta = undefined;
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		$scope.visualizationMode = $scope.visualizationStateEnum.NO_VISUALIZATION;
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
					$scope.currentDelta = $scope.deltaFunction.value[i];
					break;
				}
			}
		}
		/*Ak sa nenasla zhoda v deltavunkcii, stroj sa zasekne*/
		if (!wasSet) {
			$window.alert("Žiadna zhoda s deltafunkciou, stroj sa zasekol");
			$scope.simulationMode = $scope.stateEnum.IDLE;
			return;
		}
		for (var i = 0; i < $scope.kNumber.value; i++) {
			$scope.simulatingArray.value[i].movement = moving[i];
		}

		$scope.reducedMachineStorageTapeViews.reInitialise(-8, 9, 0);
		$scope.backupTapes();
		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia upravuje výstup simulačnej funkcie tak, aby bol vykresliteľný*/
	$scope.nextStep = function() {
		/*ak sme vsetko posimulovali, upraceme a vypneme simulaciu*/
		if ($scope.pointerToCurrentSimulationState === $scope.currentSimulationStateArray.length) {
			$scope.currentSimulationStateArray.length = 0;
			$scope.pointerToCurrentSimulationState = 0;
			$scope.greenStoragePrintingArray.length = 0;
			$scope.greenCopyPrintingArray.length = 0;
			$scope.simulationMode = $scope.stateEnum.IDLE;
			return;
		}
		var placeholder = 1;
		var tempContainer = $scope.currentSimulationStateArray[$scope.pointerToCurrentSimulationState];

		/*pridanie novej ciary bloku ak je to potrebne (stroj cita blok, na ktorom este nebol)*/
		if(tempContainer.getStepState() == $scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE || tempContainer.getStepState() == $scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE){
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

			case $scope.simulationStateEnum.VISUALIZE_OVERWRITING_HOME_COLUMN:
				$scope.greenCopyPrintingArray.length = 0;
				$scope.greenStoragePrintingArray.length = 0;
				$scope.greenStoragePrintingArray.push(new PrintingSquare(0,1,tempContainer.getIndexOfOriginalTrack()));
				break;

			case $scope.simulationStateEnum.OVERWRITING_HOME_COLUMN:
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get($scope.reducedMachineStorageTapeViews.getCurrentHeadPosition()).lowerLevel = tempContainer.getOverwriteSymbol();
				break;

			case $scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_REARRANGE_SYMBOLS:
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					var tempEnd = Math.pow(2, iBlockIndex-1);
					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe TODO doplnit na copy pasku*/
					for (var i = 1; i < tempEnd; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne. Robim to vsetko len zmenami znamienok, tie cykly by boli skarede, ak by boli negativne*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var tempEnd = -Math.pow(2, -iBlockIndex-1);
					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe*/
					for (var i = -1; i > tempEnd; i--) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS:
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var endBlocksArray = [0];
					for (var i = 0; i < iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(Math.pow(2, i));
					}
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
								if($scope.greenCopyPrintingArray.length < 17){
									$scope.greenCopyPrintingArray.push(placeholder);
								}
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
					}
				} else {
					/*to iste len pre negativne. Robim to vsetko len zmenami znamienok*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var endBlocksArray = [0];
					for (var i = 0; i < -iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(-Math.pow(2, i) /*-1*/ );
					}
					for (var j = endBlocksArray.length -1; j > 0 ; j--) {
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
					}
				}
				break;

			case $scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length = 0;
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					for (var i = 1; i < lastIndexOfIBlock; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				/*Lava strana*/
				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					for (var i = lastIndexOfIBlock + 1; i <= -1; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE:
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					for (var i = 1; i < lastIndexOfIBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					}
				/*Lava strana*/
				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					for (var i = lastIndexOfIBlock + 1; i <= -1; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIBlock -1];
					}
				}
				/*mozeme vymazat pole copy*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;

			case $scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS:
				var iBlockIndex = tempContainer.getIBlockNumber();

				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var tempEnd = Math.pow(2, iBlockIndex-1);
					for (var i = 1; i < tempEnd; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var tempEnd = -Math.pow(2, -iBlockIndex-1);
					/*zelene stvorceky oznacujuce policka, s ktorymi sa hybe*/
					for (var i = -1; i > tempEnd; i--) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,0,tempContainer.getIndexOfOriginalTrack()));
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
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
						endBlocksArray.push(Math.pow(2, i) );
					}
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
								if($scope.greenCopyPrintingArray.length < 17){
									$scope.greenCopyPrintingArray.push(placeholder);
								}
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
					}
				} else {
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
					var endBlocksArray = [0];
					for (var i = 0; i < -iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(-Math.pow(2, i) );
					}
					for (var j = endBlocksArray.length - 1; j > 0; j--) {
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
						for (var k = endBlocksArray[j]+1; k <= endBlocksArray[j-1]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
							$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel = " ";
							if($scope.greenCopyPrintingArray.length < 17){
								$scope.greenCopyPrintingArray.push(placeholder);
							}
						}
					}
				}
				break;

			case $scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length = 0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					var lastIndexOfIMinusOneBlock = Math.pow(2,iBlockIndex-1);
					for (var i = 1; i < lastIndexOfIMinusOneBlock; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
					for (var j = lastIndexOfIMinusOneBlock; j < lastIndexOfIBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}

				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					var lastIndexOfIMinusOneBlock = -Math.pow(2,-iBlockIndex-1);
					for (var j = lastIndexOfIBlock + 1; j <= lastIndexOfIMinusOneBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));

					}
					for (var i = lastIndexOfIMinusOneBlock + 1; i <= -1; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE:
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;:::;Bi-1 tak, aby boli ulozene na spodnych urovniach blokov B1;B2....Bi-1 a hornej urovni Bi a aby reprezentovane slovo zostalo nezmenene.*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex > 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex);
					var lastIndexOfIMinusOneBlock = Math.pow(2,iBlockIndex-1);
					for (var i = 1; i < lastIndexOfIMinusOneBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					}
					for (var j = lastIndexOfIMinusOneBlock; j < lastIndexOfIBlock; j++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = $scope.reducedMachineCopyTapeArray[j - 1];
					}

				} else {
					var lastIndexOfIBlock = -Math.pow(2, -iBlockIndex);
					var lastIndexOfIMinusOneBlock = -Math.pow(2,-iBlockIndex-1);
					var counter = 0;
					for (var j = lastIndexOfIBlock + 1; j <= lastIndexOfIMinusOneBlock; j++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = $scope.reducedMachineCopyTapeArray[j-lastIndexOfIBlock-1];
						counter++;

					}
					for (var i = lastIndexOfIMinusOneBlock + 1; i <= -1; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[counter/*i-lastIndexOfIMinusOneBlock-1*/];
						counter++;
					}
				}
				/*mozeme vymazat pole copy*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;

			case $scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_ON_OPPOSITE_SIDE:
				$scope.greenCopyPrintingArray.length = 0;
				$scope.greenStoragePrintingArray.length=0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex - 1);
					for (var j = lastIndexOfMinusIFullBlock + 1; j <= firstIndexOfMinusIFullBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok*/
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex-1);
					for (var j = firstIndexOfMinusIFullBlock; j < lastIndexOfMinusIFullBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,0,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;

			case $scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE:
				/*Ak je blok B-i plný, preusporiadaj symboly na hornej úrovni bloku B-i tak, aby boli uložené na spodných úrovniach blokov B-(i-1) az B0 a aby slovo zostalo nezmenene*/
				/*iBlockindex obsahuje uz to -I*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = -Math.pow(2, -iBlockIndex - 1);
					for (var j = lastIndexOfMinusIFullBlock + 1; j <= firstIndexOfMinusIFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = " ";
						if($scope.greenCopyPrintingArray.length < 17){
							$scope.greenCopyPrintingArray.push(placeholder);
						}
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok*/
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIFullBlock = Math.pow(2, iBlockIndex-1);
					for (var j = firstIndexOfMinusIFullBlock; j < lastIndexOfMinusIFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = " ";
						if($scope.greenCopyPrintingArray.length < 17){
							$scope.greenCopyPrintingArray.push(placeholder);
						}
					}
				}
				break;

			case $scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length =0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex -1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1 ; i <= 0; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE:
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex -1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1 ; i <= 0; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIMinusOneEmptyBlock - 1];
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
					}
				}
				/*mozeme vymazat pole copy*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;


			case $scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE:
				$scope.greenCopyPrintingArray.length = 0;
				$scope.greenStoragePrintingArray.length=0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex-1);
					for (var j = lastIndexOfMinusIHalfFullBlock + 1; j <= firstIndexOfMinusIHalfFullBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok, */
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIHalfFullBlock = Math.pow(2, iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIHalfFullBlock = Math.pow(2, iBlockIndex-1);
					for (var j = firstIndexOfMinusIHalfFullBlock; j < lastIndexOfMinusIHalfFullBlock; j++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(j,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;


			case $scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE:
				/*Ak je blok B-i poloprázdny, preusporiadaj symboly na spodnej úrovni bloku B-i tak, aby boli uložené na spodných úrovniach blokov B-i-1 az B0 a aby reprezentovane slovo ostalo nezmenene*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex < 0) {
					var lastIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIHalfFullBlock = -Math.pow(2, -iBlockIndex-1);
					for (var j = lastIndexOfMinusIHalfFullBlock + 1; j <= firstIndexOfMinusIHalfFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).lowerLevel = " ";
						if($scope.greenCopyPrintingArray.length < 17){
							$scope.greenCopyPrintingArray.push(placeholder);
						}
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
						if($scope.greenCopyPrintingArray.length < 17){
							$scope.greenCopyPrintingArray.push(placeholder);
						}
					}
				}
				break;

			case $scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE:
				$scope.greenStoragePrintingArray.length=0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex-1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1; i <= 0; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.greenStoragePrintingArray.push(new PrintingSquare(i,1,tempContainer.getIndexOfOriginalTrack()));
					}
				}
				break;

			case $scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE:
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex < 0) {
					var lastIndexOfIMinusOneEmptyBlock = -Math.pow(2, -iBlockIndex-1);
					for (var i = lastIndexOfIMinusOneEmptyBlock+1; i <= 0; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-lastIndexOfIMinusOneEmptyBlock-1];
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1);
					for (var i = 0; i < lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
					}
				}
				/*mozeme vymazat pole copy*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;
			default:
				break;
		}
		$scope.pointerToCurrentSimulationState++;
	};

	/*tato funkcia bude vsetko potrebne pre simulaciu pocitat vopred*/
	$scope.mainSimulatingFunction = function(writingArr, movementArr) {
		/*najskor vyprazdnime pole, v ktrom zostali veci z prerdch. simulacie*/
		$scope.currentSimulationStateArray.length = 0;
		/*velky cyklus, prechadzajuci cez vsetky pasky postupne odhora dolu*/
		for (var j = 0; j < $scope.kNumber.value; j++) {
			/*musime sa spravne pohybovat a najst ity blok co splna nasu podmienku (Pouzivam algoritmus z Petovho clanku, nie ten originalny, pretoze jednoduchost)*/
			/*prepis znaku*/
			$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_OVERWRITING_HOME_COLUMN, j, null, writingArr[j]));
			$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.OVERWRITING_HOME_COLUMN, j, null, writingArr[j]));
			if (movementArr[j] == 0) {
				continue;
			}
			var blockNumber;
			/*osetrenie pohybu hlavy dolava*/
			/*najdeme prvy neplny stlpec v danom smere. Na zaklade neho vyratame blok*/
			if (movementArr[j] == -1) {
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].positiveLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 1) {
						blockNumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 2) {
						blockNumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
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
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -poslednyBlok - 1, null));
				}
			}
			/*osetrenie pohybu hlavy doprava*/
			if (movementArr[j] == 1) {
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].negativeLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 1) {
						blockNumber = -(Math.floor(Math.log(k) / Math.LN2)+1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 2) {
						blockNumber = -(Math.floor(Math.log(k) / Math.LN2) + 1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blockNumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_FULL_BLOCK_FROM_COPY_TAPE, j, -blockNumber, null));
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
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.VISUALIZE_HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -poslednyBlok + 1, null));
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

	/*funkcia posuvajuca nas pohlad na storage pasku.*/
	$scope.moveStorageTape = function(direction){
		$scope.reducedMachineStorageTapeViews.moveView(-direction);
	};

	/*funkcia posuvajuca pohlad na pasky origo stroja*/
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

	/*funkcia na obnovenie stroja do predch stavu*/
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

	$scope.startVisualize = function(type){
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		switch (type) {
			case 1:
				$scope.visualizationMode = $scope.visualizationStateEnum.MODE_1_VISUALIZE;
				break;

			case 2:
				$scope.visualizationMode = $scope.visualizationStateEnum.MODE_2_VISUALIZE;
				break;
		}
	};

}]);