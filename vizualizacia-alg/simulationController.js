app.controller('simulationController', ['$scope','simulationService',function ($scope,simulationService) {
	
	/*if(simulationService.isActive){
		$scope.kNumber = simulationService.getK();
		$scope.kSourceTracks = simulationService.getKSourceTracks();		
		
		$scope.mode = simulationService.getMode();	
		if($scope.mode == 6){
			$scope.deltaFunction = simulationService.getDeltaFunction();
		}
		$scope.activeSimulation = true
	}
	*/
	$scope.activeSimulation = false;	
	
	$scope.mode;
	/*Kolko paskovy stroj chceme simulovat*/
    $scope.kNumber;
    /*pole obsahujuce stringy vstupnych slov na k paskach*/
    $scope.kSourceTracks;
    /*pole objektov deltafunkcii*/
    $scope.deltaFunction;
    
    
    
    if(simulationService.isActive){
		$scope.kNumber = simulationService.kNumber;
		$scope.kSourceTracks = simulationService.kSourceTracks;		
		
		$scope.mode = simulationService.mode;	
		if($scope.mode == 6){
			$scope.deltaFunction = simulationService.deltaFunction;
		}
		$scope.activeSimulation = true
	}
}]);