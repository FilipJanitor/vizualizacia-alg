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

	$scope.activeSimulation = false;	
	
	$scope.mode = {};

    $scope.kNumber = {};

    $scope.kSourceTracks = {};

    $scope.deltaFunction = {};*/
    
    /**/
   
    
   /*if(simulationService.isActive){*/
		$scope.kNumber= simulationService.kNumber;
		$scope.kSourceTracks = simulationService.kSourceTracks;		
		
		$scope.mode = simulationService.mode;	
		if($scope.mode.value == 6){
			$scope.deltaFunction = simulationService.deltaFunction;
		}
		$scope.activeSimulation = simulationService.isActive;
		$scope.simulatingArray = simulationService.simulatingArray;

		const FIXED_WIDTH = 800;
		 $scope.canvasWidth = FIXED_WIDTH;
    $scope.canvasHeight = 80*2*$scope.kSourceTracks.value + 100;
    
    
		
		
	/*}*/
}]);