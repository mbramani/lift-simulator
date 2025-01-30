import { LiftSystem } from "./lift-system.js";

let liftSystem = null;

document.getElementById("startBtn").addEventListener("click", () => {
  // Get number of floors and lifts from input fields
  const numFloors = parseInt(document.getElementById("numFloors").value);
  const numLifts = parseInt(document.getElementById("numLifts").value);

  // Validate input
  if (numFloors > 0 && numLifts > 0) {
    if (liftSystem) {
      liftSystem.cleanup();
    }
    try {
      liftSystem = new LiftSystem(numFloors, numLifts);
      document.getElementById("simulationContainer").style.display = "block";
      document.getElementById("configContainer").style.display = "none";
    } catch (error) {
      console.error("Failed to initialize lift system:", error);
      alert("Failed to start simulation. Please try again.");
    }
  } else {
    alert("Please enter positive numbers for floors and lifts");
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (liftSystem) {
    liftSystem.cleanup();
    liftSystem = null;
  }

  // Reset containers
  document.getElementById("configContainer").style.display = "block";
  document.getElementById("simulationContainer").style.display = "none";

  // Clear the lifts container
  const liftsContainer = document.getElementById("liftsContainer");
  if (liftsContainer) {
    liftsContainer.innerHTML = "";
  }

  // Clear the floors container
  const floorsContainer = document.getElementById("floorsContainer");
  if (floorsContainer) {
    floorsContainer.innerHTML = "";
  }
});
