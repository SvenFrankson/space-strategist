enum Resource {
    Rock,
    Steel,
    Cristal
}

class Player {

    public currentRock: number = 100;
    public currentSteel: number = 100;
    public currentCristal: number = 50;

    public addCurrentResource(amount: number, type: Resource): void {
        if (type === Resource.Rock) {
            this.currentRock += amount;
        }
        else if (type === Resource.Steel) {
            this.currentSteel += amount;
        }
        else if (type === Resource.Cristal) {
            this.currentCristal += amount;
        }
    }

    public setCurrentResource(value: number, type: Resource): void {
        if (type === Resource.Rock) {
            this.currentRock = value;
        }
        else if (type === Resource.Steel) {
            this.currentSteel = value;
        }
        else if (type === Resource.Cristal) {
            this.currentCristal = value;
        }
    }
}