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
	/*Validovacia funkcia do formularu, ktory spracuva k od uzivatela*/
	$scope.kNotValid = function(value) {
		return ($value > 0) && ($value<=30);
	};
	/*funkcia volana z formularu nastavujuceho k. Nastavi k, inicializuje vstupne pasky a nastavi dalsi STATE*/
	$scope.setKMode = function(mode,kValue) {
			// $scope.k = kValue;
			for (var i = 0; i < kNumber; i++) {
				$scope.kSourceTracks.push("");	
			}
			if(mode == 1){
				$scope.currentState = $scope.stateEnum.MODE_1_CHOOSE_INPUT;
			} else {
				$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_INPUT;
			}
	};
	/*Funkcia volana v stavoch CHOOSE. Pre value 1 zacne simulaciu modu 1. Pre 2 skoci do DELTA, pre 3 zacne simulaciu MODU 2 */
	$scope.startSimulation = function(value){
		if(value == 1){
			$scope.currentState = $scope.stateEnum.MODE_1_SIMULATE;
		} else if(value == 2) {
			$scope.currentState = $scope.stateEnum.MODE_2_CHOOSE_DELTA;
		} else {
			$scope.currentState = $scope.stateEnum.MODE_2_SIMULATE;
		}
	};
});