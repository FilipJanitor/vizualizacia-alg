var app = angular.module("App", []);

/*konstruktor pre objekt riadka deltafunkcie*/
function Delta(original_state, reading, new_state, printing, moving) {
	this._originalState = original_state;
	this._reading = reading;
	this._newState = new_state;
	this._printing = printing;
	this._moving = moving;

	this.getOriginalState = function() {
		return this._originalState;
	};
	this.getReading = function() {
		return this._reading;
	};
	this.getNewState = function() {
		return this._newState;
	};
	this.getPrinting = function() {
		return this._printing;
	};
	this.getMoving = function() {
		return this._moving;
	};
};

/*konstruktor pre objekt jedneho stlpca (dvoch stvorcekov pod sebou) na jednej stope storage pasky*/
function StorageNode(upper_level, lower_level) {
	/*Zatial kvoli vykreslovaniu pouzivame ako blank medzeru. Pouzivatel ju nebude moct dat do vstupu, takze je to rozumny blank asi*/
	/*stale sa k tomu pristupuje, tak to necham bez geterov a seterov*/
	this.upperLevel = upper_level;
	this.lowerLevel = lower_level;
	/*0 node je plny. 1 - node je poloprazdy. 2 - node je prazdny*/
	this.isEmpty = function() {
		if (this.upperLevel === " " && this.lowerLevel === " ") {
			return 2;
		}
		if (this.upperLevel === " " || this.lowerLevel === " ") {
			return 1;
		} else {
			return 0;
		}
	};
};

/*Nase specialne pole - ma aj negativne indexy a bude sa pouzivat na vykreslovanie. Nechceme nim prekryt vsetky polia, preto nemenime protoyp array. Toto je skor taky container.*/
/*Invariant pre na se pouzitie je aby bolo vzdy maximalny pozitivny aj negativny index rovnaky*/
function NegativeArray() {
	this.__positive = [];
	this.__negative = [];
	/*tato funkcia silently overwritne to co tam je povodne*/
	this.add = function(index, val) {
		if (typeof index == "number" && Math.round(index) === index) { /*zistime ci je to integer*/
			if (index >= 0) {
				this.__positive[index] = val;
			} else {
				this.__negative[(-index) - 1] = val;
			}
		} else {
			console.log("indexing to array must be done with integer");
		}
	};
	this.get = function(index) {
		if (typeof index == "number" && Math.round(index) === index) { /*zistime ci je to integer*/
			if (index >= 0) {
				return this.__positive[index];
			} else {
				return this.__negative[(-index) - 1];
			}
		} else {
			console.log("indexing to array must be done with integer - returning null");
			return null;
		}
	};

	/*tieto funkcie predpokladaju, ze pole obsahuje 0. Ak nie, budu sa robit diery. Ale pasky su konstruovbane tak, ze home row je na nule, teda situacia, ked by sa to pokazilo nevznikne*/
	this.ePush = function(val) {
		this.__positive.push(val);
	};
	this.ePop = function() {
		return this.__positive.pop();
	};
	this.bPush = function(val) {
		this.__negative.push(val);
	};
	this.bPop = function(val) {
		return this.__negative.pop();
	};
	this.positiveLength = function() {
		return this.__positive.length;
	};
	this.negativeLength = function() {
		return this.__negative.length + 1;
	};
	this.getLength = function() {
		return this.__positive.length + this.__negative.length + 1;
	};
};

/*objekt, v ktorom si pamatame interval <) ktory bude vykreslovany na paskach stroja. Pre kazdu pasku originalneho bude jeden a budeme pomocou neho vykreslovat.(pomocou in range)*/
function MachineView() {
	this._beginning = 0;
	this._end = 17;
	this.changeInterval = function(beg, end) {
		this._beginning = beg;
		this._end = end;
	};
	this.getCurrentHeadPosition = function() {
		return this._beginning + 8;
	};
	this.moveRight = function() {
		this._beginning++;
		this._end++;
	};
	this.moveLeft = function() {
		this._beginning--;
		this._end--;
	};
	this.getBeginning = function() {
		return this._beginning;
	};
	this.getEnd = function() {
		return this._end;
	};
};

/*Objekt, obsahuci vsetky potrebne informacie pre podkrok simulacie. Je tvoreny mainsimulation funkciou a citany nextstepom*/
function StepInformationContainer(step_state, original_track, block_number, overwrite_symbol) {
	this._stepState = step_state;
	this._indexOfOriginalTrack = original_track;
	this._iBlockNumber = block_number;
	this._overwriteSymbol = overwrite_symbol;
	this.getStepState = function() {
		return this._stepState;
	};
	this.getIndexOfOriginalTrack = function() {
		return this._indexOfOriginalTrack;
	};
	this.getIBlockNumber = function() {
		return this._iBlockNumber;
	};
	this.getOverwriteSymbol = function() {
		return this._overwriteSymbol;
	};
	this.getStepState = function() {
		return this._stepState;
	};
}

/*Objekt stvorceka*/
function printingSquare(_x, _y) {
	this.x = _x;
	this.y = _y;
};