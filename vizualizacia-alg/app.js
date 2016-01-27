var app = angular.module("App", []); 

/*konstruktor pre objekt deltafunkcia*/	
function delta(original_state, reading, new_state, printing, moving) {
    this.original_state = original_state;
    this.reading = reading;
    this.new_state = new_state;
    this.printing = printing;
    this.moving = moving;
}