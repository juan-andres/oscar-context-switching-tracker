const STATUS = {
  RECORDING: 1,
  INTERRUPTED: 2,
  FINISHED: 3,
};

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
  constructor(data) {
    this.name = data.name;
    this.status = data.status || STATUS.INTERRUPTED;
    this.startTimeStamp = data.startTimeStamp || Date.now();
    this.finishTimeStamp = data.finishTimeStamp || null;

    let interruptions = [];
    if (data.interruptions) {
      data.interruptions.forEach(interruption => interruptions.push(new Activity(interruption)));
    }

    this.interruptions = interruptions || []; // Activities
  }

  pause() {
    if (this.status === STATUS.INTERRUPTED) return;
    this.status = STATUS.INTERRUPTED;

    const interruption = new Activity({name: 'interruption:custom name'});
    interruption.record();
    this.interruptions.push(interruption);
  }

  record() {
    if (this.status === STATUS.RECORDING) return;
    this.status = STATUS.RECORDING;
    this._finishLastInterruption()
  }

  toggle() {
    switch (this.status) {
      case STATUS.INTERRUPTED:
        this.record();
        break;
      case STATUS.RECORDING:
        this.pause();
        break;
      default:
        throw 'This is an undefined state: ' + this.status;
    }
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

export {
  Activity,
  STATUS,
};
