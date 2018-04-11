(function(global) {
  'use strict';

  var MAX_CARDS = 4;
  var COLORS = ['white', 'red', 'yellow', 'green'];

  global.app = new App(document.querySelector('.app'));


  function App(node) {
    var self = this;

    this.node = node;
    this.playButton = document.querySelector('.play');
    this.pauseButton = document.querySelector('.pause');
    this.stopButton = document.querySelector('.stop');
    this.ribbonLink = document.querySelector('.ribbon');

    this.box = null;
    this.countdown = null;
    this.edit = true;

    this.save = save;
    this.load = load;

    init();

    //
    // Public functions
    //
    function save() {
      var cards = self.box.cards.map(function(card) {
        return {
          color: card.color,
          time: card.time,
          mute: card.mute
        };
      });
      localStorage.setItem('tinlt', JSON.stringify(cards));
    }

    function load() {
      var cards = [], data = localStorage.getItem('tinlt');
      if (data) {
        cards = JSON.parse(data);
      }
      for (var i = 0; i < cards.length; i++) {
        if (i > 0) {
          self.box.addCard(i, cards[i].color);
        }

        self.box.cards[i].setTime(cards[i].time);

        if (cards[i].mute) {
          self.box.cards[i].setMute(true);
        }
      }
    }

    //
    // Private functions
    //
    function init() {
      self.box = new Box({
        node: document.querySelector('.box'),
        onChange: self.save
      });
      self.box.addCard(0, 'white');
      self.countdown = new Countdown({
        node: document.querySelector('.countdown'),
        onEnd: onCountdownEnd
      });

      self.playButton.addEventListener('click', onPlayClick);
      self.pauseButton.addEventListener('click', onPauseClick);
      self.stopButton.addEventListener('click', onStopClick);

      window.addEventListener('resize', onResize);
      onResize();

      self.load();
    }

    function onResize() {
      var ratio = Math.min(window.innerHeight / 768, window.innerWidth / 1024);
      self.node.style.transform = 'scale(' + ratio + ')';
    }

    function onCountdownEnd() {
      hide(self.pauseButton);
      show(self.stopButton);
    }

    function onPlayClick() {
      hide(self.playButton);
      hide(self.ribbonLink);
      show(self.pauseButton);

      if (self.edit) {
        hide(self.box.node);
        show(self.countdown.node);
        self.edit = false;
        self.countdown.start(self.box.getSeconds(), self.box.getDings());
      } else {
        self.countdown.start(self.countdown.seconds);
      }
    }

    function onPauseClick() {
      hide(self.pauseButton);
      show(self.playButton);
      show(self.stopButton);
      self.countdown.pause();
    }

    function onStopClick() {
      self.countdown.stop();
      self.edit = true;
      hide(self.pauseButton);
      hide(self.stopButton);
      hide(self.countdown.node);
      show(self.playButton);
      show(self.ribbonLink);
      show(self.box.node);
    }
  }

  function Box(options) {
    var self = this;
    this.node = options.node;
    this.cards = [];
    this.addCard = addCard;
    this.removeCard = removeCard;
    this.getSeconds = getSeconds;
    this.getDings = getDings;

    //
    // Public functions
    //
    function addCard(index, color) {
      if (self.cards.length >= MAX_CARDS) {
        return;
      }

      // Insert element
      var newElement = document.createElement('div'),
        referenceElement = self.cards[index] ? self.cards[index].node : null;

      newElement.classList.add('card', index === 0 ? 'main-card' : 'sub-card');
      newElement.classList.add(color);
      self.node.insertBefore(newElement, referenceElement);

      // Create new Card object push into card list;
      var newCard = new Card({
        node: newElement,
        color: color,
        onDrag: onCardDrag,
        onChange: options.onChange
      });
      self.cards.splice(index, 0, newCard);
      self.cards.forEach(function(card, index) {
        card.index = index;
      });

      // Set new card time
      if (index === 0) {
        newCard.setTime({ min: 5 });
      } else {
        var prevCard = self.cards[index - 1],
          nextCard = self.cards[index + 1],
          prevTime = prevCard.time,
          nextTime = nextCard ? nextCard.time : { min: 0, sec: 0 },
          newTime = {};

        if (prevTime.min - nextTime.min > 1) {
          newTime = {
            min: Math.round((prevTime.min + nextTime.min) / 2)
          };
          newCard.setTime(newTime);
        } else {
          newTime = nextCard ? nextCard.nextTime() : { min: 0, sec: 15 };
          newCard.setTime(newTime);
        }

        for (var i = index - 1; i >= 0; i--) {
          if (timeToSeconds(self.cards[i].time) === timeToSeconds(self.cards[i + 1].time)) {
            self.cards[i].addTime();
            continue;
          }
          break;
        }
      }
    }

    function removeCard(index) {
      if (index === self.cards.length) {
        return;
      }
      var card = self.cards[index];
      card.unbindListeners();
      self.node.removeChild(card.node);
      self.cards.splice(index, 1);
      self.cards.forEach(function(card, index) {
        card.index = index;
      });
    }

    function getSeconds() {
      return timeToSeconds(self.cards[0].time);
    }

    function getDings() {
      return self.cards
        .map(function(card) {
          return card.index > 0 ?
            { seconds: timeToSeconds(card.time), color: card.color, mute: card.mute } :
            { seconds: 0, mute: card.mute };
        });
    }

    //
    // Private functions
    //
    function onCardDrag(card, direction) {
      if (direction === 'left') {
        self.addCard(card.index + 1, COLORS[self.cards.length]);
      } else if (direction === 'right') {
        self.removeCard(card.index + 1);
      } else if (direction === 'up') {
        var prevCard = self.cards[card.index - 1];
        if (!prevCard || timeToSeconds(prevCard.time) > timeToSeconds(card.nextTime())) {
          card.addTime();
        }
      } else if (direction === 'down') {
        var nextCard = self.cards[card.index + 1];
        if (!nextCard || timeToSeconds(nextCard.time) < timeToSeconds(card.nextTime(-1))) {
          card.minusTime();
        }
      }

      // save
      options.onChange();
    }
  }

  function Card(options) {
    var self = this;
    var mouseX, mouseY;

    this.node = options.node;
    this.minNode = null;
    this.secNode = null;
    this.bellNode = null;

    this.index = 0;
    this.color = options.color;
    this.time = {
      min: 0,
      sec: 0
    };
    this.mute = false;

    this.unbindListeners = unbindListeners;
    this.setTime = setTime;
    this.addTime = addTime;
    this.minusTime = minusTime;
    this.nextTime = nextTime;
    this.setMute = setMute;

    init();

    //
    // Public functions
    //
    function unbindListeners() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    function setTime(time) {
      if (time.min >= 0) { self.time.min = time.min; }
      if (time.sec >= 0) { self.time.sec = time.sec; }
      self.minNode.innerText = self.time.min;
      self.secNode.innerText = self.time.sec >= 10 ? self.time.sec : '0' + self.time.sec;
    }

    function addTime() {
      self.setTime(self.nextTime());
    }

    function minusTime() {
      self.setTime(self.nextTime(-1));
    }

    function nextTime(direction) {
      direction = typeof direction === 'undefined' ? 1 : direction;
      var time = {};
      if (self.index === 0) {
        time.min = self.time.min + 1 * direction;
        time.sec = 0;
        if (time.min === 100 || time.min === 0) {
          return self.time;
        }
      } else {
        time.min = self.time.min;
        time.sec = self.time.sec + 15 * direction;
        if (time.sec < 0) {
          time.min -= 1;
          time.sec = 45;
        } else if (time.sec === 60) {
          time.min += 1;
          time.sec = 0;
        }
        if (time.min === 99 || (time.min === 0 && time.sec === 0)) {
          return self.time;
        }
      }
      return time;
    }

    function setMute(mute) {
      self.mute = mute;
      if (self.mute) {
        self.bellNode.innerText = 'volume_mute';
        self.bellNode.classList.add('mute');
      } else {
        self.bellNode.innerText = 'volume_up';
        self.bellNode.classList.remove('mute');
      }
    }

    //
    // Private functions
    //
    function init() {
      self.node.addEventListener('mousedown', onMouseDown);
      self.node.addEventListener('wheel', onWheel);

      self.minNode = document.createElement('div');
      self.minNode.classList.add('min');
      self.node.appendChild(self.minNode);

      self.secNode = document.createElement('div');
      self.secNode.classList.add('sec');
      self.node.appendChild(self.secNode);

      self.bellNode = document.createElement('i');
      self.bellNode.classList.add('material-icons');
      self.bellNode.innerText = 'volume_up';
      self.bellNode.addEventListener('click', onMuteClick);
      self.bellNode.addEventListener('mousedown', function(e) { e.stopPropagation(); });
      self.node.appendChild(self.bellNode);
    }

    function onMuteClick(e) {
      self.setMute(!self.mute);

      // save
      options.onChange();
    }

    function onWheel(e) {
      options.onDrag(self, e.deltaY > 0 ? 'down' : 'up');
    }

    function onMouseDown(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      self.node.classList.add('grabbing');
      self.node.style.transform = 'scale(1.05)';
      self.node.style.zIndex = 10;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    function onMouseUp(e) {
      self.node.classList.remove('grabbing');
      self.node.style.transform = '';
      self.node.style.zIndex = 1;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      var moveX = fitRange(e.clientX - mouseX, -30, 30),
        moveY = fitRange(e.clientY - mouseY, -30, 30);
      if (moveX === 0 && moveY === 0) {
        return;
      }
      var direction = Math.abs(moveX) > Math.abs(moveY) ?
        (moveX > 0 ? 'right' : 'left') :
        (moveY > 0 ? 'down' : 'up');

      options.onDrag(self, direction);
    }

    function onMouseMove(e) {
      var moveX = fitRange(e.clientX - mouseX, -30, 30),
        moveY = fitRange(e.clientY - mouseY, -30, 30);
      self.node.style.transform = 'scale(1.05) translate(' + moveX + 'px,' + moveY + 'px)';
    }
  }

  function Countdown(options) {
    var self = this;
    var timerID = null;
    var startTime = null;

    this.node = options.node;
    this.mainNode = options.node.querySelector('.main');
    this.sideNode = options.node.querySelector('.side');
    this.dingNode = options.node.querySelector('.ding');
    this.seconds = 0;
    this.secondsPassed = 0;
    this.dings = [];

    this.start = start;
    this.stop = stop;
    this.pause = pause;
    this.ding = ding;

    //
    // Public functions
    //
    function start(seconds, dings) {
      startTime = Date.now();
      self.seconds = seconds;
      self.secondsPassed = 0;
      if (dings) {
        self.dings = dings;
      }
      update();

      timerID = setInterval(function() {
        var now = Date.now();
        var passed = Math.floor((now - startTime) / 1000);
        if (passed !== self.secondsPassed) {
          self.secondsPassed = passed;
          self.seconds -= 1;
          update();

          var ding = self.dings.find(function(d) { return d.seconds === self.seconds; });
          if (ding) {
            if (!ding.mute) {
              self.ding(ding.seconds === 0);
            }
            if (ding.color) {
              document.body.classList.add(ding.color);
            }
          }

          if (self.seconds === 0) {
            clearInterval(timerID);
            options.onEnd();
            document.body.classList.add('blink');
          }
        }
      }, 50);
    }

    function stop() {
      clearInterval(timerID);
      timerID = null;
      startTime = null;
      self.seconds = 0;
      self.secondsPassed = 0;
      self.dings = [];
      self.dingNode.pause();
      document.body.classList.remove('red', 'green', 'yellow', 'blink');
    }

    function pause() {
      clearInterval(timerID);
    }

    function ding(loop) {
      if (loop) {
        self.dingNode.addEventListener('ended', ding);
      }
      self.dingNode.currentTime = 0;
      self.dingNode.play();
    }

    //
    // Private functions
    //
    function update() {
      var time = secondsToTime(self.seconds);
      if (time.min > 0) {
        self.mainNode.innerText = time.min;
        self.sideNode.innerText = time.sec >= 10 ? time.sec : '0' + time.sec;
      } else {
        self.mainNode.innerText = time.sec;
        self.sideNode.innerText = '';
      }
    }
  }

  /**
   * Utils
   */
  function timeToSeconds(time) {
    return time.min * 60 + time.sec;
  }

  function secondsToTime(seconds) {
    return {
      min: Math.floor(seconds / 60),
      sec: seconds % 60
    };
  }

  function fitRange(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function show(node) {
    node.classList.remove('hidden');
  }

  function hide(node) {
    node.classList.add('hidden');
  }
})(this);
