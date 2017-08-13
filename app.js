// TODO (juanandres) Test if accumulating time gives me overflows :X
// (using seconds is ok, since it is practically impossible I can focus on
// something for over a week!)
const STATE = {
    accumulatedTime: 0,
    startTime: Date.now(),
    interruptedTime: 0,
    startInterruptedTime: Date.now(),
    status: 'RECORDING',
    currentActivity: 'looking at the floor',
};

const $current_activity = document.getElementById('current_activity');

const $activity_input = document.getElementById('activity_input');
const $start_btn = document.getElementById('start_btn');
const $finish_btn = document.getElementById('finish_btn');
const $interrupt_btn = document.getElementById('interrupt_btn');
const $continue_btn = document.getElementById('continue_btn');

const $activity_log = document.getElementsByClassName('activity_log')[0];
const $debug = document.getElementsByClassName('debug')[0];

// Event listeners
$start_btn.addEventListener('click', start);
$finish_btn.addEventListener('click', finish);
$interrupt_btn.addEventListener('click', pause);
$continue_btn.addEventListener('click', unpause);

function start() {
  // TODO (juanandres) disable if not input
  logActivity();
  STATE.status = 'RECORDING';
  STATE.currentActivity = $activity_input.value;
  $activity_input.value = null;

  STATE.accumulatedTime = 0;
  STATE.startTime = Date.now();

  STATE.interruptedTime = 0;
  STATE.startInterruptedTime = 0;
}

function finish() {
  logActivity();
  STATE.status = 'RECORDING';
  STATE.currentActivity = 'idling; waiting for work';

  STATE.accumulatedTime = 0;
  STATE.startTime = Date.now();

  STATE.interruptedTime = 0;
  STATE.startInterruptedTime = 0;
}

function pause() {
  if (STATE.status === 'PAUSED') return;
  STATE.status = 'PAUSED';
  STATE.accumulatedTime += (Date.now() - STATE.startTime);
  STATE.startTime = 0;

  STATE.startInterruptedTime = Date.now();
}
function unpause() {
  if (STATE.status === 'RECORDING') return;
  STATE.status = 'RECORDING';
  STATE.startTime = Date.now();
  STATE.interruptedTime += Date.now() - STATE.startInterruptedTime;
  STATE.startInterruptedTime = 0;
}

function calcSecsFromNow(accumulatedTime, startTime) {
  return ((accumulatedTime + (Date.now() - startTime))/1000)|0
}

function getActivityPretty() {
  let secs, interruptedSecs;
  if (STATE.status === 'RECORDING') {
    secs = calcSecsFromNow(STATE.accumulatedTime, STATE.startTime);
    interruptedSecs = (STATE.interruptedTime/1000)|0;
  } else {
    secs = (STATE.accumulatedTime/1000)|0;
    interruptedSecs = calcSecsFromNow(STATE.interruptedTime, STATE.startInterruptedTime);
  }
  return STATE.currentActivity + ':' + secs + ':' + interruptedSecs;
}

function logActivity() {
    const $activity = document.createElement('li');
    $activity.innerHTML = getActivityPretty();
    $activity_log.insertBefore($activity, $activity_log.firstChild);
}

// TODO (juanandres) not proud of this of course!
function draw() {
    setInterval(() => {
        // $debug.innerHTML = JSON.stringify(STATE, null, 2);
        console.log(STATE);
        $current_activity.innerHTML = getActivityPretty();
    }, 1000)
}

draw();
