app.controller('simulationController', ['$scope', '$window', 'simulationService', function($scope, $window, simulationService) {
    $scope.stateEnum = {
        IDLE: 1,
        IN_PROGRESS: 2,
        MODE_1_SIMULATE: 5,
        MODE_2_SIMULATE: 6,
    };

    /*body simulacie. Musia byt pre kazdu pasku orig. stroja ulozene v poradi od najmensieho po najvacsi*/
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
    /*pole, ktore sa nebude menit a bude sluzit len na iterovanie cez view na paskach*/
    /*Je na vykreslenie celeho riadku / tj textu*/
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

    /*Objekty s datami, ktore su odoslane cez service z maincontrolleru. Obsahuju presne to, co aj tam - aj nazvy su rovnake*/
    $scope.kSourceTapes = simulationService.kSourceTapes;
    $scope.kNumber = simulationService.kNumber;
    $scope.mainMode = simulationService.mode;

    /*to ifove nakoniec nefungovalo, deltafunction ostane proste undefined, ked sme v zlom mode*/
    $scope.deltaFunction = simulationService.deltaFunction;
    /*Toto je divne ze funguje, treba to spravit nejak normalnejsie, ale mainMode sa pocas simulacie menit nebude, tak ked to funguje tak to zatial nechavam tak*/
    /*if ($scope.mainMode.value == 6) {
        $scope.deltaFunction = simulationService.deltaFunction;
    }*/
    $scope.activeSimulation = simulationService.isActive;
    /*pole obsahujuce objekty s udajmi o pohyboch a prepisovaniach na paskach. Je k tomuto polu pripojeny formular*/
    $scope.simulatingArray = simulationService.simulatingArray;
    /*pole obsahujuce pre kazdu pasku orig stroja jedno negativearray reprezentujuce dvojstopu na storage paske*/
    $scope.simulationStorageTapeArray = simulationService.simulationStorageTapeArray;

	 /*TODO ZMENIT NA POLE MEDZERNIKOV< BUDE SA POUZIVAT MISTO STRINGU*/
    /*String copy zatial obsahuje iba medzerniky*/
    $scope.reducedMachineCopyTape = "                 "
	 /*ZATIAL TEMPOVE POLE NA POUZIVANIE< NIE NA VYKRESLOVANIE*/
	 $scope.reducedMachineCopyTapeArray = [];

    /*Sucasny stav originalneho TS. Defaultne to bude stav 0 nula*/
    $scope.originalMachineState = "0";

    /*Dolezite objekty urcujuce stav simulacie*/
    /*IDLE alebo in progress - ci prave simulujeme, alebo len nahadzujeme vstup*/
    $scope.simulationMode = $scope.stateEnum.IDLE;
    /*premenna ktoru naplni mainSimulationFunkcia objektami, ktore budu obsahovat riadiace prikazy pre simulaciu.*/
    $scope.currentSimulationStateArray = [];
    $scope.pointerToCurrentSimulationState = 0;

    /*Polia na printing textu a stvorcov. Obsahuju dynamicky ulozene suradnice*/
    $scope.originalMachinePrintingArray = [];
    $scope.reducedMachineStorageTapePrintingArray = [];
	 
	 /*pole na printing zelenych storage stvorcov*/
	 $scope.greenStoragePrintingArray=[];


    /*Watch, ktory spravne nastavi prazdne polia na vykreslovanie, ked sa nastavi kNumber. 
    Robi sa to takto, pretoze kNumber sa pocas simulacie menit nebude, na rozdiel od ksourceTapes,
     takze nebude treba spracuvat tolko eventov - tento by sa mal invariantne spustit prave raz pocaz celeho pouzitia aplikacie(raz pri spusteni a inicializovani tohoto controlleru, ale to nepocitame)*/
    $scope.$watch('kNumber.value', function() {
        for (var i = 0; i < $scope.kNumber.value; i++) {
            $scope.originalMachinePrintingArray.push({
                'value': 40 + i * 60
            });
        }
        /*Premenna, znaciaca zaciatok pasok redukovaneho automatu - mozno bude dobre ju dat priamo do scope, aby sa dala pouzit aj v naslednom vykreslovani*/
        $scope.storageTapeOffset.value = 40 + 40 + $scope.kNumber.value * 60;
        /*kriz nad home column sa bude posuvat, teda do tychto objektov nepatri*/
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
        }
        /*Funkcia, ktorá prijme vstup od používateľa, spracuje ho a pošle hlavnej simulačnej funkcií*/
    $scope.checkAndStartStep = function() {
        /*zapne simulaciu*/
        $scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
        var writing = [];
        var moving = [];
        for (var i = 0; i < $scope.kNumber.value; i++) {
            writing.push($scope.simulatingArray.value[i].overwriteValue);
            moving.push($scope.simulatingArray.value[i].movement);
        }

        $scope.redrawOriginalMachine(writing, moving);
        /*Potialto to funguje*/
        $scope.mainSimulatingFunction(writing, moving);
    };

    /*Funkcia, ktorá porovná aktuálnu konfiguráciu s deltafunkciou a na základe toho stroj buď zasekne, alebo zavolá hlavnú simulačnú funkciu*/
    $scope.findDeltaAndStartStep = function() {
        /*zapne simulaciu*/
        $scope.simulationMode = $scope.stateEnum.IN_PROGRESS;
        /*pole so znakmi, ktore prave citame*/
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
            return;
        }
        for (var i = 0; i < $scope.kNumber.value; i++) {
            $scope.simulatingArray.value[i].movement = moving[i];
        }
        $scope.redrawOriginalMachine(writing, moving);


        /*Potialto to funguje. Kedze deltafunkcia je osobitne teleso, musime manualne nastavit tie veci, na ktore obycajne ukazuju radiobuttony aby sa cervene stvorceky vykreslili spravne;*/
        $scope.mainSimulatingFunction(writing, moving);
    };

    /*Funkcia upravuje výstup simulačnej funkcie tak, aby bol vykresliteľný*/
    /*TODO _ ZELENE STVORCEKY SA ESTE NEDEJU< TAKZE TO TREBA ESTE PODOPLNAT*/
    $scope.nextStep = function() {
    	/*ak sme vsetko posimulovali, upraceme a vypneme simulaciu*/
    		if($scope.pointerToCurrentSimulationState === $scope.currentSimulationStateArray.length){
				 $scope.currentSimulationStateArray.length = 0;
				 $scope.pointerToCurrentSimulationState = 0;
				 $scope.simulationMode = $scope.stateEnum.IDLE;
				 return;
    		}
			var tempContainer = $scope.currentSimulationStateArray[$scope.pointerToCurrentSimulationState];
			switch (tempContainer.getStepState()) {
				
				
    			 case $scope.simulationStateEnum.OVERWRITING_HOME_COLUMN:
    			 		$window.alert(tempContainer.getOverwriteSymbol());
        				$scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get($scope.reducedMachineStorageTapeViews.getCurrentHeadPosition()).lowerLevel = tempContainer.getOverwriteSymbol();
						$scope.greenStoragePrintingArray.push(new printingSquare(380,$scope.storageTapeOffset.value+40+tempContainer.getIndexOfOriginalTrack()*80));	
        				break;
        				
        				
   			 case $scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS:
        				/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
        				/*POZOR V MOJOM CISLOVANI SU INDEXY POSUNUTE CIZE BLOK BI ZO SKRIPT JE U MNA BLOK BI-1*/ 
        				var iBlockIndex = tempContainer.getIBlockNumber();
        				
        				/*prava strana - ten priklad co je v skriptach*/
        				if(iBlockIndex >= 0){
        					 var lastIndexOfUsedBlock = Math.pow(2,iBlockIndex)-1; /*CO JE UCEL TEJTO PREMENNEJ - ONO TO JE LEN PRE UCEL TOHO NASLEDNEHO VRACANIA NA TIE BLOKY*/
        					 /*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
        					 var endBlocksArray = [0];
        					 for(var i = 0; i < iBlockIndex;i++){
        					 	  /*polootvorene intervaly*/
							 	  endBlocksArray.push(Math.pow(2,i+1)/*-1*/);        				
        					 }
        					 /*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
        					 for(var j = 1; j < endBlocksArray.length;j++){
							 	  for(var k = endBlocksArray[j-1];k<endBlocksArray[j];k++){
							 	  	   if(k===0){
							 	  	   	  /*v home square mame len spodok*/
							 	  	   	  $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
											  continue;							 	  	   
							 	  	   }
									   $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).upperLevel);								 							 
							 	  }
							 	  for(var k = endBlocksArray[j-1];k<endBlocksArray[j];k++){
								 		if(k===0){
							 	  	   	  continue;							 	  	   
							 	  	   }
									   $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(k).lowerLevel);
							 	  }
        					 }       					 
        				} else {
        				/*to iste len pre negativne. Robim to vsetko len zmenami znamienok, tie cykly by boli skarede, ak by boli negativne*/
        					 var lastIndexOfUsedBlock = Math.pow(2,-iBlockIndex)-1;
        					 /*najdeme vsetky konce blokov az po blok ktory aktualne spracuvame*/
        					 var endBlocksArray = [0];
        					 for(var i = 0; i < -iBlockIndex;i++){
        					 	  /*polootvorene intervaly*/
							 	  endBlocksArray.push(-Math.pow(2,i+1)/*-1*/);        				
        					 }
        					 /*TOTO BUDE LEPSIE ROBIT CEZ NEJAKE FUNKCIE KONKRETNE NA TO URCENE*/
        					 for(var j = 1; j < endBlocksArray.length;j++){
							 	  for(var k = -endBlocksArray[j-1];k<-endBlocksArray[j];k++){
							 	  	   /*if(k===0){
							 	  	   	  
							 	  	   	  $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);
											  continue;							 	  	   
							 	  	   }*/
									   $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).lowerLevel);								 							 
							 	  }
							 	  for(var k = -endBlocksArray[j-1];k<-endBlocksArray[j];k++){
								 		if(k===0){
								 			  /*v homesquare mame len spodok*/
							 	  	   	  continue;							 	  	   
							 	  	   }
									   $scope.reducedMachineCopyTapeArray.push($scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-k).upperLevel);
							 	  }
        					 }
        					 /*POZOR - TO POLE BUDE OPACNE, PRETOZE SLOVO BUDE OD KONCA> NEVADI<. BUD TO OTOCIME, TAK AKO TERAZ, ALEBO TEN CELY VONKAJSI FORCYKLUS SPRAVIME OPACNE - OD LAVA AZ PO ZACIATOK*/
        					 $scope.reducedMachineCopyTapeArray.reverse();
        				}
        				break;
        				
        				
    			 case $scope.simulationStateEnum.EMPTY_BLOCK_FROM_COPY_TAPE:
    			 		/*preusporiadaj symboly v blokoch B0;B1;...;Bi-1 tak, aby boli uložené na spodných úrovniach blokov B1;B2;...;Bi a aby reprezentované slovo ostalo nezmenené*/
        				/*POZOR V MOJOM CISLOVANI SU INDEXY POSUNUTE CIZE BLOK BI ZO SKRIPT JE U MNA BLOK BI-1*/ 
        				var iBlockIndex = tempContainer.getIBlockNumber();
        				/*zatial osetrujem len pravu stranu - ten priklad co je v skriptach*/
        				if(iBlockIndex >= 0){
        					 var lastIndexOfUsedBlock = Math.pow(2,iBlockIndex+1)-1;
        			   	 for (var i = 1; i <= lastIndexOfUsedBlock;i++) {
        			   	 	  $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-1];
        			   	 } /*Lava strana*/
        			   } else {
        			   	 var lastIndexOfUsedBlock = Math.pow(2,-iBlockIndex+1)-1;
        			   	 for (var i = 1; i <= lastIndexOfUsedBlock;i++) {
        			   	 	  $scope.simulationStorageTapeArray.value[tempContainer.getIndexOfOriginalTrack()].get(-i).lowerLevel = $scope.reducedMachineCopyTapeArray[i-1];
        			   	 }
        			   }
        			   /*mozeme vymazat pole copy*/
						$scope.reducedMachineCopyTapeArray.length = 0;        			   
        				break;
        				
        				
    			 case $scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS:
        				day = "Wednesday";
        				break;
    			 case 4:
        				day = "Thursday";
        				break;
    			 case 5:
        				day = "Friday";
        				break;
    			 case 6:
        				day = "Saturday";
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
        	/*$window.alert("spracuvam pasku "+j);*/
            /*musime sa spravne pohhybovat a najst ity blok co splna nasu podmienku (Pouzivam algoritmus z Petovho clanku, nie ten originalny, pretoze jednoduchost)*/
            /*prepis znaku*/
            $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.OVERWRITING_HOME_COLUMN, j, null, writingArr[j]));
            if (movementArr[j] == 0) {
                /*ak sa nehybeme, staci overprintnut*/
                continue
            }
            var blockNumber;
            /*najdeme prvy prazdny stlpec v danom smere. Na zaklade neho vyratame blok*/
            if (movementArr[j] == 1) { /*mozno je dobre cachovat tu dlzku*/
                for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].positiveLength(); k++) {
                    if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 1) {
                        blocknumber = Math.floor(Math.log(k) / Math.LN2);
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
                        break;
                    } else if ($scope.simulationStorageTapeArray.value[j].get(k).isEmpty() === 2) {
                        blocknumber = Math.floor(Math.log(k) / Math.LN2);
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
                        break;
                    } else {

                    }
                }
                /*tu treba skontrolovat, ci skutocne plati invariant, ze zaporny index je vzdy rovnaky ako kladny*/
                if (blocknumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
                    $window.alert("vyrabame novy blok");
                    var poslednyIndex = $scope.simulationStorageTapeArray.value[j].positiveLength() - 1;
                    var poslednyBlok = Math.floor(Math.log(poslednyIndex) / Math.LN2);
                    var poslednyIndexVNovomBloku = Math.pow(2, poslednyblok + 2) - 1;
                    for (var m = poslednyIndex + 1; m <= poslednyIndexVNovomBloku; m++) {
                        $scope.simulationStorageTapeArray.value[j].add(m, new StorageNode(" ", " "));
                        $scope.simulationStorageTapeArray.value[j].add(-m, new StorageNode(" ", " "));
                    }
                    $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
                    $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
                }
            }
            if (movementArr[j] == -1) { /*mozno je dobre cachovat tu dlzku*/
                for (var k = 1; k < $scope.simulationStorageTapeArray.value[j].negativeLength(); k++) {
                    if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 1) {
                        blocknumber = -(Math.floor(Math.log(k) / Math.LN2));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.HALF_FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
                        break;
                    } else if ($scope.simulationStorageTapeArray.value[j].get(-k).isEmpty() === 2) {
                        blocknumber = -(Math.floor(Math.log(k) / Math.LN2));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, blocknumber, null));
                        $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -blocknumber, null));
                        break;
                    } else {

                    }
                }
                if (blocknumber === undefined) { /*narazili sme na koniec pola a je cele plne, vytvorme novy blok na oboch stranach*/
                    $window.alert("vyrabame novy blok");
                    var poslednyIndex = $scope.simulationStorageTapeArray.value[j].positiveLength() - 1;
                    var poslednyBlok = Math.floor(Math.log(poslednyIndex) / Math.LN2);
                    var poslednyIndexVNovomBloku = Math.pow(2, poslednyblok + 2) - 1;
                    for (var m = poslednyIndex + 1; m <= poslednyIndexVNovomBloku; m++) {
                        $scope.simulationStorageTapeArray.value[j].add(m, new StorageNode(" ", " "));
                        $scope.simulationStorageTapeArray.value[j].add(-m, new StorageNode(" ", " "));
                    }
                    $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.EMPTY_BLOCK_REARRANGE_SYMBOLS, j, poslednyBlok + 1, null));
                    $scope.currentSimulationStateArray.push(new StepInformationContainer($scope.simulationStateEnum.FULL_BLOCK_ON_OPPOSITE_SIDE, j, -poslednyBlok - 1, null));
                }
            }
        }
    };

    /*funkcia, ktora prekresli pasky na orig stroji. O realne nastavenie movementu pre posun cervenych stvorcekov sa stara funkcia, ktora ju vola. Tato len prepisuje a posuva pointre*/
    $scope.redrawOriginalMachine = function(writingArr, movementArr) {
        for (var i = 0; i < $scope.kNumber.value; i++) {
            /*toto asi neni dobre, posielam to hodnotou co je zbytocne*/
            /*overwriteCharacterInString(writingArr[i],$scope.originalMachineViews[i].getCurrentHeadPosition(),$scope.kSourceTapes.value[i]);*/

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
                /*$window.alert($scope.originalMachineViews[i].beginning);*/
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