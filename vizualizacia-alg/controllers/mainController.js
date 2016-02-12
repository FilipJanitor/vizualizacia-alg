app.controller('mainController', ['$scope', 'simulationService', '$window', function($scope, simulationService, $window) {

    /*Enumerator hovoriaci, v akom stave simulacie sa nachadzame*/
    $scope.stateEnum = {
        BEGINNING: 1,
        MODE_1_CHOOSE_INPUT: 2,
        MODE_2_CHOOSE_INPUT: 3,
        MODE_2_CHOOSE_DELTA: 4,
        MODE_1_SIMULATE: 5,
        MODE_2_SIMULATE: 6,
        //TODO vsetky mody
    };
    /*Kolko paskovy stroj hcceme simulovat*/
    $scope.kNumber;
    /*pole obsahujuce stringy vstupnych slov na k paskach*/
    $scope.kSourceTapes = [];
    /*Najskor sa nachadzame v stave BEGINNING, to sa bude casom menit. CurrentState obsahuje aktualny stav*/
    $scope.currentState = $scope.stateEnum.BEGINNING
        /*pole objektov deltafunkcii*/
    $scope.deltaFunction = [];
    /*pole stringov, ktore budu pri submitnuti otestovane a pretransformovane do deltafunkcnych objektov TMP*/
    $scope.deltaArrayTemp = [];
    /*templat pre vyplnanie formularu deltafunkcie*/
    $scope.masterFormCommas = "";


    /*pole negativeArrayov, ktore budu reprezentovat stopy na simulacnej paske*/
    $scope.simulationStorageTapeArray = [];

    /*Angular nevie evalovat ng-minlength a ng-maxlength v inputoch, musi tam byt bud konstanta alebo premenna - vyraz nie. Preto urobim svoje premenne len na toto urcene*/
    $scope.myMinLength;
    $scope.myMaxLength;

    /*premenna indikujuca, ci je automat s zvolenou deltafunkciou deterministicky*/
    $scope.isDeterministic = {
        'value': true,
        'errLog': ""
    };

    /*Validovacia funkcia do formularu, ktory spracuva k od uzivatelaNEBUDE SA POUZIVAT*/
    $scope.kNotValid = function(value) {
        return ($value > 0) && ($value <= 30);
    };


    /*reseter temp. stringu delta funkcie na ciarky*/
    $scope.deltaTemp = {
        value: ""
    };
    $scope.resetDelta = function() {
        $scope.deltaTemp.value = angular.copy($scope.masterFormCommas);
    };
    /*pouziva to registerdelta funkcia. Skutocne musi byt vizana na scope? nestaci lokalna? NEBUDE SA POUZIVAT*/
    /*$scope.deltaInvalid = {
        value: false
    };*/
    /*funkcia volana z formularu nastavujuceho k. Nastavi k, inicializuje vstupne pasky a nastavi dalsi STATE*/
    $scope.setKMode = function(mode, kValue) {
        $scope.kNumber = kValue;
        for (var i = 0; i < $scope.kNumber; i++) {
            $scope.kSourceTapes.push("");
        }
        if (mode == 1) {
            $scope.currentState = $scope.stateEnum.MODE_1_CHOOSE_INPUT;
            $scope.le = $scope.kSourceTapes.length
        } else {
            $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_INPUT;
            for (var i = 0; i < 3 * $scope.kNumber + 1; i++) {
                $scope.masterFormCommas += ",";
            }
            $scope.myMinLength = (3 * $scope.kNumber) + 2;
            $scope.myMaxLength = (4 * $scope.kNumber) + 2;
        }
    };

    /*Funkcia pripravi pole objektov, ktore sa bude pouzivat pri simulacii(budu obsahovat udaje o pohyboch a zmenach na paskach orig. stroja)*/
    $scope.prepareSimulatingArray = function() {
        var tempArray = [];
        for (var i = 0; i < $scope.kNumber; i++) {
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


    /*TODO toto rozdelit, robi to blbosti - tym ze sa to vola 2 krat, v mode 2 to prependne 2* tie medzery. Taktiez je to moc chaoticke. Asi to bude lacnejsie rozdelit na viac funkcii, lebo ajtak sa vsetko robi v tych ifoch podstatne.*/
    /*Funkcia volana v stavoch CHOOSE. Pre value 1 zacne simulaciu modu 1. Pre 2 skoci do DELTA, pre 3 zacne simulaciu MODU 2. Je garantovane, ze v slovach sa nepouzivaju ciarky ako symbol */
    $scope.startSimulation = function(value) {
        $scope.simulatingArray = $scope.prepareSimulatingArray();
        /*TODO toto upravit - kod je tu duplicitny, nejakinak to vymysliet TODO
    	  
    	  
			na zaciatku sa pred kazdy string pasky pridaju medzery, tak aby sa pohodlne vykreslovalo. Toto sa mozno nebude robit cez stringy ale cez polia. Este neviem    	  
    	  */
        $scope.kSourceTapes[0] = "        " + $scope.kSourceTapes[0];
        for (var i = 1; i < $scope.kNumber; i++) {
            $scope.kSourceTapes[i] = "                 " + $scope.kSourceTapes[i];
        }

        /*pre kSourceTapes vyrobime negativearrays*/
        for (var i = 0; i < $scope.kNumber; i++) {
            $scope.simulationStorageTapeArray.push(new NegativeArray());
            /*prvu pasku naplnime doplna, alebo viac , podla toho, ci uzivatel zadal dostatocne dlhe vstupne slovo*/
            if (i === 0) {
                var endOfCopy = Math.max($scope.kSourceTapes[0].length - 8, 9);
                /*$window.alert(endOfCopy);*/
                for (var j = 0; j < $scope.kSourceTapes[0].length; j++) {
                    $scope.simulationStorageTapeArray[0].add(j, new StorageNode(" ", $scope.kSourceTapes[0].charAt(j + 8)));
                    /*$window.alert("addujem slovo");*/
                }
                for (var r = $scope.kSourceTapes[0].length; r < endOfCopy; r++) {
                    $scope.simulationStorageTapeArray[0].add(r, new StorageNode(" ", " "));
                    /*$window.alert("addujem medzery napravo");*/
                }
                for (var f = 1; f < endOfCopy; f++) {
                    /*$window.alert("addujem vlavo");*/
                    $scope.simulationStorageTapeArray[0].add(-f, new StorageNode(" ", " "));
                }
            } else {
                for (var j = -8; j < 9; j++) {
                    /*$window.alert("tu ani niesom");*/
                    $scope.simulationStorageTapeArray[i].add(j, new StorageNode(" ", " "));
                }
            }
        }
        /*takto to bolo predtzm a fungovalo. Je to nejaka blbost ye to vobec slo*/
        /*for(var i = 0; i < $scope.kNumber; i++){
		  	   $scope.simulationStorageTapeArray.push(new NegativeArray());

		  	   if(i == 0){
		  	   	 var endOfCopy = Math.max($scope.kSourceTapes[0].length-8,j < 9);
		  	       for(var j = -8; j < endOfCopy;j++){
					     $scope.simulationStorageTapeArray[0].add(j,new StorageNode(" ",$scope.kSourceTapes[0].charAt(j+8)));
		  	       }         
		  	   } else {
					 for(var j = -8; j < 9;j++){
					     $scope.simulationStorageTapeArray[i].add(j,new StorageNode(" "," "));
		  	       } 		  	   
		  	   }
        }*/

        if (value == 1) {
            $scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
            simulationService.kNumber.value = $scope.kNumber;
            simulationService.kSourceTapes.value = $scope.kSourceTapes;
            simulationService.mode.value = $scope.stateEnum.MODE_1_SIMULATE;
            simulationService.isActive.value = true;
            simulationService.simulatingArray.value = $scope.simulatingArray;
            simulationService.simulationStorageTapeArray.value = $scope.simulationStorageTapeArray;


            /*} else if (value == 2) {
                $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
                $scope.resetDelta();*/
        } else {
            $scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
            simulationService.kNumber.value = $scope.kNumber;
            simulationService.deltaFunction.value = $scope.deltaFunction;
            simulationService.kSourceTapes.value = $scope.kSourceTapes;
            simulationService.mode.value = $scope.stateEnum.MODE_2_SIMULATE;
            simulationService.simulatingArray.value = $scope.simulatingArray;
            simulationService.isActive.value = true;
            simulationService.simulationStorageTapeArray.value = $scope.simulationStorageTapeArray;
        }

        /*if (value == 1) {
        		simulationService.addK($scope.kNumber);
				simulationService.addKSourceTapes($scope.kSourceTapes);
        		simulationService.addMode($scope.stateEnum.MODE_1_SIMULATE);
        		simulationService.setActive();
            $scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
        } else if (value == 2) {
            $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
            $scope.resetDelta();
        } else {
        		
        		simulationService.addK($scope.kNumber);
        		simulationService.addDeltaFunction($scope.DeltaFunction);
				
				simulationService.addKSourceTapes($scope.kSourceTapes);
        		simulationService.addMode($scope.stateEnum.MODE_2_SIMULATE);
        		simulationService.setActive();
        		 
            $scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
        }*/
    };

    /*Funkcie na dynamicke pridavanie a davanie prec inputov pre deltafunkciu*/
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
        /*overime determinizmus*/
        /*$window.alert($scope.deltaFunction.length);*/
        for (var i = 0; i < $scope.deltaFunction.length; i++) {
            for (var j = i + 1; j < $scope.deltaFunction.length; j++) {
                /*if (i == j) {
                    continue
                }*/
                if ($scope.deltaFunction[i].originalState == $scope.deltaFunction[j].originalState && $scope.deltaFunction[i].reading.toString() === $scope.deltaFunction[j].reading.toString()) {
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
    }

    /*Funkcia na zaregistrovanie noveho objektu deltafunkcie(vytvara sa z stringu ). Zaroven vykonava vstrupnu kontrolu, ci je vstup korektny*/
    $scope.registerDelta = function(deltaTempRow) {
        /*$window.alert('aspomtusom')*/
        var arr = deltaTempRow.value.split(",");
        var errLog = "";
        var deltaInvalid = {
            'value': false
        };
        if (arr.length != 3 * $scope.kNumber + 2) {
            /*$scope.*/
            deltaInvalid.value = true;
            errLog += "Zlá dĺžka vstupu. ";
        }
        /*toto mozno netreba - mozno povolime viacznakove stavy TODO*/
        if (arr[0].length != 1) {
            /*$scope.*/
            deltaInvalid.value = true;
            errLog += "Stav musí mať 1 znak. ";
        }
        /*tieto _state premenne su iba tempy, preto nepouzivaju camelcase*/
        var orig_state = arr[0];
        var reading = [];
        for (var i = 1; i < 1 + $scope.kNumber; i++) {
            if (arr[i].length != 1) {
                /*$scope.*/
                deltaInvalid.value = true;
                errLog += "Hlava môže čítať práve jeden znak. Problém je v čítaní " + (i - 1) + " pásky. ";
            } else {
                reading.push(arr[i]);
            }
        }
        /*toto sa mozno tiez vyhodi - mozno povolime viacznakove stavy TODO*/
        if (arr[1 + $scope.kNumber].length != 1) {
            /*$scope.*/
            deltaInvalid.value = true;
            errLog += "Nový stav môže byť len 1 znak. ";
        } else {
            var new_state = arr[1 + $scope.kNumber];
        }


        var printing = [];
        for (var i = $scope.kNumber + 2; i < 2 + 2 * $scope.kNumber; i++) {
            if (arr[i].length != 1) {
                /*$scope.*/
                deltaInvalid.value = true;
                errLog += "Hlava môže písať práve jeden znak. Problém je v prepisovaní " + (i - $scope.kNumber + 2) + " pásky. ";;
            } else {
                printing.push(arr[i]);
            }
        }
        var moving = [];
        for (var i = 2 + 2 * $scope.kNumber; i < 2 + 3 * $scope.kNumber; i++) {
            if (arr[i] == "0" || arr[i] == "-1" || arr[i] == "1") {
                moving.push(arr[i]);
            } else {
                /*$scope.*/
                deltaInvalid.value = true;
                errLog += "Pohyb hlavy môže byť označovaný len -1 0 1. Problém je s hlavou " + (i - 2 + 2 * $scope.kNumber) + ". ";
            }
        }
        if ( /*$scope.*/ deltaInvalid.value == true) {
            return errLog;
        }
        /*$scope.*/
        deltaInvalid.value = false;
        /*$window.alert('pushujem');*/
        $scope.deltaFunction.push(new Delta(orig_state, reading, new_state, printing, moving));
        return true;
        /*$scope.resetDelta();*/
    };

}]);