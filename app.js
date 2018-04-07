/**
  TODOs
  - Update tab every minute
  - Record how many interrupts and how long each (DONE)
  - Disable `start new activity` btn if no text is present
  - Allow user to input the name of the interruption
**/
import {Activity, STATUS} from '/source/Activity.js';

const TYPEAHEAD_ENGINE = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  local: ['development', 'code review', 'reading', 'social media']
});

function initTypeahead() {
  $('#activity_input').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'activities',
    source: TYPEAHEAD_ENGINE
  });
}

class App {
  constructor() {
    this.currentActivity = null;
    this.history = [];
    this.loadHistory();
    initTypeahead();

    $('#start_btn').click(this.startNewActivityHandler.bind(this));
    $('#finish_btn').click(this.finishCurrentActivityHandler.bind(this));
    $('#plan_pause_btn').click(this.playPauseCurrentActivityHandler.bind(this));
  }

  loadHistory() {
    firebase.database().ref('/activities/').once('value').then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const newActivity = new Activity(childSnapshot.val());
        this.logActivity(newActivity);
        TYPEAHEAD_ENGINE.add(newActivity.name);
      });
    });
  }

  logActivity(activity) {
    this.history.push(activity);
    this.addCurrentActivityToTable(activity);
  }

  addCurrentActivityToTable(activity) {
    $('#activity_table:first-child').prepend(`<tr><td>${activity.toString()}</td></tr>`);
  }

  saveCurrentActivity() {
    var database = firebase.database();

    var newActivityKey = firebase.database().ref().child('activities').push().key;

    // TODO Interruptions are themselves activities. In the data modal, maybe just
    // save the ids of those activities and flatten this structure so we don't end
    // storing activities under activities.

    database.ref().update({
      ['/activities/'+ newActivityKey]: this.currentActivity
    });
  }

  setNewCurrentActivity() {
    this.currentActivity = new Activity({name: $('#activity_input').val()});
    this.currentActivity.record();
    $('#activity_input').val(null);
  }

  startNewActivityHandler() {
    if (this.currentActivity) {
      this.finishCurrentActivity();
    }
    this.setNewCurrentActivity();

    $('.card').show();
    $('#play_pause_btn').text('Interrupt');
  }

  finishCurrentActivity() {
    this.currentActivity.finish();
    this.logActivity(this.currentActivity);
    this.saveCurrentActivity();
    TYPEAHEAD_ENGINE.add(this.currentActivity.name);
    this.currentActivity = null;
  }

  finishCurrentActivityHandler() {
    this.finishCurrentActivity();

    $('.card').hide();
  }

  playPauseCurrentActivityHandler() {
    if (!this.currentActivity) return;

    this.currentActivity.toggle();

    $('#play_pause_btn').text(this.currentActivity.status === STATUS.RECORDING ? 'Interrupt' : 'Continue');
  }

  // TODO (juanandres) not proud of this of course!
  // Figure out a better way to do this refresh thing... or maybe this is good?
  draw() {
    setInterval(() => {
        if (this.currentActivity) {
          $('#current_activity_label').html(this.currentActivity.toString());
        }
    }, 500)
  }
}

const app = new App();
app.draw();
