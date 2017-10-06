/**
  TODOs
  - Update tab every minute
  - Record how many interrupts and how long each (DONE)
  - Disable `start new activity` btn if no text is present
**/

const STATUS = {
  RECORDING: 1,
  INTERRUPTED: 2,
  FINISHED: 3,
};

const $current_activity = document.getElementById('current_activity');
const $activity_input = document.getElementById('activity_input');
const $activity_log = document.getElementsByClassName('activity_log')[0];

const $start_btn = document.getElementById('start_btn');
const $finish_btn = document.getElementById('finish_btn');
const $interrupt_btn = document.getElementById('interrupt_btn');
const $continue_btn = document.getElementById('continue_btn');

function prettyTime(ms) {
  const mins = ((ms / 60000) | 0) % 60;
  const seconds = ((ms / 1000) | 0) % 60;
  if (mins > 0) {
    const hours = (ms / 3600000) | 0;
    return hours !== 0 ? `${hours}h ${mins}m` : `${mins}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

class Activity {
  constructor(name) {
    this.name = name;
    this.status = STATUS.PAUSED;
    this.startTimeStamp = Date.now();
    this.finishTimeStamp = null;
    this.interruptions = []; // Activities
  }

  pause() {
    if (this.status === STATUS.PAUSED) return;
    this.status = STATUS.PAUSED;
    // TODO allow user to input the name of the interruption
    const interruption = new Activity('interruption:custom name');
    interruption.record();
    this.interruptions.push(interruption);
  }

  record() {
    if (this.status === STATUS.RECORDING) return;
    this.status = STATUS.RECORDING;
    this._finishLastInterruption()
  }

  finish() {
    if (this.status === STATUS.FINISH) return;
    this.status = STATUS.FINISHED;
    this._finishLastInterruption();
    this.finishTimeStamp = Date.now();
    return this;
  }

  _finishLastInterruption() {
    if (this.interruptions.length > 0) {
      const lastInterruption = this.interruptions[this.interruptions.length - 1];
      lastInterruption.finish();
    }
  }

  toString() {
    const activityMs = this.elapsedTime();
    const interruptionsMs = this.interruptionsTime();
    const nInterruptions = this.interruptions.length;
    return `${this.name} ${prettyTime(activityMs - interruptionsMs)} (interrupted ${nInterruptions} times ${prettyTime(interruptionsMs)} )`;
  }

  elapsedTime() {
    const finishTimeStamp = this.status === STATUS.FINISHED ? this.finishTimeStamp : Date.now();
    return finishTimeStamp - this.startTimeStamp;
  }

  interruptionsTime() {
    return this.interruptions.reduce((sum, i) => {return sum + i.elapsedTime()}, 0);
  }
}

class App {
  constructor() {
    this.currentActivity = null;
    this.history = [];

    // Event listeners
    $start_btn.addEventListener('click', this.startNewActivity.bind(this));
    $finish_btn.addEventListener('click', this.finishCurrentActivity.bind(this));
    $interrupt_btn.addEventListener('click', this.pauseCurrentActivity.bind(this));
    $continue_btn.addEventListener('click', this.continueCurrentActivity.bind(this));
  }

  logCurrentActivity() {
    this.history.push(this.currentActivity);
    const $activity = document.createElement('li');
    $activity.innerHTML = this.currentActivity.toString();
    $activity_log.insertBefore($activity, $activity_log.firstChild);
  }

  startNewActivity() {
    if (this.currentActivity) {
      this.currentActivity.finish();
      this.logCurrentActivity();
    }
    this.currentActivity = new Activity($activity_input.value);
    this.currentActivity.record();

    $activity_input.value = null;
    $finish_btn.classList.remove("hidden");
    $interrupt_btn.classList.remove("hidden");
    $continue_btn.classList.add("hidden");
  }

  finishCurrentActivity() {
    if (this.currentActivity) {
      this.currentActivity.finish();
      this.logCurrentActivity();
    }

    $finish_btn.classList.add("hidden");
    $interrupt_btn.classList.add("hidden");
    $continue_btn.classList.add("hidden");

    this.currentActivity = null;
  }

  pauseCurrentActivity() {
    if (!this.currentActivity) return;
    this.currentActivity.pause();
    $interrupt_btn.classList.add("hidden");
    $continue_btn.classList.remove("hidden");
  }
  continueCurrentActivity() {
    if (!this.currentActivity) return;
    this.currentActivity.record();
    $interrupt_btn.classList.remove("hidden");
    $continue_btn.classList.add("hidden");
  }

  // TODO (juanandres) not proud of this of course!
  // Figure out a better way to do this refresh thing... or maybe this is good?
  draw() {
    setInterval(() => {
        if (this.currentActivity) {
          $current_activity.innerHTML = this.currentActivity.toString();
        }
    }, 500)
  }
}

const app = new App();
app.draw();
