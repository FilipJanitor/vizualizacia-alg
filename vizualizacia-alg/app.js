var app = angular.module("App", []); 

/*za konstruktory dodane bodkociarky*/

/*konstruktor pre objekt deltafunkcia*/	
function delta(original_state, reading, new_state, printing, moving) {
    this.original_state = original_state;
    this.reading = reading;
    this.new_state = new_state;
    this.printing = printing;
    this.moving = moving;
};
/*konstruktor pre objekt jednehostlpca (dvoch riadkov) na jednej stopre storage pasky*/
function storageNode(upper_level,lower_level){
	 /*predpokladame, ze oba su stringy, aspon prazdne - je to vec implementatora*/
	 /*Zatial kvoli vykreslovaniu pouzivame ako blank medzeru. Pouzivatel ju nebude moct dat do vstupu, takze je to rozumny blank asi*/
	 this.upperLevel = upper_level;
	 this.lowerLevel = lower_level;
	 this.isEmpty = function(){
	 	  return (this.upperLevel === " " && this.lowerLevel === " ")
	 };
};
/*Nase specialne divne pole - ma aj negativne indexy a bude sa pouzivat na vykreslovanie. Nechceme nim prekryt vsetky polia, lebo by to robilo sarapatu. Toto je skor taky container. Asi bude dobre do toho zaondit kSourcetracks*/
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
	 	  return this.__negative.length;	
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
};
