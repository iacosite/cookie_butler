/*jshint esversion: 6 */
class ManagerBase {
  constructor(name, settings, CookieButlerLogger) {
    // name is the name of the manager
    this.Name = name;

    // Settings of the manager
    this.Settings = settings;

    // Logger in order to communicate with CookieButler
    this.CBLogger = CookieButlerLogger;

    // Ensure that the game is loaded
    if (!window.Game) {
      console.log(
        "CookieClicker is not loaded!",
        this.Name,
        "might not work properly."
      );
    }
  }

  Check() {
    console.log(this.Name, "has no implemented actions");
  }
}

class ShimmersManager extends ManagerBase {
  constructor(name, settings, CookieButlerLogger) {
    super(name, settings, CookieButlerLogger);
  }

  Check() {
    // Click golden cookies and reindeers

    // Pop all of them
    window.Game.shimmers.forEach(function (shimmer) {
      shimmer.pop();
      this.CBLogger.Update("pop", shimmer.type, 1);
    });
  }
}

class WrinklersManager extends ManagerBase {
  Check() {
    // Manage the number of wrinklers

    let shinies = [];
    let non_shines = [];

    // Divide wrinklers in shiny and not shiny
    window.Game.wrinklers.forEach(function (wrinkler) {
      if (wrinkler.close == 1) {
        if (wrinkler.type == 1) {
          shinies.push(wrinkler);
        } else {
          non_shines.push(wrinkler);
        }
      }
    });

    // Log
    this.CBLogger.Update("Log", "shinies", shinies.length);
    this.CBLogger.Update("Log", "non_shines", non_shines.length);

    // Check if they are almost the max and ensure one spot free for new wrinklers
    let tot_wrinklers = shinies.length + non_shines.length;
    if (
      tot_wrinklers >= window.Game.getWrinklersMax() ||
      tot_wrinklers > this.Settings.DesiredWrinklersNumber
    ) {
      // pop 1
      if (non_shines.length > 0) {
        let last = non_shines.pop(); //anyone is fine

        this.CBLogger.Update("pop", "non_shiny_wrinkler", JSON.stringify(last));
        last.hp = 0;
      } else {
        let last = shinies.pop(); //anyone is fine

        this.CBLogger.Update("pop", "shiny_wrinkler", JSON.stringify(last));
        last.hp = 0;
      }
    }
  }
}

class AutoClickerChecker extends ManagerBase {
  constructor(name, settings, CookieButlerLogger, Autoclicker, Buffname) {
    super(name, settings, CookieButlerLogger);

    this.AutoClicker = Autoclicker;
    this.BuffName = Buffname;
  }

  Check() {
    let that = this;

    // Enable autoclicker while `Click frenzy` buff is enabled
    if (window.Game.hasBuff(that.BuffName)) {
      this.AutoClicker.Demand(this.Name);
    } else {
      this.AutoClicker.Retreat(this.Name);
    }
  }
}

class Logger {
  constructor() {
    this.Historic = [];

    this.Settings = {
      LoggingLevel: 1,
    };
  }

  Update(action, type, quantity) {
    // Save a datapoint in the history
    this.Historic.push({
      Time_ms: Date.now(),
      action: action,
      type: type,
      quantity: quantity,
    });

    if (this.Settings.LoggingLevel > 0) {
      console.log(action, type, quantity);
    }
  }

  Reset() {
    this.Historic = {};
  }

  ToJson() {
    console.log(JSON.stringify(this.Historic));
  }
}

class AutoClicker {
  constructor(CookieButlerLogger) {
    this.Requests = {
      at_least_one_type: 0,
    };

    this.BigCookieClickEventIdentifier = null;

    this.Parameters = {
      ClickFrequency: 100, // Clicks per second (Hz)
    };

    this.CBLogger = CookieButlerLogger;
  }

  ClickBigCookie() {
    // Click the big cookie once
    document
      .getElementById("bigCookie")
      .dispatchEvent(new MouseEvent("click", {}));
  }

  Start() {
    let that = this;

    // Start the autoclicker
    const clicking_period = 1000 / this.Parameters.ClickFrequency;
    this.BigCookieClickEventIdentifier = window.setInterval(function () {
      that.ClickBigCookie();
    }, clicking_period);
    this.CBLogger.Update("started", "Autoclicker", clicking_period);
  }

  Stop() {
    // Stop the autoclicker
    window.clearInterval(this.BigCookieClickEventIdentifier);
    this.BigCookieClickEventIdentifier = null;
    this.CBLogger.Update("stopped", "Autoclicker", 1);
  }

  n_demands() {
    const count = (obj) => Object.values(obj).reduce((a, b) => a + b);

    return count(this.Requests);
  }

  SmartStart() {
    // Start the autoclicker only if there is at least one request
    if (this.n_demands() > 0) {
      if (this.BigCookieClickEventIdentifier === null) {
        this.Start();
      }
    } else {
      if (this.BigCookieClickEventIdentifier !== null) {
        this.Stop();
      }
    }
  }

  Demand(demander) {
    this.CBLogger.Update("demanded", demander, 1);
    this.Requests[demander] = 1;
    this.SmartStart();
  }

  Retreat(retreater) {
    this.CBLogger.Update("retreated", retreater, 1);
    this.Requests[retreater] = 0;
    this.SmartStart();
  }
}

class CookieButler {
  constructor() {
    this.Settings = {};

    this.Stats = new Logger();

    this.AutoClickerInstance = new AutoClicker(this.Stats);

    this.Managers = {
      Wrinklers: new WrinklersManager(
        "wrinklers_manager",
        {
          DesiredWrinklersNumber: 8,
          Interval_ms: 5000,
        },
        this.Stats
      ),
      Shimmers: new ShimmersManager(
        "shimmers_manager",
        {
          Interval_ms: 1000,
        },
        this.Stats
      ),
    };

    this.AutoclickerCheckers = {
      ClickFrenzy: new AutoClickerChecker(
        "click_frenzy_checker",
        {
          Interval_ms: 1000,
        },
        this.Stats,
        this.AutoClickerInstance,
        "Click frenzy"
      ),
      Dragonflight: new AutoClickerChecker(
        "dragonflight_checker",
        {
          Interval_ms: 1000,
        },
        this.Stats,
        this.AutoClickerInstance,
        "Dragonflight"
      ),
      ElderFrenzy: new AutoClickerChecker(
        "elder_frenzy_checker",
        {
          Interval_ms: 1000,
        },
        this.Stats,
        this.AutoClickerInstance,
        "Elder frenzy"
      ),
    };

    this.IntervalIdentifiers = {};

    // this.Activate();
  }

  Activate() {
    let that = this;

    Object.keys(that.Managers).forEach(function (key) {
      let Manager = that.Managers[key];

      that.IntervalIdentifiers[key] = window.setInterval(function () {
        that.Managers[key].Check();
      }, Manager.Settings.Interval_ms);
      that.Stats.Update("Activated", key, Manager.Settings.Interval_ms);
    });

    Object.keys(that.AutoclickerCheckers).forEach(function (key) {
      let Checker = that.AutoclickerCheckers[key];

      that.IntervalIdentifiers[key] = window.setInterval(function () {
        that.AutoclickerCheckers[key].Check();
      }, Checker.Settings.Interval_ms);
      that.Stats.Update("Activated", key, Checker.Settings.Interval_ms);
    });
  }

  Deactivate() {
    let that = this;

    Object.keys(this.IntervalIdentifiers).forEach(function (key) {
      let Identifier = that.IntervalIdentifiers[key];

      if (Identifier !== null) {
        window.clearInterval(Identifier);
        that.IntervalIdentifiers[key] = null;
        that.Stats.Update("Deactivated", key, that.IntervalIdentifiers[key]);
      }
    });
  }

  Restart() {
    this.Deactivate();
    this.Activate();
  }
}

var CB = new CookieButler();
