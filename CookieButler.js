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
        // This is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Activate",
          "Bug! this.Status.IntervalIdentifier not null, but manager is set non active! Trying to recover",
          this.Status.IntervalIdentifier
        );

        // Try to recover and retry
        this.Status.IntervalIdentifier = null;
        if (this.Activate()) {
          this.CBLogger.Update(
            this.Status.Name + "::Activate",
            "Bug seems to have recovered",
            this.Status.IntervalIdentifier
          );
        } else {
          this.CBLogger.Update(
            this.Status.Name + "::Activate",
            "Bug seems to NOT have recovered",
            this.Status.IntervalIdentifier
          );
          return false;
        }
      }
    } else {
      if (this.Status.IntervalIdentifier !== null) {
        this.CBLogger.Update(
          this.Status.Name + "::Activate",
          "Already active!",
          this.Status.Active
        );
      } else {
        // This is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Activate",
          "Bug! this.Status.IntervalIdentifier null, but manager is set active! Trying to recover",
          this.Status.IntervalIdentifier
        );

        // Try to recover and retry
        this.Status.Active = false;
        if (this.Activate()) {
          this.CBLogger.Update(
            this.Status.Name + "::Activate",
            "Bug seems to have recovered",
            this.Status.IntervalIdentifier
          );
        } else {
          this.CBLogger.Update(
            this.Status.Name + "::Activate",
            "Bug seems to NOT have recovered",
            this.Status.IntervalIdentifier
          );
          return false;
        }
      }
    }

    return this.Status.Active;
  }

  Deactivate() {
    if (this.Status.Active) {
      if (this.Status.IntervalIdentifier === null) {
        // This is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Deactivate",
          "Bug! this.Status.IntervalIdentifier null, but manager is set active! Trying to recover",
          this.Status.IntervalIdentifier
        );

        // Try to recover and retry
        this.Status.Active = false;
        if (this.Deactivate()) {
          this.CBLogger.Update(
            this.Status.Name + "::Deactivate",
            "Bug seems to have recovered",
            this.Status.IntervalIdentifier
          );
        } else {
          this.CBLogger.Update(
            this.Status.Name + "::Deactivate",
            "Bug seems to NOT have recovered",
            this.Status.IntervalIdentifier
          );
          return false;
        }
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
      if (this.Status.IntervalIdentifier === null) {
        this.CBLogger.Update(
          this.Status.Name + "::Deactivate",
          "Already inactive!",
          this.Status.Active
        );
      } else {
        // This is a bug
        this.CBLogger.Update(
          this.Status.Name + "::Deactivate",
          "Bug! this.Status.IntervalIdentifier not null, but manager is set not active! Trying to recover",
          this.Status.IntervalIdentifier
        );

        // Try to recover and retry
        this.Status.Active = true;
        if (this.Deactivate()) {
          this.CBLogger.Update(
            this.Status.Name + "::Deactivate",
            "Bug seems to have recovered",
            this.Status.IntervalIdentifier
          );
        } else {
          this.CBLogger.Update(
            this.Status.Name + "::Deactivate",
            "Bug seems to NOT have recovered",
            this.Status.IntervalIdentifier
          );
          return false;
        }
      }
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
      this.CBLogger.Update(
        this.Status.Name + "::PopAllShimmers",
        len,
        elements
      );
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
        this.PopWrinkler(wrinkler_to_pop);
        wrinklers_to_pop--;
      }

      // Then pop shiny in case we want
      if (this.Settings.PopShinyWrinklers) {
        // Pop normal wrinklers first
        while (wrinklers_to_pop > 0 && shinies.length > 0) {
          let wrinkler_to_pop = shinies.pop_random();
          this.PopWrinkler(wrinkler_to_pop);
          wrinklers_to_pop--;
        }
      }
    }
  }

  PopWrinkler(wrinkler) {
    this.CBLogger.Update(
      this.Status.Name + "::PopWrinkler",
      wrinkler,
      "shiny: " + wrinkler.type
    );
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

    this.Settings.DesiredSpellOutcomes = [
      "click frenzy",
      "cookie storm",
      "building special",
      "cookie storm drop",
      "free sugar lump",
      "blood frenzy",
      "cursed finger",
    ];

    // Since we are exploiting some game's internal logic, ensure we are working with the same game's version
    if (!this.Status.GameSupportedVersions.includes(window.Game.version)) {
      console.log(
        "Game version not ufficially supported! The grimoire spells simulations might be incorrect!"
      );
      console.log("Supported versions:", this.Status.GameSupportedVersions);
    }
  }

  FindGrimoire() {
    // Check if the grimoire is activated in the game
    if (window.Game.Objects["Wizard tower"].minigameLoaded) {
      this.Grimoire = window.Game.Objects["Wizard tower"].minigame;
    } else {
      this.Grimoire = null;
    }
  }

  CalculateTimeToMana(targetMagic) {
    // From CookieMonster

    let game_frames_needed = 0;

    let currentMagic = this.Grimoire.magic;
    while (currentMagic < targetMagic) {
      currentMagic +=
        Math.max(
          0.002,
          Math.pow(currentMagic / Math.max(this.Grimoire.magicM, 100), 0.5)
        ) * 0.002;
      game_frames_needed++;
    }

    return game_frames_needed / window.Game.fps / 1000;
  }

  SimulateSpell(spell) {
    // The outcome of the spell (We don't really care wether we win or not, we just care about the desired outcome)
    let spell_result = {
      win: false,
      outcome: "useless",
    };

    // Get the chance of failure (Game's fail chance is more comples due to `gambler's feber dream`, which we ignore)
    let failChance = this.Grimoire.getFailChance(spell);

    Math.seedrandom(window.Game.seed + "/" + this.Grimoire.spellsCastTotal);

    // Understand if we win
    spell_result.win = !spell.fail || Math.random() < 1 - failChance;

    // Understsand the outcome
    switch (spell.id) {
      case this.Grimoire.spells["hand of fate"].id:
        if (spell_result.win) {
          // Call twice because why not (maybe something with new shimmer?)
          Math.random();
          Math.random();

          let choices = [];
          choices.push("frenzy", "multiply cookies");
          if (!window.Game.hasBuff("Dragonflight"))
            choices.push("click frenzy");
          if (Math.random() < 0.1)
            choices.push("cookie storm", "cookie storm", "blab");
          if (window.Game.BuildingsOwned >= 10 && Math.random() < 0.25)
            choices.push("building special");
          //if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');
          if (Math.random() < 0.15) choices = ["cookie storm drop"];
          if (Math.random() < 0.0001) choices.push("free sugar lump");

          spell_result.outcome = window.choose(choices);
        } else {
          let choices = [];
          choices.push("clot", "ruin cookies");
          if (Math.random() < 0.1)
            choices.push("cursed finger", "blood frenzy");
          if (Math.random() < 0.003) choices.push("free sugar lump");
          if (Math.random() < 0.1) choices = ["blab"];
          spell_result.outcome = window.choose(choices);
        }

        break;

      case this.Grimoire.spells["resurrect abomination"].id:
        break;

      case this.Grimoire.spells["conjure baked goods"].id:
        break;

      default:
        spell_result.outcome = "unknown_spell";
    }

    // Restore the random generator
    Math.seedrandom();

    this.CBLogger.Update(
      this.Status.Name + "::SimulateSpell",
      spell,
      spell_result
    );
    return spell_result;
  }

  CastSpell(spell, expected_result) {
    // Click the spell cast button
    CBDOMUtilities.ClickDOMElement(
      CBDOMUtilities.GetDOMElement("grimoireSpell" + spell.id)
    );

    // Wait for the game to create the cookie and then ensure to pop the cookie! (in case the shimmer manager is disabled)
    window.setTimeout(function () {
      let elements = CBDOMUtilities.GetDOMElements("shimmer");
      let len = elements.length;
      if (len > 0) {
        CBDOMUtilities.ClickDOMElements(elements);
      }
    }, 500);

    this.CBLogger.Update(
      this.Status.Name + "::CastSpell",
      spell,
      expected_result
    );
  }

  Replan(ms) {
    // Replan whenever we will have enough mana
    let that = this;
    this.Status.TimeoutIdentifier = window.setTimeout(function () {
      that.Status.TimeoutIdentifier = null;
      // Figure out which spell to cast
      that.Plan();
    }, ms);

    this.CBLogger.Update(
      this.Status.Name + "::Replan",
      this.Status.TimeoutIdentifier,
      ms
    );
    return;
  }

  Plan() {
    if (this.Grimoire == null) {
      // There is no grimoire, try to find it and try again next second
      this.FindGrimoire();
      this.CBLogger.Update(
        this.Status.Name + "::Plan",
        "No grimoire!",
        this.Grimoire
      );
      return this.Replan(1000);
    }

    let ms_to_mana = this.CalculateTimeToMana(this.Grimoire.magicM);

    if (ms_to_mana > 0) {
      // We can't cast the spell, it doesn't make sense to figure out what to do
      this.CBLogger.Update(
        this.Status.Name + "::Plan",
        "Mana not full!",
        ms_to_mana
      );
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
    ms_to_mana = this.CalculateTimeToMana(this.Grimoire.magicM);
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

  Update(action, result, notes) {
    // Save a datapoint in the history
    this.Historic.push({
      Time_ms: Date.now(),
      action: action,
      result: result,
      notes: notes,
    });

    if (this.Settings.LoggingLevel > 0) {
      console.log(action, result, notes);
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
    this.CBLogger.Update(
      this.Status.Name + "::Start",
      clicking_period,
      this.Requests
    );
  }

  Stop() {
    // Stop the autoclicker
    window.clearInterval(this.BigCookieClickEventIdentifier);
    this.BigCookieClickEventIdentifier = null;
    this.CBLogger.Update(
      this.Status.Name + "::Stop",
      this.BigCookieClickEventIdentifier,
      this.Requests
    );
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
    this.Requests[demander] = 1;
    this.SmartStart();
  }

  Retreat(retreater) {
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
      CursedFinger: new AutoClickerChecker(
        "cursed_finger_checker",
        {},
        1000,
        this.Stats,
        this.AutoClickerInstance,
        "Cursed finger"
      ),

      Grimoire: new GrimoireManager("grimoire_manager", {}, this.Stats),
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
          "Failed to activate " + name,
          manager.Status
        );
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
          "Failed to deactivate " + name,
          manager.Status
        );
      }
    }, this);
  }

  Restart() {
    this.Deactivate();
    this.Activate();
  }
}

var CB = new CookieButler();
