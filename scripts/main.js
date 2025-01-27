import { LiftSystem } from './lift-system.js';

let liftSystem = null;

document.getElementById('startBtn').addEventListener('click', () => {
    // Get number of floors and lifts from input fields
    const numFloors = parseInt(document.getElementById('numFloors').value);
    const numLifts = parseInt(document.getElementById('numLifts').value);

    // Validate input
    if (numFloors >= 2 && numFloors <= 10 && numLifts >= 1 && numLifts <= 5) {
        document.getElementById('configContainer').style.display = 'none';
        document.getElementById('simulationContainer').style.display = 'block';
        liftSystem = new LiftSystem(numFloors, numLifts);
    } else {
        alert('Please enter valid numbers for floors (2-10) and lifts (1-5)');
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    if (liftSystem) {
        liftSystem.cleanup();
        liftSystem = null;
    }
    
    // Reset containers
    document.getElementById('configContainer').style.display = 'block';
    document.getElementById('simulationContainer').style.display = 'none';
    
    // Clear the lifts container
    const liftsContainer = document.getElementById('liftsContainer');
    if (liftsContainer) {
        liftsContainer.innerHTML = '';
    }
    
    // Clear the floors container
    const floorsContainer = document.getElementById('floorsContainer');
    if (floorsContainer) {
        floorsContainer.innerHTML = '';
    }
});
