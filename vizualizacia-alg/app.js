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
function storageNode(upper_level,lower_leverl){
	 /*predpokladame, ze oba su stringy, aspon prazdne - je to vec implementatora*/
	 /*todo, pouzit medzeru, alebo nic?*/
	 this.upperLevel = upper_level;
	 this.lowerLevel = lowerLevel;
	 this.isEmpty = function(){
	 	  return (this.upperLevel === "" && this.lowerLevel==="")
	 };
};
/*Nase specialne divne pole - ma aj negativne indexy a bude sa pouzivat na vykreslovanie. Nechceme nim prekryt vsetky polia, lebo by to robilo sarapatu. Toto je skor taky container. Asi bude dobre do toho zaondit kSourcetracks*/
function negativeArray() {
    this.__positive = [];
	 this.__negative = [];
	 this.add(index,val) = function () {
	 	  if(typeof index == "number" && Math.round(index) === index){ /*zistime ci je to integer*/
			   if(index >= 0){
					 this.__positive[index] =val;
			   }	 	  
			   else{
				    this._negative[(-index)-1] =val;		   
			   }
	 	  }	
	 };
	 this.length = this.__positive.length + this._negative.length;
	 this.get(index) = function () {
	 	  if(typeof index == "number" && Math.round(index) === index){ /*zistime ci je to integer*/
			   if(index >= 0){
					 return this.__positive[index];
			   }	 	  
			   else{
				    return this._negative[(-index)-1];		   
			   }
	 	  }	
	 };
    this.ePush(val) = function () {
	 	  this.__positive.push(val);	
	 };
    this.ePop() = function () {
	 	  return this.__positive.pop();	
	 };
    this.bPush(val) = function () {
	 	  this.__negative.push(val);	
	 };
    this.bPop(val) = function () {
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

function originalMachineView() {
	this.beginning = 0;
	this.end = 17;
};
