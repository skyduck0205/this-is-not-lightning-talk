(function(global) {
  'use strict';

  var WIDTH = 1280;
  var HEIGHT = 720;
  var MAX_CARDS = 4;
  var COLORS = ['white', 'red', 'yellow', 'green'];

  var browser = (navigator.userAgent||navigator.vendor||window.opera);
  var mobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(browser)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(browser.substr(0,4));

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
      var ratio = Math.min(window.innerHeight / HEIGHT, window.innerWidth / WIDTH);
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
        var colors = COLORS.filter(function(color) {
          return self.cards.findIndex(function(_card) { return _card.color === color; }) < 0;
        });
        self.addCard(card.index + 1, colors[0]);
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
      window.removeEventListener(mobile ? 'touchmove' : 'mousemove', onMouseMove);
      window.removeEventListener(mobile ? 'touchend' : 'mouseup', onMouseUp);
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
      self.node.addEventListener(mobile ? 'touchstart' : 'mousedown', onMouseDown);
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
      self.bellNode.addEventListener(mobile ? 'touchstart' : 'mousedown', function(e) { e.stopPropagation(); });
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
      e.preventDefault();
      mouseX = mobile ? e.touches[0].clientX : e.clientX;
      mouseY = mobile ? e.touches[0].clientY : e.clientY;
      self.node.classList.add('grabbing');
      self.node.style.transform = 'scale(1.05)';
      self.node.style.zIndex = 10;
      window.addEventListener(mobile ? 'touchmove' : 'mousemove', onMouseMove);
      window.addEventListener(mobile ? 'touchend' : 'mouseup', onMouseUp);
    }

    function onMouseUp(e) {
      self.node.classList.remove('grabbing');
      self.node.style.transform = '';
      self.node.style.zIndex = 1;
      window.removeEventListener(mobile ? 'touchmove' : 'mousemove', onMouseMove);
      window.removeEventListener(mobile ? 'touchend' : 'mouseup', onMouseUp);

      var clientX = mobile ? e.changedTouches[e.changedTouches.length - 1].clientX : e.clientX,
        clientY = mobile ? e.changedTouches[e.changedTouches.length - 1].clientY : e.clientY,
        moveX = fitRange(clientX - mouseX, -30, 30),
        moveY = fitRange(clientY - mouseY, -30, 30);
      if (moveX === 0 && moveY === 0) {
        return;
      }
      var direction = Math.abs(moveX) > Math.abs(moveY) ?
        (moveX > 0 ? 'right' : 'left') :
        (moveY > 0 ? 'down' : 'up');

      options.onDrag(self, direction);
    }

    function onMouseMove(e) {
      var clientX = mobile ? e.touches[0].clientX : e.clientX,
        clientY = mobile ? e.touches[0].clientY : e.clientY,
        moveX = fitRange(clientX - mouseX, -30, 30),
        moveY = fitRange(clientY - mouseY, -30, 30);
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
