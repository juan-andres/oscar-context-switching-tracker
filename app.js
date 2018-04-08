/**
  TODOs
  - Update tab every minute
  - Record how many interrupts and how long each (DONE)
  - Disable `start new activity` btn if no text is present
  - Allow user to input the name of the interruption
  - Add multi device support
**/
import {Activity, STATUS} from './source/Activity.js';

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
    this.user = null;
    this.currentActivity = null;
    this.history = [];
    initTypeahead();

    $('#start_btn').click(this.startNewActivityHandler.bind(this));
    $('#finish_btn').click(this.finishCurrentActivityHandler.bind(this));
    $('#plan_pause_btn').click(this.playPauseCurrentActivityHandler.bind(this));
  }

  setUser(user) {
    this.user = user;
    this.loadHistory();
  }

  loadHistory() {
    if (!this.user) return;

    firebase.database().ref(this.user.uid).once('value').then((snapshot) => {
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
    if (!this.user) return;

    var database = firebase.database();

    var newActivityKey = firebase.database().ref().child(this.user.uid).push().key;

    // TODO Interruptions are themselves activities. In the data modal, maybe just
    // save the ids of those activities and flatten this structure so we don't end
    // storing activities under activities.

    database.ref().update({
      [`/${this.user.uid}/${newActivityKey}`]: this.currentActivity
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

// Initialize Firebase
var config = {
  apiKey: "AIzaSyAGEIlTMdtha_J1a4dl1PwGH19-KPK2XK0",
  authDomain: "context-switching.firebaseapp.com",
  databaseURL: "https://context-switching.firebaseio.com",
  projectId: "context-switching",
  storageBucket: "context-switching.appspot.com",
  messagingSenderId: "354313127993"
};
firebase.initializeApp(config);

// TODO make this prettier
let USER = null;

function onAuthStateChanged(user) {
  if (user) {
    USER = user
    console.log('user', USER)
    $('.login').text(`Logout ${USER.displayName}`);
    app.setUser(USER);
  } else {
    USER = null;
    $('.login').text(`Login`);
    if (app.currentActivity || app.history.length) {
      location.reload();
    }
  }
}

firebase.auth().onAuthStateChanged(onAuthStateChanged.bind(this));

$('.login').click(() => {
  if (USER) {
    firebase.auth().signOut();
  } else {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  }
});

const app = new App();
app.draw();
