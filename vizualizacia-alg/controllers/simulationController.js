app.controller('simulationController', ['$scope', '$window', '$log', 'simulationService', function($scope, $window, $log, simulationService) {
	/*UPRAVIT SWITCH BLOCK TAK ABY SA ZBYTOCNE NEOPAKOVAL KOD 0- VYROBIT FALL THROUGH BLOCK. ZAROVEN TO TREBA ZJEDNOTIT - MIESTO IF ELSE BLOKOV POUZIT JEDNU DEDIKOVANU FUNKCIU - ULAHCI TO FAKT< ZE TIE VECI SU REALNE SYMETRICKE, CI SU POZITIVNE CI NEGATIVNE - OTAZKA JE,CI TO POJDE LEBO UPPPER A LOWER LEVELS. CO TREBA - V SWITCHI PORIEDNE ZJEDNOTIT INTERVALY A CACHOVAT VSETKY CYKLOVEW BOUNDY*/
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
	$scope.CONSTANT_X_VIEW_ARRAY = [60, 100, 140, 180, 220, 260, 300, 340, 420, 460, 500, 540, 580, 620, 660, 700];

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
		$scope.reducedMachineStorageTapeViews.changeInterval(-8, 9);
	}, true);

	/*Funkcia na restartovanie celeho simulacneho procesu do state beginning*/
	$scope.restartSimulation = function() {
		$window.location.reload();
	};

	/*Funkcia, ktorá prijme vstup od používateľa, spracuje ho a pošle hlavnej simulačnej funkcií*/
	$scope.checkAndStartStep = function() {
		$log.info("STARTING_SIMULATION");
		/*zapne simulaciu*/
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		var writing = [];
		var moving = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			writing.push($scope.simulatingArray.value[i].overwriteValue);
			moving.push($scope.simulatingArray.value[i].movement);
		}

		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia, ktorá porovná aktuálnu konfiguráciu s deltafunkciou a na základe toho stroj buď zasekne, alebo zavolá hlavnú simulačnú funkciu*/
	$scope.findDeltaAndStartStep = function() {
		$scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
		var readingArr = [];
		for (var i = 0; i < $scope.kNumber.value; i++) {
			readingArr.push($scope.kSourceTapes.value[i].charAt($scope.originalMachineViews[i].getCurrentHeadPosition()));
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
		$scope.redrawOriginalMachine(writing, moving);
		$scope.mainSimulatingFunction(writing, moving);
	};

	/*Funkcia upravuje výstup simulačnej funkcie tak, aby bol vykresliteľný*/
	/*TODO _ ZELENE STVORCEKY SA ESTE NEDEJU< TAKZE TO TREBA ESTE PODOPLNAT*/
	/*TODO OSETRIT DIVNE VSTUPY - I = 0*/
	$scope.nextStep = function() {
		/*ak sme vsetko posimulovali, upraceme a vypneme simulaciu*/
		if ($scope.pointerToCurrentSimulationState === $scope.currentSimulationStateArray.length) {
			$scope.currentSimulationStateArray.length = 0;
			$scope.pointerToCurrentSimulationState = 0;
			$scope.simulationMode = $scope.stateEnum.IDLE;
			return;
		}
		var tempContainer = $scope.currentSimulationStateArray[$scope.pointerToCurrentSimulationState];
		switch (tempContainer.getStepState()) {

			case $scope.simulationStateEnum.OVERWRITING_HOME_COLUMN:
				$log.info("OVERWRITING_HOME_COLUMN");
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get($scope.reducedMachineStorageTapeViews.getCurrentHeadPosition()).lowerLevel = tempContainer.getOverwriteSymbol();
				$scope.greenStoragePrintingArray.push(new printingSquare(380, $scope.storageTapeOffset.value + 40 + tempContainer.getIndexOfOriginalTrack() * 80));
				break;


			case $scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS:
				$log.info("EMPTY_BLOCK_REARRANGE_SYMBOLS");
				$scope.greenStoragePrintingArray.length = 0;
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				
				$log.info("i "+iBlockIndex);
				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					var lastIndexOfUsedBlock = Math.pow(2, iBlockIndex-1) - 1; /*CO JE UCEL TEJTO PREMENNEJ - ONO TO JE LEN PRE UCEL TOHO NASLEDNEHO VRACANIA NA TIE BLOKY*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var endBlocksArray = [0];
					for (var i = 0; i < iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(Math.pow(2, i) /*-1*/ );
					}
					
					$log.info("pole koncov blokov: " + endBlocksArray);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$log.info("reading home square");
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								continue;
							}
							$log.info("reading "+k+" column upper");
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$log.info("reading "+k+" column lower");
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
						}
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
					$log.info("pole koncov blokov: " + endBlocksArray);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = -endBlocksArray[j - 1]; k < -endBlocksArray[j]; k++) {
							/*if(k===0){
							 	  	   	  $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
											  continue;							 	  	   
							 	  	   }*/
							$log.info("reading "+k+" column lower with symbol" + $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
						}
						for (var k = -endBlocksArray[j - 1]; k < -endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$log.info("reading "+k+" column upper with symbol "+ $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).upperLevel);
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).upperLevel);
						}
					}
				}
				break;

			case $scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE:
				$log.info("EMPTY_BLOCK_FROM_COPY_TAPE");
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
				if (iBlockIndex >= 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex) -1;
					for (var i = 1; i <= lastIndexOfIBlock; i++) {
						$log.info("from copy tape, iblocknumber >= i z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[i - 1] + "na poziciu " + i);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					} /*Lava strana*/
				} else {
					var lastIndexOfIBlock = Math.pow(2, -iBlockIndex) -1;
					for (var i = 1; i <= lastIndexOfIBlock; i++) {
						$log.info("from copy tape, iblocknumber < i z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[i - 1] + "na poziciu -" + i);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;


			case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS:
				$log.info("HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS");
				/*preusporiadaj symboly v blokoch B0;B1;:::;Bi-1 tak, aby boli ulozene na spodnych urovniach blokov B1;B2....Bi-1 a hornej urovni Bi a aby reprezentovane slovo zostalo nezmenene.*/
				$scope.greenStoragePrintingArray.length = 0;
				var iBlockIndex = tempContainer.getIBlockNumber();
				$log.info("i "+iBlockIndex);
				/*prava strana - ten priklad co je v skriptach*/
				if (iBlockIndex > 0) {
					/*var lastIndexOfUsedBlock = Math.pow(2, iBlockIndex-1) - 1; *//*CO JE UCEL TEJTO PREMENNEJ - ONO TO JE LEN PRE UCEL TOHO NASLEDNEHO VRACANIA NA TIE BLOKY*/
					/*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame (nevratane - chceme na copytape davat len veci az po blok Bi-1)*/
					var endBlocksArray = [0];
					for (var i = 0; i < iBlockIndex; i++) {
						/*polootvorene intervaly*/
						endBlocksArray.push(Math.pow(2, i) /*-1*/ );
					}
					$log.info("pole koncov blokov: " + endBlocksArray);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE - toto je totiz rovnake pre half empty aj empty*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v home square mame len spodok*/
								$log.info("reading home square");
								$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
								continue;
							}
							$log.info("reading "+k+" column upper");
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);
						}
						for (var k = endBlocksArray[j - 1]; k < endBlocksArray[j]; k++) {
							if (k === 0) {
								continue;
							}
							$log.info("reading "+k+" column lower");
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
						}
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
					$log.info("pole koncov blokov: " + endBlocksArray);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE- toto je rovnake v empty aj v halfempty*/
					for (var j = 1; j < endBlocksArray.length; j++) {
						for (var k = -endBlocksArray[j - 1]; k < -endBlocksArray[j]; k++) {
							/*if(k===0){
							 	  	   	  $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
											  continue;							 	  	   
							}*/
							$log.info("reading "+k+" column lower with symbol" + $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
						}
						for (var k = -endBlocksArray[j - 1]; k < -endBlocksArray[j]; k++) {
							if (k === 0) {
								/*v homesquare mame len spodok*/
								continue;
							}
							$log.info("reading "+k+" column upper with symbol "+ $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).upperLevel);
							$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).upperLevel);
						}
					}
				}
				break;


			case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE:
				$log.info("HALF_EMPTY_BLOCK_FROM_COPY_TAPE");
				/*tu vymazeme home sqr*/
				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(0).lowerLevel= " ";
				/*preusporiadaj symboly v blokoch B0;B1;:::;Bi-1 tak, aby boli ulozene na spodnych urovniach blokov B1;B2....Bi-1 a hornej urovni Bi a aby reprezentovane slovo zostalo nezmenene.*/
				var iBlockIndex = tempContainer.getIBlockNumber();
				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
				if (iBlockIndex >= 0) {
					var lastIndexOfIBlock = Math.pow(2, iBlockIndex) -1;
					var lastIndexOfIMinusOneBlock = Math.pow(2,iBlockIndex-1)-1;
					for (var i = 1; i <= lastIndexOfIMinusOneBlock; i++) {
						$log.info("from copy tape, iblocknumber >= i z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[i - 1] + "na poziciu " + i);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					} 
					for (var j = lastIndexOfIMinusOneBlock + 1; j <= lastIndexOfIBlock; j++) {
						$log.info("from copy tape, iblocknumber >= j z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[j - 1] + "na poziciu " + j);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel = $scope.reducedMachineCopyTapeArray[j - 1];
					}
					/*Lava strana*/
				} else {
					var lastIndexOfIBlock = Math.pow(2, -iBlockIndex) -1;
					var lastIndexOfIMinusOneBlock = Math.pow(2,-iBlockIndex-1)-1;
					for (var i = 1; i <= lastIndexOfIBlock; i++) {
						$log.info("from copy tape, iblocknumber < i z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[i - 1] + "na poziciu -" + i);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-i).lowerLevel = $scope.reducedMachineCopyTapeArray[i - 1];
					}
					for (var j = lastIndexOfIMinusOneBlock + 1; j <= lastIndexOfIBlock; j++) {
						$log.info("from copy tape, iblocknumber >= j z tempcontaineru, citam" + $scope.reducedMachineCopyTapeArray[j - 1] + "na poziciu " + j);
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-j).upperLevel = $scope.reducedMachineCopyTapeArray[j - 1];
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;
				
			case $scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE:
				$log.info("FULL_BLOCK_ON_OPPOSITE_SIDE");
				/*Ak je blok B-i plný, preusporiadaj symboly na hornej úrovni bloku B-i tak, aby boli uložené na spodných úrovniach blokov B-(i-1) az B0 a aby slovo zostalo nezmenene*/
				/*iBlockindex obsahuje uz to -I*/				
				var iBlockIndex = tempContainer.getIBlockNumber();
				$log.info("ZAPORNE I "+ iBlockIndex);
				/*Spracuvanie druhej casti pravej strana - ten priklad co je v skriptach*/
				if (iBlockIndex <= 0) {
					/*tento interval nieje polootvoreny, pretoze sa slovo ajtak musi citat zlava doprava. Urobim ho teda uzavrety*/
					var lastIndexOfMinusIFullBlock = -(Math.pow(2, -iBlockIndex) - 1);
					$log.info("lastIndexOfMinusIFullBlock "+ lastIndexOfMinusIFullBlock);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIBlock = -(Math.pow(2, -iBlockIndex - 1));
					$log.info("firstIndexOfMinusIFullBlock " +firstIndexOfMinusIFullBlock);
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = lastIndexOfMinusIFullBlock; j <= firstIndexOfMinusIBlock; j++) {
						$log.info("beriem z horneho ");
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
					}
				} else {
					/*to iste len pre negativne I, cize teraz pozitivne -I. Robim to vsetko len zmenami znamienok, tie cykly by boli skarede, ak by boli negativne*/
					/*tento interval je uzavrety*/
					var lastIndexOfMinusIFullBlock = (Math.pow(2, iBlockIndex) - 1);
					/*najdeme zaciatok minus iteho */
					var firstIndexOfMinusIBlock = (Math.pow(2, iBlockIndex-1));
					/*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
					for (var j = firstIndexOfMinusIBlock; j <= lastIndexOfMinusIFullBlock; j++) {
						$scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(j).upperLevel);
					}
				}
				break;

			case $scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE:
				$log.info("FULL_BLOCK_FROM_COPY_TAPE");
				var iBlockIndex = tempContainer.getIBlockNumber();
				if (iBlockIndex <= 0) {
					var lastIndexOfIMinusOneEmptyBlock = (Math.pow(2, -iBlockIndex -1) - 1);
					for (var i = 0; i <= lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-(lastIndexOfIMinusOneEmptyBlock - i)).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
					}
				} else {
					var lastIndexOfIMinusOneEmptyBlock = Math.pow(2, iBlockIndex -1) - 1;
					for (var i = 0; i <= lastIndexOfIMinusOneEmptyBlock; i++) {
						$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i];
					}
				}
				/*mozeme vymazat pole copy POZOR-SKUTOCNE SA CELE ODALOKUJE A PRESTANE SA VYPISOVAT??*/
				$scope.reducedMachineCopyTapeArray.length = 0;
				break;

			case $scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE:
				$log.info("not implemented yet");
				break;

			case $scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE:
				$log.info("not implemented yet");
				break;
		}
		$scope.pointerToCurrentSimulationState++;
	};

	/*tato funkcia bude vsetko pocitat*/
	/*TODO dat tam nejake medzi stavy tak, aby sa tie veci dali pekne obrazkovo ukazovat*/
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
			if (movementArr[j] == 1) { /*mozno je dobre cachovat tu dlzku*/
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].positiveLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 1) {
						blocknumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blocknumber, null));						
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blocknumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 2) {
						blocknumber = Math.floor(Math.log(k) / Math.LN2) + 1;
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE, j, -blocknumber, null));
						break;
					} else {
						continue;
					}
				}
				/*tu treba skontrolovat, ci skutocne plati invariant, ze zaporny index je vzdy rovnaky ako kladny. Pridame invariant, pocet blokov na kazdej stope nalavo aj napravo je vzdy jednotny*/
				if (blocknumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
					var poslednyIndex = $scope.simulationStorageTapeArray.value[j].positiveLength() - 1; /*posledny zaplneny index, ktory este mame definovany*/
					var poslednyBlok = Math.floor(Math.log(poslednyIndex) / Math.LN2) + 1;/*posledny blok, co este mame*/
					var poslednyIndexVNovomBloku = Math.pow(2, (poslednyblok + 2)-1) - 1; /*+2 -1 je tam preto, lebo blok i ma dlzku 2^(i-1)*/
					for(var f = 0; f < $scope.kNumber.value;f++){
						for (var m = poslednyIndex + 1; m <= poslednyIndexVNovomBloku; m++) { /*pridavame symetricky na obe strany. Povodne tam bolo tapeArray.value[j], ale teraz to rpidavame vsetkym*/
							$scope.simulationStorageTapeArray.value[f].add(m, new StorageNode(" ", "×"));
							$scope.simulationStorageTapeArray.value[f].add(-m, new StorageNode(" ", "×"));
						}
					}
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_FROM_COPY_TAPE, j, -poslednyBlok - 1, null));
				}
			}
			/*osetrenie pohybu hlavy doprava*/
			if (movementArr[j] == -1) { /*mozno je dobre cachovat tu dlzku*/
				for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].negativeLength(); k++) {
					if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 1) {
						blocknumber = -(Math.floor(Math.log(k) / Math.LN2)+1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_FROM_COPY_TAPE, j, blocknumber, null));						
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_FROM_COPY_TAPE, j, -blocknumber, null));
						break;
					} else if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 2) {
						blocknumber = -(Math.floor(Math.log(k) / Math.LN2) + 1);
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
						$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_FROM_COPY_TAPE, j, -blocknumber, null));
						break;
					} else {

					}
				}
				if (blocknumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
					var poslednyIndex = - ($scope.simulationStorageTapeArray.value[j].negativeLength() - 1);
					var poslednyBlok = -(Math.floor(Math.log(poslednyIndex) / Math.LN2) +1);
					var poslednyIndexVNovomBloku = -(Math.pow(2, (-poslednyblok + 2) -1) - 1);
					for(var f = 0; f < $scope.kNumber.value;f++){
						for (var m = -poslednyIndex + 1; m <= -poslednyIndexVNovomBloku; m++) {
							$scope.simulationStorageTapeArray.value[j].add(-m, new StorageNode(" ", "×"));
							$scope.simulationStorageTapeArray.value[j].add(m, new StorageNode(" ", "×"));
						}
					}
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE, j, poslednyBlok + 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
					$scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_FROM_COPY_TAPE, j, -poslednyBlok - 1, null));
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

			if (movementArr[i] == -1) {
				$scope.originalMachineViews[i].moveRight();
				/*ak sme sa posunuli tak daleko, ze pozerame za pomysleny koniec pasky - koniec stringu ktory pasku reprezentuje, apendneme mu medzernik*/
				if ($scope.originalMachineViews[i].getEnd() > $scope.kSourceTapes.value[i].length) {
					$scope.kSourceTapes.value[i] += " ";
				}
				continue;
			}
			if (movementArr[i] == 1) {
				$scope.originalMachineViews[i].moveLeft();
				/*ak sme sa posunuli tak daleko, ze pozerame pred pomysleny koniec pasky - zaciatok stringu ktory pasku reprezentuje, preppendneme mu medzernik a nastavime spravne view (posunu sa prependnutim indexy)*/
				if ($scope.originalMachineViews[i].getBeginning() < 0) {
					$scope.kSourceTapes.value[i] = " " + $scope.kSourceTapes.value[i];
					$scope.originalMachineViews[i].moveRight();
				}
				continue;
			}
		}
	};
}]);