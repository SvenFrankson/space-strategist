enum ResourceType {
    Rock,
    Steel,
    Cristal
}

class Player {

    public currentRock: number = 100;
    public currentSteel: number = 100;
    public currentCristal: number = 50;

    public addCurrentResource(amount: number, type: ResourceType): void {
        if (type === ResourceType.Rock) {
            this.currentRock += amount;
        }
        else if (type === ResourceType.Steel) {
            this.currentSteel += amount;
        }
        else if (type === ResourceType.Cristal) {
            this.currentCristal += amount;
        }
    }

    public subtractCurrentResource(amount: number, type: ResourceType): void {
        if (type === ResourceType.Rock) {
            this.currentRock -= amount;
        }
        else if (type === ResourceType.Steel) {
            this.currentSteel -= amount;
        }
        else if (type === ResourceType.Cristal) {
            this.currentCristal -= amount;
        }
    }

    public setCurrentResource(value: number, type: ResourceType): void {
        if (type === ResourceType.Rock) {
            this.currentRock = value;
        }
        else if (type === ResourceType.Steel) {
            this.currentSteel = value;
        }
        else if (type === ResourceType.Cristal) {
            this.currentCristal = value;
        }
    }
}