/*jshint esversion: 6 */

//TODO: Improve ManagerBase to add setInterval and clearInterval. Pass the interval in the constructor and add to the settings

class ManagerBase {
  constructor(name, settings, interval_ms, CookieButlerLogger) {
    // Settings of the manager
    this.Settings = settings;
    this.Settings.Interval_ms = interval_ms;

    // Status
    this.Status = {
      Name: name,
      Active: false,
      GameFound: false,
      IntervalIdentifier: null,
    };

    // Logger in order to communicate with CookieButler
    this.CBLogger = CookieButlerLogger;

    // Ensure that the game is loaded
    if (!window.Game) {
      console.log(
        "CookieClicker is not loaded!",
        this.Status.Name,
        "might not work properly."
      );
    } else {
      this.Status.GameFound = true;
    }

    // Augment array
    if (Array.prototype.pop_random === undefined) {
      Object.defineProperty(Array.prototype, "pop_random", {
        value: function () {
          // select the random element and remove it from array
          let elem = this.splice(Math.floor(Math.random() * this.length), 1);

          // return undefined if no element is popped (the array is empty) emulating Array.pop()
          if (elem.length == 0) {
            return undefined;
          } else {
            return elem[0];
          }
        },
      });
    }
  }

  Check() {
    console.log(this.Status.Name, "has no implemented actions");
  }

  Activate() {
    if (!this.Status.Active) {
      if (this.Status.IntervalIdentifier === null) {
        let that = this;
        this.Status.IntervalIdentifier = window.setInterval(function () {
          that.Check();
        }, that.Settings.Interval_ms);

        this.CBLogger.Update(
          this.Status.Name + "::Activate",
          "Activated",
          this.Status.IntervalIdentifier
        );
        this.Status.Active = true;
      } else {
        // this is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Activate",
          "this.Status.IntervalIdentifier not null, bug!",
          this.Status.IntervalIdentifier
        );

        // try to recover
        this.Deactivate();
      }
    } else {
      this.CBLogger.Update(
        this.Status.Name + "::Activate",
        "Already active!",
        this.Status.Active
      );
    }
    return this.Status.Active;
  }

  Deactivate() {
    if (this.Status.Active) {
      if (this.Status.IntervalIdentifier === null) {
        // this is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Deactivate",
          "this.Status.IntervalIdentifier null, bug!",
          this.Status.IntervalIdentifier
        );

        // try to recover
        this.Status.Active = false;
        return false;
      } else {
        let that = this;
        window.clearInterval(that.Status.IntervalIdentifier);
        this.Status.IntervalIdentifier = null;
        this.Status.Active = false;

        this.CBLogger.Update(
          this.Status.Name + "::Deactivate",
          "Deactivated",
          this.Status.Active
        );
      }
    } else {
      this.CBLogger.Update(
        this.Status.Name + "::Deactivate",
        "Already inactive!",
        this.Status.Active
      );
    }
    return !this.Status.Active;
  }

  Restart() {
    this.Deactivate();
    this.Activate();

    return this.Status.Active;
  }
}

class ShimmersManager extends ManagerBase {
  Check() {
    // Click golden cookies and reindeers
    // Pop all of them
    window.Game.shimmers.forEach(function (shimmer) {
      shimmer.pop();
      this.CBLogger.Update("pop", shimmer.type, 1);
    }, this);
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
    }, this);

    // Log
    this.CBLogger.Update("Log", "shinies", shinies.length);
    this.CBLogger.Update("Log", "non_shines", non_shines.length);

    // Check if they are almost the max and ensure one spot free for new wrinklers
    let tot_wrinklers = shinies.length + non_shines.length;
    let desired_n_wrinklers = Math.min(
      window.Game.getWrinklersMax(),
      this.Settings.DesiredWrinklersNumber
    );

    let wrinklers_to_pop = tot_wrinklers - desired_n_wrinklers;
    if (wrinklers_to_pop > 0) {
      // Pop normal wrinklers first
      while (wrinklers_to_pop > 0 && non_shines.length > 0) {
        let wrinkler_to_pop = non_shines.pop_random();
        this.CBLogger.Update(
          "pop",
          "non_shiny_wrinkler",
          JSON.stringify(wrinkler_to_pop)
        );
        wrinkler_to_pop.hp = 0;

        wrinklers_to_pop--;
      }

      // Then pop shiny in case we want
      if (this.Settings.PopShinyWrinklers) {
        // Pop normal wrinklers first
        while (wrinklers_to_pop > 0 && shinies.length > 0) {
          let wrinkler_to_pop = shinies.pop_random();

          this.CBLogger.Update(
            "pop",
            "shiny_wrinkler",
            JSON.stringify(wrinkler_to_pop)
          );
          wrinkler_to_pop.hp = 0;

          wrinklers_to_pop--;
        }
      }
    }
  }
}

class AutoClickerChecker extends ManagerBase {
  constructor(
    name,
    settings,
    interval_ms,
    CookieButlerLogger,
    Autoclicker,
    Buffname
  ) {
    super(name, settings, interval_ms, CookieButlerLogger);

    this.AutoClicker = Autoclicker;
    this.Settings.BuffName = Buffname;
  }

  Check() {
    let that = this;

    // Enable autoclicker while `Click frenzy` buff is enabled
    if (window.Game.hasBuff(that.Settings.BuffName)) {
      this.AutoClicker.Demand(this.Status.Name);
    } else {
      this.AutoClicker.Retreat(this.Status.Name);
    }
  }
}

class Logger {
  constructor(Logginglevel) {
    this.Historic = [];

    this.Settings = {
      LoggingLevel: Logginglevel,
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
    this.Settings = {
      DefaultWrinklersNumber: 8,
      DefaultLoggingLevel: 0,
    };

    this.Stats = new Logger(this.Settings.DefaultLoggingLevel);

    this.AutoClickerInstance = new AutoClicker(this.Stats);

    this.Managers = {
      Wrinklers: new WrinklersManager(
        "wrinklers_manager",
        {
          DesiredWrinklersNumber: this.Settings.DefaultWrinklersNumber,
          PopShinyWrinklers: false,
        },
        5000,
        this.Stats
      ),
      Shimmers: new ShimmersManager("shimmers_manager", {}, 1000, this.Stats),
    };

    this.AutoclickerCheckers = {
      ClickFrenzy: new AutoClickerChecker(
        "click_frenzy_checker",
        {},
        1000,
        this.Stats,
        this.AutoClickerInstance,
        "Click frenzy"
      ),
      Dragonflight: new AutoClickerChecker(
        "dragonflight_checker",
        {},
        1000,
        this.Stats,
        this.AutoClickerInstance,
        "Dragonflight"
      ),
      ElderFrenzy: new AutoClickerChecker(
        "elder_frenzy_checker",
        {},
        1000,
        this.Stats,
        this.AutoClickerInstance,
        "Elder frenzy"
      ),
    };

    this.IntervalIdentifiers = {};

    this.Activate();
  }

  Activate() {
    // Activate all the Managers
    Object.entries(this.Managers).forEach(([name, manager]) => {
      if (manager.Activate()) {
        this.Stats.Update("Activated", name, manager.Status);
      } else {
        this.Stats.Update(
          "Activated",
          "Failed to activate " + name + ", restarting",
          manager.Status
        );

        if (!manager.Restart()) {
          this.Stats.Update(
            "Activated",
            "Failed to restart " + name,
            manager.Status
          );
        } else {
          this.Stats.Update("Activated", name, manager.Status);
        }
      }
    }, this);

    // Activate all the AutoclickerCheckers
    Object.entries(this.AutoclickerCheckers).forEach(([name, checker]) => {
      if (checker.Activate()) {
        this.Stats.Update("Activated", name, checker.Status);
      } else {
        this.Stats.Update(
          "Activated",
          "Failed to activate " + name + ", restarting",
          checker.Status
        );

        if (!checker.Restart()) {
          this.Stats.Update(
            "Activated",
            "Failed to restart " + name,
            checker.Status
          );
        } else {
          this.Stats.Update("Activated", name, checker.Status);
        }
      }
    }, this);
  }

  Deactivate() {
    // Deactivate all the Managers
    Object.entries(this.Managers).forEach(([name, manager]) => {
      if (manager.Deactivate()) {
        this.Stats.Update("Deactivated", name, manager.Status);
      } else {
        // There has been an error, retry
        this.Stats.Update(
          "Deactivated",
          "Failed to deactivate " + name + ", retrying",
          manager.Status
        );

        if (!manager.Deactivate()) {
          this.Stats.Update(
            "Deactivated",
            "Failed to retry deactivate " + name,
            manager.Status
          );
        } else {
          this.Stats.Update("Deactivated", name, manager.Status);
        }
      }
    }, this);

    // Deactivate all the AutoclickerCheckers
    Object.entries(this.AutoclickerCheckers).forEach(([name, checker]) => {
      if (checker.Deactivate()) {
        this.Stats.Update("Deactivated", name, checker.Status);
      } else {
        // There has been an error, retry
        this.Stats.Update(
          "Deactivated",
          "Failed to deactivate " + name + ", retrying",
          checker.Status
        );

        if (!checker.Deactivate()) {
          this.Stats.Update(
            "Deactivated",
            "Failed to retry deactivate " + name,
            checker.Status
          );
        } else {
          this.Stats.Update("Deactivated", name, checker.Status);
        }
      }
    }, this);
  }

  Restart() {
    this.Deactivate();
    this.Activate();
  }
}

var CB = new CookieButler();
