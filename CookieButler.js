/*jshint esversion: 6 */
class CBDOMUtilities {
  static GetDOMElement(element_id) {
    return document.getElementById(element_id);
  }

  static GetDOMElements(class_name) {
    return Array.from(document.getElementsByClassName(class_name));
  }

  static ClickDOMElement(dom_element) {
    // Implements natural mouse click
    // dom_element.dispatchEvent(new MouseEvent("mousedown"), {});
    // dom_element.dispatchEvent(new MouseEvent("mouseup"), {});
    dom_element.dispatchEvent(new MouseEvent("click"), {});
  }

  static ClickDOMElements(elements) {
    elements.forEach((el) => {
      CBDOMUtilities.ClickDOMElement(el);
    });
  }
}

class ManagerBase {
  constructor(name, settings, CookieButlerLogger) {
    // Settings of the manager
    this.Settings = settings;

    // Status
    this.Status = {
      Name: name,
      Active: false,
      GameFound: false,
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
    console.log(this.Status.Name, "Didn' implement Check()");
  }

  Activate() {
    console.log(this.Status.Name, "Didn' implement Activate()");
  }

  Deactivate() {
    console.log(this.Status.Name, "Didn' implement Deactivate()");
  }

  Restart() {
    console.log(this.Status.Name, "Didn' implement Restart()");
  }
}

class RepeatingManager extends ManagerBase {
  constructor(name, settings, interval_ms, CookieButlerLogger) {
    super(name, settings, CookieButlerLogger);

    this.Settings.Interval_ms = interval_ms;

    this.Status.IntervalIdentifier = null;
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

class ShimmersManager extends RepeatingManager {
  Check() {
    this.PopAllShimmers();
  }

  PopAllShimmers() {
    // Click all the golden cookies and reindeers
    let elements = CBDOMUtilities.GetDOMElements("shimmer");
    let len = elements.length;
    if (len > 0) {
      CBDOMUtilities.ClickDOMElements(elements);
      this.CBLogger.Update("ShimmersManager::Check", "Popped shimmers", len);
    }
  }
}

class WrinklersManager extends RepeatingManager {
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
        this.PopWrinkler(wrinkler_to_pop);

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
          this.PopWrinkler(wrinkler_to_pop);

          wrinklers_to_pop--;
        }
      }
    }
  }

  PopWrinkler(wrinkler) {
    wrinkler.hp = 0;
    // TODO: Find a way to do this through the mouse click event
  }
}

class GrimoireManager extends ManagerBase {
  // Checks if we can execute force the hand of fate
  constructor(name, settings, CookieButlerLogger) {
    super(name, settings, CookieButlerLogger);
    this.Status.TimeoutIdentifier = null;
    this.Status.GameSupportedVersions = [2.022];

    this.Grimoire = null;
    this.FindGrimoire();

    this.Settings.DesiredSpellOutcomes = ["todo"];

    // Since we are exploiting some game's internal logic, ensure we are working with the same game's version
    if (!this.GameSupportedVersions.includes(Game.version)) {
      console.log(
        "Game version not ufficially supported! The grimoire spells simulations might be incorrect!"
      );
      console.log("Supported versions:", this.Status.GameSupportedVersions);
    }

    // Ensure `choose` function is present
    if (typeof choose != undefined) {
      // Game 2.022's implementation
      window.choose = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
      };
    }
  }

  FindGrimoire() {
    // Check if the grimoire is activated in the game
    if (Game.Objects["Wizard tower"].minigameLoaded()) {
      this.Grimoire = Game.Objects["Wizard tower"];
    } else {
      this.Grimoire = null;
    }
  }

  CalculateTimeToMaxMana() {
    // Grimoire.magicPS is actually magic per frame
    let magic_s = this.Grimoire.magicPS * Game.fps;
    let magic_ms = magic_s / 1000;

    let magic_needed = this.Grimoire.magicM - this.Grimoire.magic;

    return magic_needed / magic_ms;
  }

  SimulateSpell(spell) {
    // The outcome of the spell (We don't really care wether we win or not, we just care about the desired outcome)
    let spell_result = {
      win: false,
      outcome: "useless",
    };

    // Get the chance of failure (Game's fail chance is more comples due to `gambler's feber dream`, which we ignore)
    let failChance = this.Grimoire.getFailChance(spell);

    Math.seedrandom(Game.seed + "/" + this.Grimoire.spellsCastTotal);

    // Understand if we win
    spell_result.win = spell.fail || Math.random() < 1 - failChance;

    // Understsand the outcome
    switch (spell.name) {
      case this.Grimoire.spells["hand of fate"]:
        if (result.win) {
          let choices = [];
          choices.push("frenzy", "multiply cookies");
          if (!Game.hasBuff("Dragonflight")) choices.push("click frenzy");
          if (Math.random() < 0.1)
            choices.push("cookie storm", "cookie storm", "blab");
          if (Game.BuildingsOwned >= 10 && Math.random() < 0.25)
            choices.push("building special");
          //if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');
          if (Math.random() < 0.15) choices = ["cookie storm drop"];
          if (Math.random() < 0.0001) choices.push("free sugar lump");

          result.outcome = choose(choices);
        } else {
          let choices = [];
          choices.push("clot", "ruin cookies");
          if (Math.random() < 0.1)
            choices.push("cursed finger", "blood frenzy");
          if (Math.random() < 0.003) choices.push("free sugar lump");
          if (Math.random() < 0.1) choices = ["blab"];
          result.outcome = choose(choices);
        }

        break;

      case this.Grimoire.spells["resurrect abomination"]:
        break;

      case this.Grimoire.spells["conjure baked goods"]:
        break;

      default:
        spell_result.outcome = "unknown_spell";
    }

    // Restore the random generator
    Math.seedrandom();

    return spell_result;
  }

  CastSpell(spell) {
    // Cast a spell
    document
      .getElementById("grimoireSpell" + spell.id)
      .dispatchEvent(new MouseEvent("click", {}));

    // Alternative: this.Grimoire.castSpell(spell, {});
  }

  Replan(ms) {
    // Replan whenever we will have enough mana
    let that = this;
    this.Status.TimeoutIdentifier = window.setTimeout(function () {
      that.Status.TimeoutIdentifier = null;
      // Figure out which spell to cast
      that.Plan();
    }, ms);

    return;
  }

  Plan() {
    if (this.Grimoire == null) {
      // There is no grimoire, try to find it and try again next second
      this.FindGrimoire();
      return this.Replan(1000);
    }

    let ms_to_mana = this.CalculateTimeToMaxMana();

    if (ms_to_mana > 0) {
      // We can't cast the spell, it doesn't make sense to figure out what to do
      return this.Replan(ms_to_mana + 5);
    }

    // We can cast the spell!
    let spell = this.Grimoire.spells["hand of fate"];

    // Find which is the best spell to cast
    let result = this.SimulateSpell(spell);

    if (result.outcome in this.Settings.DesiredSpellOutcomes) {
      // We can cast it! (or at least cast it whenever we can)
      this.CastSpell(spell);
    } else {
      // Try to cast another spell
      spell = this.Grimoire.spells["conjure baked goods"];
      result = this.SimulateSpell(spell);
      if (result.win) {
        this.CastSpell(spell);
      } else {
        // Bad luck.
        // even if `resurrect abomination` fails, it is not a big deal, come on :)
        spell = this.Grimoire.spells["resurrect abomination"];
        this.CastSpell(spell);
      }
    }

    // Execute another spell whenever we will have more mana
    ms_to_mana = CalculateTimeToMaxMana();
    this.Replan(ms_to_mana + 5);
    return;
  }

  Activate() {
    this.Plan();
    this.Status.Active = true;
    this.CBLogger.Update(
      this.Status.Name + "::Activate",
      "Activated",
      this.Status.Active
    );
    return this.Status.Active;
  }

  Deactivate() {
    let that = this;
    window.clearTimeout(that.Status.TimeoutIdentifier);
    this.Status.TimeoutIdentifier = null;
    this.Status.Active = false;
    this.CBLogger.Update(
      this.Status.Name + "::Deactivate",
      "Deactivated",
      this.Status.Active
    );
    return !this.Status.Active;
  }

  Restart() {
    this.Deactivate();
    this.Activate();
    this.CBLogger.Update(
      this.Status.Name + "::Restart",
      "Restarted",
      this.Status.Active
    );
    return this.Status.Active;
  }
}

class AutoClickerChecker extends RepeatingManager {
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
    CBDOMUtilities.ClickDOMElement(CBDOMUtilities.GetDOMElement("bigCookie"));
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
      Shimmers: new ShimmersManager("shimmers_manager", {}, 800, this.Stats),
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
