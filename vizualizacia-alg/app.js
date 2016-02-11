var app = angular.module("App", []); 
/*TODO< PREMENOVAT KONSTRUKTORY NA ZACINAJUCE VELKYM PISMENKOM. PRIVATE VARIABLES SPRAVIT AKO IMAGINARY PRIVATE - POUZIT PODTRZNIK A VYTVORIT GETERY A SETERY*/
/*za konstruktory dodane bodkociarky*/

/*konstruktor pre objekt deltafunkcia*/	
/*TODO asi nejake getery a setery*/
function delta(original_state, reading, new_state, printing, moving) {
    this.originalState = original_state;
    this.reading = reading;
    this.newState = new_state;
    this.printing = printing;
    this.moving = moving;
};
/*konstruktor pre objekt jednehostlpca (dvoch riadkov) na jednej stopre storage pasky*/
function storageNode(upper_level,lower_level){
	 /*predpokladame, ze oba su stringy, aspon prazdne - je to vec implementatora*/
	 /*Zatial kvoli vykreslovaniu pouzivame ako blank medzeru. Pouzivatel ju nebude moct dat do vstupu, takze je to rozumny blank asi*/
	 this.upperLevel = upper_level;
	 this.lowerLevel = lower_level;
	 /*Pre nase potreby, potrebujeme robit rozdiel medzi uplne prazdnym node a takym, co ma zaplneny iba spodny riadok. Konvencia je nasledovna - 0 node je plny. 1 - node je poloprazdy. 2 - node je prazdny*/
	 this.isEmpty = function(){
	 	if(this.upperLevel === " " && this.lowerLevel === " "){
	 		return 2;
	 	} if (this.upperLevel === " " || this.lowerLevel === " ") {
	 		return 1;
	 	} else {
			return 0;	 	
	 	}
	 };
};
/*Nase specialne divne pole - ma aj negativne indexy a bude sa pouzivat na vykreslovanie. Nechceme nim prekryt vsetky polia, lebo by to robilo sarapatu. Toto je skor taky container. Asi bude dobre do toho zaondit kSourcetracks*/
/*asi je dobre, aby bolo vzdy maximalny pozitivny aj negativny index rovnaky*/
function negativeArray() {
    this.__positive = [];
	 this.__negative = [];
	 /*tato funkcia silently overwritne to co tam je povodne*/
	 this.add = function (index,val) {
	 	  if(typeof index == "number" && Math.round(index) === index){ /*zistime ci je to integer*/
			   if(index >= 0){
					 this.__positive[index] =val;
			   }	 	  
			   else{
				    this.__negative[(-index)-1] =val;		   
			   }
	 	  }	
	 };
	 this.length = this.__positive.length + this.__negative.length;
	 this.get = function (index) {
	 	  if(typeof index == "number" && Math.round(index) === index){ /*zistime ci je to integer*/
			   if(index >= 0){
					 return this.__positive[index];
			   }	 	  
			   else{
				    return this.__negative[(-index)-1];		   
			   }
	 	  } else {
	 	  	   return null;
	 	  }
	 };
	 
	 /*tieto funkcie predpokladaju, ze pole obsahuje 0. Ak nie, budu sa robit diery. Ale pasky su konstruovbane tak, ze home row je na nule, teda situacia, ked by sa to pokazilo nevznikne*/
    this.ePush = function (val) {
	 	  this.__positive.push(val);	
	 };
    this.ePop = function () {
	 	  return this.__positive.pop();	
	 };
    this.bPush = function (val) {
	 	  this.__negative.push(val);	
	 };
    this.bPop = function (val) {
	 	  return this.__negative.pop();	
	 };
	 this.positiveLength = function () {
	 	  return this.__positive.length;	
	 };	 
	 this.negativeLength = function () {
	 	  return this.__negative.length+1;	
	 };	 
	 /*todo - more functions*/	 
	 
};
    /*objekt, v ktorom si pamatame interval <) ktory bude vykreslovany na paskach orig stroja. Pre kazdu pasku bude jeden a budeme pomocou neho vykreslovat.(pomocou in range)*/

function machineView() {
	this.beginning = 0;
	this.end = 17;
	this.changeInterval = function (beg,end) {
	 	  this.beginning = beg;
	     this.end = end;	
	};
	this.getCurrentHeadPosition = function () {
		  return this.beginning+8;
	};
	this.moveRight = function () {
		  this.beginning++;
		  this.end++;
	};
	this.moveLeft = function () {
		  this.beginning--;
		  this.end--;
	};
};

/*funkcia co prepise stringu character na danom indexe. Nechcem ju pouzivat, lebo chcem posielat referenciou nie hodnotou MOMENTALNE JU NEPOUZIVAM*/
function overwriteCharacterInString(character,index,string) {
	if(character.lenght != 1 || string.length < 1 || string.length < index){
		  return null;	
	}
	else {
		  var arr = string.split("");
		  arr[index]=character;
		  string = arr.join();
		  return string;
	}
};

/*TODO getery a setery*/
/*Objekt, obsahuci vsetky potrebne informacie pre podkrok simulacie. Je tvoreny mainsimulation funkciou a citany nextstepom*/
function stepInformationContainer(step_state,original_track,block_number,overwrite_symbol) {
	this.stepState = step_state;
	this.indexOfOriginalTrack = original_track;
	this.iBlockNumber = block_number;
	this.overwriteSymbol

}




