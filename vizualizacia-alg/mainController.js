
/*service injection nefunguje*/
app.controller('mainController', ['$scope','simulationService',function($scope, simulationService) {

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
    $scope.kSourceTracks = [];
    /*Najskor sa nachadzame v stave BEGINNING, to sa bude casom menit. CurrentState obsahuje aktualny stav*/
    $scope.currentState = $scope.stateEnum.BEGINNING
        /*pole objektov deltafunkcii*/
    $scope.deltaFunction = [];
    /*pole stringov, ktore budu pri submitnuti otestovane a pretransformovane do deltafunkcnych objektov TMP*/
    $scope.deltaArrayTemp = [];
    /*templat pre vyplnanie formularu deltafunkcie*/
    $scope.masterFormCommas = "";

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
    $scope.deltaInvalid = {
        value: false
    };
    /*funkcia volana z formularu nastavujuceho k. Nastavi k, inicializuje vstupne pasky a nastavi dalsi STATE*/
    $scope.setKMode = function(mode, kValue) {
        $scope.kNumber = kValue;
        for (var i = 0; i < $scope.kNumber; i++) {
            $scope.kSourceTracks.push("");
        }
        if (mode == 1) {
            $scope.currentState = $scope.stateEnum.MODE_1_CHOOSE_INPUT;
            $scope.le = $scope.kSourceTracks.length
        } else {
            $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_INPUT;
            for (var i = 0; i < 3 * $scope.kNumber + 1; i++) {
                $scope.masterFormCommas += ",";
            }
            $scope.myMinLength = (3 * $scope.kNumber) + 2;
            $scope.myMaxLength = (4 * $scope.kNumber) + 2;
        }
    };
    /*Funkcia volana v stavoch CHOOSE. Pre value 1 zacne simulaciu modu 1. Pre 2 skoci do DELTA, pre 3 zacne simulaciu MODU 2. Je garantovane, ze v slovach sa nepouzivaju ciarky ako symbol */
    $scope.startSimulation = function(value) {
        if (value == 1) {
        		simulationService.kNumber.value = $scope.kNumber;
				simulationService.kSourceTracks.value = $scope.kSourceTracks;
        		simulationService.mode.value = $scope.stateEnum.MODE_1_SIMULATE;
        		simulationService.isActive.value = true;
            $scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
        } else if (value == 2) {
            $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
            $scope.resetDelta();
        } else {
        		simulationService.kNumber.value = $scope.kNumber;
        		simulationService.deltaFunction.value =$scope.deltaFunction;
				
				simulationService.kSourceTracks.value = $scope.kSourceTracks;
        		simulationService.mode.value = $scope.stateEnum.MODE_2_SIMULATE;
        		simulationService.isActive.value = true;
        		 
            $scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
        }
        
        /*if (value == 1) {
        		simulationService.addK($scope.kNumber);
				simulationService.addKSourceTracks($scope.kSourceTracks);
        		simulationService.addMode($scope.stateEnum.MODE_1_SIMULATE);
        		simulationService.setActive();
            $scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
        } else if (value == 2) {
            $scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
            $scope.resetDelta();
        } else {
        		
        		simulationService.addK($scope.kNumber);
        		simulationService.addDeltaFunction($scope.DeltaFunction);
				
				simulationService.addKSourceTracks($scope.kSourceTracks);
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
        var success;
        var overallSuccess = true;
        var determinism = true;
        /*vsetkz riadkz pretavime do objektov deltafunkcii*/
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
        var errLog = "Chyba nedeterminizmu pri páskach: ";
        /*overime determinizmus*/
        for (var i = 0; i < $scope.deltaFunction.length; i++) {
            for (var j = i + 1; j < $scope.deltaFunction.length; j++) {
                /*if (i == j) {
                    continue
                }*/
                if ($scope.deltaFunction[i].originalState == $scope.deltaFunction[j].originalState && $scope.deltaFunction[i].toString() === $scope.deltaFunction[j].toString()) {
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
        var arr = deltaTempRow.value.split(",");
        var errLog = "";
        if (arr.length != 3 * $scope.kNumber + 2) {
            $scope.deltaInvalid.value = true;
            errLog += "Zlá dĺžka vstupu. ";
        }
        /*toto moyno netreba TODO*/
        if (arr[0].length != 1) {
            $scope.deltaInvalid.value = true;
            errLog += "Stav musí mať 1 znak. ";
        }
        var orig_state = arr[0];
        var reading = [];
        for (var i = 1; i < 1 + $scope.kNumber; i++) {
            if (arr[i].length != 1) {
                $scope.deltaInvalid.value = true;
                errLog += "Hlava môže čítať práve jeden znak. Problém je v čítaní " + (i - 1) + " pásky. ";
            } else {
                reading.push(arr[i]);
            }
        }
        /*toto sa možno tiež vyhodí*/
        if (arr[1 + $scope.kNumber].length != 1) {
            $scope.deltaInvalid.value = true;
            errLog += "Nový stav môže byť len 1 znak. ";
        } else {
            var new_state = arr[1 + $scope.kNumber];
        }


        var printing = [];
        for (var i = $scope.kNumber + 2; i < 2 + 2 * $scope.kNumber; i++) {
            if (arr[i].length != 1) {
                $scope.deltaInvalid.value = true;
                errLog += "Hlava môže písať práve jeden znak. Problém je v prepisovaní " + (i - $scope.kNumber + 2) + " pásky. ";;
            } else {
                reading.push(arr[i]);
            }
        }
        var moving = [];
        for (var i = 2 + 2 * $scope.kNumber; i < 2 + 3 * $scope.kNumber; i++) {
            if (arr[i] == "0" || arr[i] == "-1" || arr[i] == "1") {
                reading.push(arr[i]);
            } else {
                $scope.deltaInvalid.value = true;
                errLog += "Pohyb hlavy môže byť označovaný len -1 0 1. Problém je s hlavou " + (i - 2 + 2 * $scope.kNumber) + ". ";
            }
        }
        if ($scope.deltaInvalid.value == true) {
            return errLog;
        }
        $scope.deltaInvalid.value = false;
        $scope.deltaFunction.push(new delta(orig_state, reading, new_state, printing, moving));
        return true;
        /*$scope.resetDelta();*/
    };

}]);