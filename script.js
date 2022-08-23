"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

///////////////////////////////////////////////////////////////////////

////////////// Workout class
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.discription = `${this.type === "running" ? "Running" : "Cycling"} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

////////////// Running class
class Running extends Workout {
  type = "running";
  constructor(distance, duration, coords, cadance) {
    super(distance, duration, coords);
    this.cadance = cadance;
    this._calcPace();
    this._setDiscription();
  }

  _calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
    return this.pace;
  }
}

////////////// Cycling class
class Cycling extends Workout {
  type = "cycling";
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._calcSpeed();
    this._setDiscription();
  }

  _calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
    return this.speed;
  }
}

////////////// App class
class App {
  #mapEvent;
  #map;
  #workouts = [];
  #mapZoomLevel = 12;
  #dropBtns;
  #btnsClear;
  constructor() {
    // Get data from local storage
    this._getLocalStorage();
    this.#dropBtns = document.querySelectorAll(".dropbtn");
    this.#btnsClear = document.querySelectorAll(".clear");

    // Load map
    this._loadMap();

    /////////////////////////////
    // Atach event handlers

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    // Open dropdowns by click on dropbtn
    this.#dropBtns.forEach((dropBtn) => {
      dropBtn.addEventListener("click", this._showDropdown);
    });

    // Close dropdowns by click anywhere
    document.body.addEventListener("click", this._closeDropdowns, true);

    // Clear all workouts
    this.#btnsClear.forEach((clear) =>
      clear.addEventListener("click", this._clearAllWorkouts)
    );
  }

  _loadMap() {
    const tehranCoords = [35.7114346, 51.3529667];
    this.#map = L.map("map").setView(tehranCoords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // handling click on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideform() {
    inputDistance.value = "";
    inputCadence.value = "";
    inputDuration.value = "";
    inputElevation.value = "";
    inputDistance.blur();
    inputCadence.blur();
    inputDuration.blur();
    inputElevation.blur();

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    // get data from form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout is running, create running object
    if (type === "running") {
      const cadance = +inputCadence.value;
      // check if data is valid
      if (
        duration <= 0 ||
        distance <= 0 ||
        cadance <= 0 ||
        !(duration + distance + cadance)
      )
        return alert("Inputs have to be positive numbers");

      workout = new Running(distance, duration, [lat, lng], cadance);
    }

    // if workout is cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (duration <= 0 || distance <= 0 || !(duration + distance + elevation))
        return alert("Duration and distance have to be positive numbers");

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // add new object to workouts array
    this.#workouts.push(workout);

    // render workout on map as marker
    this._renderWorkoutMarker(workout);

    // render workout on the list
    this._renderWorkoutInList(workout);

    // hide form and clear inputs
    this._hideform();

    // set locale storage
    this._setLocalStorage();

    // update dropbtns
    this.#dropBtns = document.querySelectorAll(".dropbtn");
    this.#dropBtns.forEach((dropBtn) => {
      dropBtn.addEventListener("click", this._showDropdown);
    });

    // update Clear all workouts
    this.#btnsClear = document.querySelectorAll(".clear");
    this.#btnsClear.forEach((clear) =>
      clear.addEventListener("click", this._clearAllWorkouts)
    );
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 350,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃" : "🚴‍♀️"} ${workout.discription}`
      )
      .openPopup();
  }

  _renderWorkoutInList(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <div class="dropdown">
    <ul
      class="dropbtn icons btn-right showLeft"
    >
      <li></li>
      <li></li>
      <li></li>
    </ul>

    <div id="myDropdown" class="dropdown-content">
      <a href="javascript:void(0)" class="edit">Edit</a>
      <a href="javascript:void(0)" class="delete">Delete</a>
      <a href="javascript:void(0)" class="clear">Clear all workouts</a>
    </div>
  </div>
          <h2 class="workout__title">
            ${workout.discription}
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃" : "🚴‍♀️"
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `;
    } else {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🗻</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `;
    }

    form.insertAdjacentHTML("afterend", html);
    form.classList.add("hidden");
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((workout) => {
      this._renderWorkoutInList(workout);
    });
  }

  _showDropdown() {
    this.nextElementSibling.classList.toggle("show");
  }

  _closeDropdowns(e) {
    if (!e.target.matches("dropbtn"))
      document
        .querySelectorAll(".dropdown-content")
        .forEach((d) => d.classList.remove("show"));
  }

  _clearAllWorkouts() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
