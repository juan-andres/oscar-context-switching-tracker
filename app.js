/**
  TODOs
  - Update tab every minute
  - Record how many interrupts and how long each (DONE)
**/

const STATUS = {
  RECORDING: 1,
  PAUSED: 2,
  FINISHED: 3,
  IDLING: 4, // can't pause/unpaused
};

const $current_activity = document.getElementById('current_activity');
const $activity_input = document.getElementById('activity_input');
const $start_btn = document.getElementById('start_btn');
const $finish_btn = document.getElementById('finish_btn');
const $interrupt_btn = document.getElementById('interrupt_btn');
const $continue_btn = document.getElementById('continue_btn');
const $activity_log = document.getElementsByClassName('activity_log')[0];
const $debug = document.getElementsByClassName('debug')[0];

class Activity {
  constructor(name, status) {
    this.name = name;
    this.status = status;
    this.startTimeStamp = Date.now();
    this.finishTimeStamp = -1;
    this.interruptions = []; // Activities
  }

  pause() {
    if (this.status === STATUS.IDLING || this.status === STATUS.PAUSED) return;
    this.status = STATUS.PAUSED;
    // TODO allow user to input the name of the interruption
    this.interruptions.push(new Activity('interruption:custom name'));
  }

  unpause() {
    if (this.status === STATUS.IDLING || this.status !== STATUS.PAUSED) return;
    this.status = STATUS.RECORDING;
    if (this.interruptions.length > 0) {
      const lastInterruption = this.interruptions[this.interruptions.length - 1];
      lastInterruption.finish();
    }
  }

  finish() {
    this.unpause();
    this.status = STATUS.FINISHED;
    this.finishTimeStamp = Date.now();
    return this;
  }

  toString() {
    return `${this.name} ${this.prettyDuration()}`;
  }

  static prettyTime(ms) {
    // DEBUGGING
    // const seconds = (ms / 1000) | 0;
    // return `${seconds}s`;

    const mins = ((ms / 60000) | 0) % 60;
    const seconds = ((ms / 1000) | 0) % 60;
    if (mins !== 0) {
      const hours = (ms / 3600000) | 0;
      return hours !== 0 ? `${hours}h ${mins}m` : `${mins}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  prettyDuration() {
    const activityMs = this.duration();

    if (this.status === STATUS.IDLING) {
      return `${Activity.prettyTime(activityMs)} idling...`;
    }

    const nInterruptions = this.interruptions.length;
    const totalInterruptedMs = this.interruptionsDuration();

    return `${Activity.prettyTime(activityMs)} (interrupted ${nInterruptions} times ${Activity.prettyTime(totalInterruptedMs)} )`;
  }

  duration() {
    const finishTimeStamp = this.status === STATUS.FINISHED ? this.finishTimeStamp : Date.now();
    const totalElapsedTime = finishTimeStamp - this.startTimeStamp;
    return totalElapsedTime - this.interruptionsDuration();
  }

  interruptionsDuration() {
    return this.interruptions.reduce((sum, i) => {return sum + i.duration()}, 0);
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
    $continue_btn.addEventListener('click', this.unpauseCurrentActivity.bind(this));
  }

  logCurrentActivity() {
    if (this.currentActivity && this.currentActivity.status !== STATUS.FINISHED) {
      const $activity = document.createElement('li');
      $activity.innerHTML = this.currentActivity.finish().toString();;
      $activity_log.insertBefore($activity, $activity_log.firstChild);
    }
  }

  startNewActivity() {
    // TODO (juanandres) disable if not input
    this.logCurrentActivity();
    if (this.currentActivity) {
      this.history.push(this.currentActivity);
    }
    this.currentActivity = new Activity($activity_input.value, STATUS.RECORDING);
    $activity_input.value = null;
    $finish_btn.classList.remove("hidden");
    $interrupt_btn.classList.remove("hidden");
  }

  finishCurrentActivity() {
    this.logCurrentActivity();
    this.unpauseCurrentActivity();
    $finish_btn.classList.add("hidden");
    this.currentActivity.finish();

    this.history.push(this.currentActivity);
    this.currentActivity = new Activity('Waiting for work ...', STATUS.IDLING);
    $interrupt_btn.classList.add("hidden");
  }

  pauseCurrentActivity() {
    if (!this.currentActivity || this.currentActivity.status === STATUS.PAUSED) return;
    $interrupt_btn.classList.toggle("hidden");
    $continue_btn.classList.toggle("hidden");
    this.currentActivity.pause();
  }
  unpauseCurrentActivity() {
    if (!this.currentActivity || this.currentActivity.status !== STATUS.PAUSED) return;
    $interrupt_btn.classList.toggle("hidden");
    $continue_btn.classList.toggle("hidden");
    this.currentActivity.unpause();
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
