app.controller('simulationController', ['$scope', 'simulationService', function($scope, simulationService) {

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

    $scope.deltaFunction = {};

    */
    
    
    /*Pomocne polia na spravne vykreslenie*/


    /*Objekty s datami, ktore su odoslane cez service z maincontrolleru. Obsahuju presne to, co aj tam - aj nazvy su rovnake*/
    
    $scope.reducedMachineCopyTapeOffset = {'value':0};
    $scope.neededHeightOfSvg={'value':0};
    $scope.kNumber = simulationService.kNumber;
    $scope.kSourceTracks = simulationService.kSourceTracks;

    $scope.mode = simulationService.mode;
    if ($scope.mode.value == 6) {
        $scope.deltaFunction = simulationService.deltaFunction;
    }
    $scope.activeSimulation = simulationService.isActive;
    $scope.simulatingArray = simulationService.simulatingArray;


	 $scope.originalMachinePrintingArray = [];
	 $scope.reducedMachineStorageTapePrintingArray = [];

	 	 
	 	 
    /*Watch, ktory spravne nastavi prazdne polia na vykreslovanie, ked sa nastavi kNumber. 
    Robi sa to takto, pretoze kNumber sa pocas simulacie menit nebude, na rozdiel od ksourcetracks,
     takze nebude treba spracuvat tolko eventov - tento by sa mal invariantne spustit prave raz pocaz celeho pouzitia aplikacie(raz pri spusteni a inicializovani tohoto controlleru, ale to nepocitame)*/
	 $scope.$watch('kNumber.value', function() {
        for(var i = 0; i < $scope.kNumber.value; i++){
            $scope.originalMachinePrintingArray.push({'value':40+i*60});
        }
        /*Premenna, znaciaca zaciatok pasok redukovaneho automatu - mozno bude dobre ju dat priamo do scope, aby sa dala pouzit aj v naslednom vykreslovani*/
        var storageTapeOffset = 40 + 40 +$scope.kNumber.value*60;
        /*kriz nad home column sa bude posuvat, teda do tychto objektov nepatri*/
        for(var i = 0; i < $scope.kNumber.value; i++){
            $scope.reducedMachineStorageTapePrintingArray.push({'value':storageTapeOffset+i*80});
            $scope.reducedMachineStorageTapePrintingArray.push({'value':storageTapeOffset+40+i*80});
        }    
        $scope.reducedMachineCopyTapeOffset.value = storageTapeOffset+40+(80*$scope.kNumber.value);
        $scope.neededHeightOfSvg.value = $scope.reducedMachineCopyTapeOffset.value + 100;
    },true);

}]);