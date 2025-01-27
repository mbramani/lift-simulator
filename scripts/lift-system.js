export class LiftSystem {
    constructor(numFloors, numLifts) {
        this.numFloors = numFloors;
        this.numLifts = numLifts;
        this.floorHeight = 120; // matches CSS floor height
        this.lifts = [];
        this.requests = new Map(); // floor -> direction
        this.activeRequests = new Set();
        this.initialize();
    }

    initialize() {
        this.createBuilding();
        this.createLifts();
        this.startSystem();
        this.initializeAudio();
    }

    initializeAudio() {
        this.doorSound = new Audio('assets/door-sound.mp3');
        this.arrivalSound = new Audio('assets/arrival-ding.mp3');
        
        // Set audio properties
        this.doorSound.preservesPitch = false;
        this.arrivalSound.preservesPitch = false;
    }
    
    cleanup() {
        // Stop and cleanup audio
        if (this.doorSound) {
            this.doorSound.pause();
            this.doorSound.currentTime = 0;
            this.doorSound = null;
        }
        if (this.arrivalSound) {
            this.arrivalSound.pause();
            this.arrivalSound.currentTime = 0;
            this.arrivalSound = null;
        }

        // Clear all intervals and timeouts
        if (this.systemInterval) {
            clearInterval(this.systemInterval);
            this.systemInterval = null;
        }

        // Clear requests
        this.requests.clear();
        this.activeRequests.clear();
        
        // Remove lift elements
        this.lifts.forEach(lift => {
            if (lift.element && lift.element.parentNode) {
                lift.element.parentNode.removeChild(lift.element);
            }
        });
        this.lifts = [];
    }
    
    playDoorSound() {
        if (this.doorSound) {
            this.doorSound.currentTime = 0;
            this.doorSound.play().catch(err => console.log('Error playing door sound:', err));
        }
    }

    playArrivalSound() {
        if (this.arrivalSound) {
            this.arrivalSound.currentTime = 0;
            this.arrivalSound.play().catch(err => console.log('Error playing arrival sound:', err));
        }
    }
    
    createBuilding() {
        const floorsContainer = document.getElementById('floorsContainer');
        floorsContainer.innerHTML = '';

        // Create floors (top to bottom)
        for (let i = this.numFloors; i >= 1; i--) {
            floorsContainer.appendChild(this.createFloor(i));
        }
    }

    createFloor(floorNum) {
        const floor = document.createElement('div');
        floor.className = 'floor';

        const floorInfo = document.createElement('div');
        floorInfo.className = 'floor-info';

        const floorNumber = document.createElement('div');
        floorNumber.className = 'floor-number';
        floorNumber.textContent = `Floor ${floorNum}`;

        const buttons = document.createElement('div');
        buttons.className = 'floor-buttons';

        // Add up buttons if not on top floor
        if (floorNum < this.numFloors) {
            const upBtn = document.createElement('button');
            upBtn.className = 'floor-button up';
            upBtn.textContent = '▲';
            upBtn.onclick = () => this.addRequest(floorNum, 'up');
            buttons.appendChild(upBtn);
        }

        // Add down button if not on bottom floor
        if (floorNum > 1) {
            const downBtn = document.createElement('button');
            downBtn.className = 'floor-button down';
            downBtn.textContent = '▼';
            downBtn.onclick = () => this.addRequest(floorNum, 'down');
            buttons.appendChild(downBtn);
        }

        // Add floor info to floor element
        floorInfo.appendChild(floorNumber);
        floorInfo.appendChild(buttons);
        floor.appendChild(floorInfo);

        return floor;
    }

    createLifts() {
        const liftsContainer = document.getElementById('liftsContainer');
        liftsContainer.innerHTML = '';

        const liftWidth = 80;
        const spacing = (liftsContainer.clientWidth - (this.numLifts * liftWidth)) / (this.numLifts + 1);

        for (let i = 0; i < this.numLifts; i++) {
            const lift = {
                id: i,
                currentFloor: 1,
                targetFloor: null,
                direction: null,
                status: 'idle',
                element: this.createLiftElement(i, spacing, liftWidth)
            };
            this.lifts.push(lift);
            this.updateLiftPosition(lift);
        }
    }

    createLiftElement(index, spacing, width) {
        const lift = document.createElement('div');
        lift.className = 'lift';
        lift.id = `lift-${index}`;
        lift.style.left = `${spacing + (width + spacing) * index}px`;

        const doors = document.createElement('div');
        doors.className = 'doors';

        const leftDoor = document.createElement('div');
        leftDoor.className = 'door left';

        const rightDoor = document.createElement('div');
        rightDoor.className = 'door right';

        // Add doors to lift
        doors.appendChild(leftDoor);
        doors.appendChild(rightDoor);
        lift.appendChild(doors);

        document.getElementById('liftsContainer').appendChild(lift);
        return lift;
    }

    updateLiftPosition(lift) {
        const bottomPosition = (this.numFloors - lift.currentFloor) * this.floorHeight;
        lift.element.style.transform = `translateY(${bottomPosition}px)`;
    }

    addRequest(floor, direction) {
        const key = `${floor}-${direction}`;
        if (!this.requests.has(key) && !this.activeRequests.has(key)) {
            this.requests.set(key, { floor, direction, time: Date.now() });
            this.updateButtons(floor, direction, true);
        }
    }

    updateButtons(floor, direction, active) {
        const floorIndex = this.numFloors - floor;
        const button = document.querySelector(
            `.floor:nth-child(${floorIndex + 1}) .floor-button.${direction}`
        );
        if (button) {
            if (active) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    }
    
    async startSystem() {
        setInterval(() => this.processRequests(), 100);
    }
    
    findNearestIdle() {
        const pendingRequest = this.requests.values().next().value;
        if (!pendingRequest) return null;

        return this.lifts
            .filter(lift => lift.status === 'idle')
            .reduce((nearest, lift) => {
                if (!nearest) return lift;
                const currentDistance = Math.abs(lift.currentFloor - pendingRequest.floor);
                const nearestDistance = Math.abs(nearest.currentFloor - pendingRequest.floor);
                return currentDistance < nearestDistance ? lift : nearest;
            }, null);
    }

    async processRequests() {
        if (this.requests.size === 0) return;

        // Find an idle lift
        const idleLift = this.findNearestIdle();
        if (!idleLift) return;

        // Get the oldest request
        const [key, request] = Array.from(this.requests.entries())[0];
        
        // Mark this request as being serviced
        this.activeRequests.add(key);
        this.requests.delete(key);

        // Move the lift
        await this.moveLift(idleLift, request.floor);
        
        // Remove from active requests after completion
        this.activeRequests.delete(key);
    }

    async moveLift(lift, targetFloor) {
        // Update lift status
        lift.status = 'moving';
        lift.targetFloor = targetFloor;

        // Calculate movement duration
        const floorsToTravel = Math.abs(targetFloor - lift.currentFloor);
        const duration = floorsToTravel * 2; // 2 seconds per floor

        // Animate movement
        lift.element.style.transition = `transform ${duration}s linear`;
        lift.currentFloor = targetFloor;
        this.updateLiftPosition(lift);

        // Wait for movement
        await new Promise(resolve => setTimeout(resolve, duration * 1000));

        this.playArrivalSound();

        // Handle doors
        this.playDoorSound();
        await this.operateDoors(lift, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.playDoorSound();
        await this.operateDoors(lift, false);

        this.updateButtons(targetFloor, 'up', false);
        this.updateButtons(targetFloor, 'down', false);

        lift.targetFloor = null;
        lift.status = 'idle';
    }

    async operateDoors(lift, open) {
        // Update lift status and animate doors
        return new Promise(resolve => {
            if (open) {
                lift.element.classList.add('doors-open');
            } else {
                lift.element.classList.remove('doors-open');
            }
            setTimeout(resolve, 2500);
        });
    }

}