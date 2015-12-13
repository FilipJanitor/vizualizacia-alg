app.controller('mainController', function($scope) {
    
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
	/*templat pre vyplnanie formularu deltafunkcie*/
	$scope.masterFormCommas = "";
	/*Validovacia funkcia do formularu, ktory spracuva k od uzivatelaNEBUDE SA POUZIVAT*/
	$scope.kNotValid = function(value) {
		return ($value > 0) && ($value<=30);
	};
	/*reseter temp. stringu delta funkcie na ciarky*/
	$scope.deltaTemp = {value:""};
    $scope.resetDelta = function() {
        $scope.deltaTemp.value = angular.copy($scope.masterFormCommas);
    };
    $scope.deltaInvalid = {value:false};
	/*funkcia volana z formularu nastavujuceho k. Nastavi k, inicializuje vstupne pasky a nastavi dalsi STATE*/
	$scope.setKMode = function(mode,kValue) {
			$scope.kNumber = kValue;
			for (var i = 0; i < $scope.kNumber; i++) {
				$scope.kSourceTracks.push("");	
			}
			if(mode == 1){
				$scope.currentState = $scope.stateEnum.MODE_1_CHOOSE_INPUT;
				$scope.le = $scope.kSourceTracks.length
			} else {
				$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_INPUT;
				for(var i = 0; i < 3*$scope.kNumber+1; i++){
					$scope.masterFormCommas += ",";				
				}
			}
	};
	/*Funkcia volana v stavoch CHOOSE. Pre value 1 zacne simulaciu modu 1. Pre 2 skoci do DELTA, pre 3 zacne simulaciu MODU 2. Je garantovane, ze v slovach sa nepouzivaju ciarky ako symbol */
	$scope.startSimulation = function(value){
		if(value == 1){
			$scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
		} else if(value == 2) {
			$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
			$scope.resetDelta();
		} else {
			$scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
		}
	};
	
	
	/*Funkcia na zaregistrovanie noveho objektu deltafunkcie. Zaroven vykonava vstrupnu kontrolu, ci je vstup korektny*/
	$scope.registerDelta = function() {
		  var arr = $scope.deltaTemp.value.split(",");
		  if(arr.length != 3*$scope.kNumber+2){
				$scope.deltaInvalid.value = true;	  
				return 0;
		  }
		  if(arr[0].length != 1){
			$scope.deltaInvalid.value = true;	  
			return 0;
		  }         
        var orig_state = arr[0];
        var reading = [];
        for(var i = 1; i < 1+$scope.kNumber; i++){
				if(arr[i].length != 1){
					$scope.deltaInvalid.value = true;	  
					return 0;
				}        		
        		reading.push(arr[i]);
        }
        
        if(arr[1+$scope.kNumber].length != 1){
					$scope.deltaInvalid.value = true;	  
					return 0;
				} 
        var new_state = arr[1+$scope.kNumber];
        
        var printing = [];
        for(var i = $scope.kNumber+2; i < 2+2*$scope.kNumber; i++){
        	   if(arr[i].length != 1){
					$scope.deltaInvalid.value = true;	  
					return 0;
				} 
        		reading.push(arr[i]);
        }
        var moving = [];
        for(var i = 2+2*$scope.kNumber; i < 2+2*$scope.kNumber; i++){
        		if(arr[i]=="0"||arr[i]=="-1"||arr[i]=="1"){
        			reading.push(arr[i]);
        		} else {
					$scope.deltaInvalid.value = true;	  
					return 0;
        		}
        }
        $scope.deltaInvalid.value = false;
        $scope.deltaFunction.push(new delta(orig_state,reading,new_state,printing,moving));
        $scope.resetDelta();
    };
	
});