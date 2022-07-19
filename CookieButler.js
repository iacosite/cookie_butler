/*jshint esversion: 6 */
var CBDOMUtilities = {
  Settings: {
    TimeBetweenClicks_ms: 10,
  },

  Status: {
    LastClick: 0,
  },

  GetDOMElement: function (element_id) {
    return document.getElementById(element_id);
  },

  GetDOMElements: function (class_name) {
    return Array.from(document.getElementsByClassName(class_name));
  },

  ClickDOMElement: function (dom_element) {
    // Implements natural mouse click

    this.Status.LastClick =
      Math.max(this.Status.LastClick, Date.now()) +
      this.Settings.TimeBetweenClicks_ms;

    let that = this;
    window.setTimeout(function () {
      // dom_element.dispatchEvent(new MouseEvent("mousedown"), {});
      // dom_element.dispatchEvent(new MouseEvent("mouseup"), {});
      dom_element.dispatchEvent(new MouseEvent("click"), {});
    }, that.Status.LastClick - Date.now);
  },

  ClickDOMElements: function (elements) {
    elements.forEach((el) => {
      this.ClickDOMElement(el);
    });
  },

  GetObjectDOMElement: function (object) {
    return this.GetDOMElement("product" + object.id);
  },

  GetUpgradeDOMElement: function (upgrade) {
    // Find the id of the upgrade
    let upgrade_id = 0;
    let found = Object.values(window.Game.UpgradesInStore).some(
      (gameUpgrade) => {
        if (gameUpgrade.id == upgrade.id) {
          return gameUpgrade;
        }
        upgrade_id++;
      }
    );
    if (found) {
      return this.GetDOMElement("upgrade" + upgrade_id);
    } else {
      console.log("upgrade", upgrade, "not found");
      return null;
    }
  },
};

var CBLogger = {
  History: [],

  Settings: {
    LoggingLevel: 1,
  },

  Debug: function (action, result, notes) {
    return Update(action, result, notes, 1);
  },
  Warn: function (action, result, notes) {
    return Update(action, result, notes, 2);
  },
  Error: function (action, result, notes) {
    return Update(action, result, notes, 3);
  },

  Update: function (action, result, notes, loglevel=0) {
    // Save a datapoint in the history
    this.History.push({
      Time_ms: Date.now(),
      action: action,
      result: result,
      notes: notes,
    });

    if (loglevel > this.Settings.LoggingLevel) {
      console.log(action, result, notes);
    }
  },

  Reset: function () {
    this.History = [];
  },

  ToJson: function () {
    console.log(JSON.stringify(this.History));
  },
};

var CBAutoClicker = {
  Settings: {
    ClickFrequency: 100, // Clicks per second (Hz)
  },

  Status: {
    StartedAutomatically: false,
    Clicking: false,
    BigCookieClickEventIdentifier: null,
    Requests: {
      at_least_one_type: 0,
    },
  },

  ClickBigCookie: function () {
    // Click the big cookie once
    CBDOMUtilities.ClickDOMElement(CBDOMUtilities.GetDOMElement("bigCookie"));
  },

  n_demands: function () {
    const count = (obj) => Object.values(obj).reduce((a, b) => a + b);

    return count(this.Status.Requests);
  },

  Start: function () {
    let that = this;

    // Start the autoclicker
    const clicking_period = Math.max(
      1000 / this.Settings.ClickFrequency,
      CBDOMUtilities.Settings.TimeBetweenClicks_ms
    );

    this.Status.BigCookieClickEventIdentifier = window.setInterval(function () {
      that.ClickBigCookie();
    }, Math.max(clicking_period, CBDOMUtilities.Settings.TimeBetweenClicks_ms));
    window.CBLogger.Warn("Autoclicker::Start", clicking_period, this.Status);

    this.Status.Clicking = true;
  },

  Stop: function () {
    // Stop the autoclicker
    window.clearInterval(this.Status.BigCookieClickEventIdentifier);
    this.Status.BigCookieClickEventIdentifier = null;
    window.CBLogger.Warn("Autoclicker::Stop", undefined, this.Status);
    this.Status.Clicking = false;
  },

  SmartStart: function () {
    // Start the autoclicker only if there is at least one request
    if (this.n_demands() > 0) {
      if (this.Status.BigCookieClickEventIdentifier === null) {
        this.Start();
        this.Status.StartedAutomatically = true;
      }
    } else {
      if (this.Status.BigCookieClickEventIdentifier !== null) {
        if (this.Status.StartedAutomatically == true) {
          this.Stop();
          this.Status.StartedAutomatically = false;
        }
      }
    }
  },

  Demand: function (demander) {
    this.Status.Requests[demander] = 1;
    this.SmartStart();
  },

  Retreat: function (retreater) {
    this.Status.Requests[retreater] = 0;
    this.SmartStart();
  },
};

class ManagerBase {
  constructor(name, settings) {
    // Settings of the manager
    this.Settings = {};
    this.FillSettings(settings);

    // Status
    this.Status = {
      Name: name,
      Active: false,
      GameFound: false,
      Settings: this.Settings,
    };

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

  FillSettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      if (!this.Settings[key]) {
        this.Settings[key] = value;
      }
    });
  }
}

class RepeatingManager extends ManagerBase {
  constructor(name, settings, interval_ms) {
    super(name, settings);

    this.Settings.Interval_ms = interval_ms;
    this.Status.IntervalIdentifier = null;
    this.Status.FirstSchedule = null;
  }

  Activate() {
    if (this.Status.Active) {
      window.CBLogger.Warn(
        this.Status.Name + "::Activate",
        "Already active!",
        this.Status
      );
    } else {
      this.ScheduleCheck(this.Settings.Interval_ms);
      window.CBLogger.Warn(
        this.Status.Name + "::Activate",
        "Activated!",
        this.Status
      );
    }
    return this.Status.Active;
  }

  Deactivate() {

    if (this.Status.Active) {
      this.AbortCheckFunction();
      window.CBLogger.Warn(
        this.Status.Name + "::Deactivate",
        "Deactivated!",
        this.Status
      );
    } else {
      window.CBLogger.Warn(
        this.Status.Name + "::Deactivate",
        "Already deactivated!",
        this.Status
      );
    }

    return !this.Status.Active;
  }

  Restart() {
    this.Deactivate();
    this.Activate();

    return this.Status.Active;
  }

  ScheduleCheck(time_ms) {
    let that = this;
    this.Status.IntervalIdentifier = null;
    this.Status.IntervalIdentifier = window.setInterval(function () {
      that.Check();
    }, time_ms);
    this.Status.FirstSchedule = Date.now();
    this.Status.Active = this.Status.IntervalIdentifier !== null;
  }

  AbortCheckFunction() {
    let that = this;
    window.clearInterval(that.Status.IntervalIdentifier);
    this.Status.IntervalIdentifier = null;
    this.Status.Active = false;
  }
}

class ShimmersManager extends RepeatingManager {
  Check() {
    this.PopAllShimmersByClicking();
  }

  PopAllShimmers() {
    window.Game.shimmers.forEach((shimmer) => this.PopShimmer(shimmer));
  }

  PopShimmer(shimmer) {
    window.CBLogger.Debug(
      this.Status.Name + "::PopShimmer",
      "Wrath: " + shimmer.wrath,
      shimmer
    );
    shimmer.pop();
  }

  PopAllShimmersByClicking() {
    // Click all the golden cookies and reindeers
    let elements = CBDOMUtilities.GetDOMElements("shimmer");
    let len = elements.length;
    if (len > 0) {
      window.CBLogger.Debug(
        this.Status.Name + "::PopAllShimmersByClicking",
        len,
        window.Game.shimmers
      );
      CBDOMUtilities.ClickDOMElements(elements);
    }
  }
}

class WrinklersManager extends RepeatingManager {
  constructor(name, settings, interval_ms) {
    super(name, settings, interval_ms);

    let DefaultSettings = {
      DesiredWrinklersNumber: 11,
      PopShinyWrinklers: false,
    };
    super.FillSettings(DefaultSettings);
  }

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
    window.CBLogger.Debug(
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
  constructor(name, settings) {
    super(name, settings);
    this.Status.TimeoutIdentifier = null;
    this.Status.GameSupportedVersions = [2.022];
    this.Status.WillFireAt = null;
    this.Status.DelayedSpellCastIdentifier = null;
    this.Status.DelayedSpellCastRequested = false;

    let DefaultSettings = {
      DesiredSpellOutcomes: [
        "click frenzy",
        "cookie storm",
        "building special",
        "cookie storm drop",
        "free sugar lump",
        "blood frenzy",
        "cursed finger",
      ],
      MinimumBuffMultiplier: 7,
      DelayedSpellCastWaitingTime_ms: 3000,
    };
    super.FillSettings(DefaultSettings);

    this.Grimoire = null;
    this.FindGrimoire();

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
    if (
      window.Game.Objects["Wizard tower"].minigameLoaded &&
      window.Game.Objects["Wizard tower"].onMinigame
    ) {
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

    return (game_frames_needed / window.Game.fps) * 1000;
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

    window.CBLogger.Debug(
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

    window.CBLogger.Debug(
      this.Status.Name + "::CastSpell",
      spell,
      expected_result
    );
  }

  CastWhenBuffed(spell, expected_result) {
    // Cast the spell whenever we know the game has a positive buff
    this.Status.DelayedSpellCastIdentifier = null;

    // Check the game buff status,
    if (
      window.Game.cookiesPs / window.Game.unbuffedCps >=
      this.Settings.MinimumBuffMultiplier
    ) {
      // Cast the spell!
      this.CastSpell(spell, expected_result);
      this.Status.DelayedSpellCastRequested = false;
    } else {
      // The conditions are not right, delay the cast!
      this.Status.DelayedSpellCastRequested = true;
      let that = this;
      this.Status.DelayedSpellCastIdentifier = window.setTimeout(function () {
        that.CastWhenBuffed(spell, expected_result);
      }, that.Settings.DelayedSpellCastWaitingTime_ms);

      this.Status.WillFireAt = new Date(
        Date.now() + this.Settings.DelayedSpellCastWaitingTime_ms
      ).toString();
      CBLogger.Debug(
        this.Status.Name + "::CastWhenBuffered",
        "waiting for buff",
        this.Status
      );
    }
  }

  Replan(ms) {
    // Replan whenever we will have enough mana
    let that = this;
    this.Status.TimeoutIdentifier = window.setTimeout(function () {
      that.Status.TimeoutIdentifier = null;
      // Figure out which spell to cast
      that.Plan();
    }, ms);

    this.Status.WillFireAt = new Date(Date.now() + ms).toString();

    window.CBLogger.Debug(this.Status.Name + "::Replan", ms, this.Status);
    return;
  }

  Plan() {
    if (this.Status.DelayedSpellCastRequested) {
      // Replan as we already requested one spell
      this.Replan(3000);
      return;
    }

    if (this.Grimoire == null) {
      this.FindGrimoire();
    }

    if (this.Grimoire == null) {
      // There is no grimoire, try to find it and try again next 10 seconds
      window.CBLogger.Warn(
        this.Status.Name + "::Plan",
        "No grimoire!",
        this.Grimoire
      );
      return this.Replan(10000);
    }

    let ms_to_mana = this.CalculateTimeToMana(this.Grimoire.magicM);

    if (ms_to_mana > 0) {
      // We can't cast the spell, it doesn't make sense to figure out what to do
      window.CBLogger.Debug(
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

    if (this.Settings.DesiredSpellOutcomes.includes(result.outcome)) {
      // We can cast it! (or at least cast it whenever we can)
      this.CastWhenBuffed(spell, result);
    } else {
      // Try to cast another spell
      spell = this.Grimoire.spells["conjure baked goods"];
      result = this.SimulateSpell(spell);

      let any_wrinkler = window.Game.wrinklers.some((w) => w.close == 1);

      if (result.win || !any_wrinkler) {
        this.CastWhenBuffed(spell, result);
      } else {
        // Bad luck.
        // even if `resurrect abomination` fails, it is not a big deal, come on :)
        spell = this.Grimoire.spells["resurrect abomination"];
        this.CastSpell(spell, result);
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
    window.CBLogger.Warn(
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
    window.CBLogger.Warn(
      this.Status.Name + "::Deactivate",
      "Deactivated",
      this.Status.Active
    );
    return !this.Status.Active;
  }

  Restart() {
    this.Deactivate();
    this.Activate();
    window.CBLogger.Warn(
      this.Status.Name + "::Restart",
      "Restarted",
      this.Status.Active
    );
    return this.Status.Active;
  }
}

class AutoClickerChecker extends RepeatingManager {
  constructor(name, settings, interval_ms, Buffname) {
    super(name, settings, interval_ms);

    this.Settings.BuffName = Buffname;
  }

  Check() {
    let that = this;

    // Enable autoclicker while `Click frenzy` buff is enabled
    if (window.Game.hasBuff(that.Settings.BuffName)) {
      window.CBAutoClicker.Demand(this.Status.Name);
    } else {
      window.CBAutoClicker.Retreat(this.Status.Name);
    }
  }
}

class GameConnector {
  findBestItemFunc(items_to_ignore) {
    let bestItem = this.FindBestItem(items_to_ignore);
    return this.ToCookieClickerItem(bestItem);
  }

  FindBestItem(items_to_ignore) { }

  ToCookieClickerItem(item) {
    // This function converts the item returned from `this.FindBestItem` to the Object/Upgrade object from CookieClicker.
    // e.g.: In the case of the best item to buy to be the wizard towes, ToCookieClickerIterm should return `Game.Objects['Wizard Tower']`
  }

  GetDesiredBankAmount() {
    // Return the desired amount of cookies in the bank
  }

  PaybackPeriod(item) { }
}

class CookieMonsterConnector extends GameConnector {

  CMData() {
    return window.CookieMonsterData;
  }

  constructor() {
    super();
    this.valid = false;

    if (this.CMData()) {
      this.valid = true;
    }
  }

  CMObjects() {
    return this.CMData().Objects1;
  }

  CMUpgrades() {
    return this.CMData().Upgrades;
  }


  FindBestBuilding(items_to_ignore) {
    if (!this.valid) {
      return null;
    }

    // Find the best item
    let bestBuilding = null;
    Object.keys(this.CMObjects()).forEach((currBuilding) => {
      if (items_to_ignore.includes(this.ToCookieClickerItem(currBuilding))) {
        return;
      }

      if (bestBuilding === null) {
        bestBuilding = currBuilding;
        return;
      }

      if (this.PaybackPeriod(currBuilding) < this.PaybackPeriod(bestBuilding)) {
        bestBuilding = currBuilding;
      }
    }, this);

    return bestBuilding;
  }

  FindBestUpgrade(items_to_ignore) {
    if (!this.valid) {
      return null;
    }

    let bestUpgrade = null;
    Object.values(window.Game.UpgradesInStore).forEach((currUpgrade) => {
      if (
        currUpgrade.pool == "toggle" ||
        items_to_ignore.includes(this.ToCookieClickerItem(currUpgrade.name))
      ) {
        return;
      }

      if (bestUpgrade === null) {
        bestUpgrade = currUpgrade.name;
        return;
      }

      if (this.PaybackPeriod(currUpgrade.name) < this.PaybackPeriod(bestUpgrade)) {
        bestUpgrade = currUpgrade.name;
      }
    }, this);

    return bestUpgrade;
  }

  FindBestItem(items_to_ignore) {
    if (!this.valid) {
      return null;
    }

    let bestBuilding = this.FindBestBuilding(items_to_ignore);

    let bestUpgrade = this.FindBestUpgrade(items_to_ignore);

    if (this.PaybackPeriod(bestUpgrade) < this.PaybackPeriod(bestBuilding)) {
      return bestUpgrade;
    } else {
      return bestBuilding;
    }
  }

  ToCookieClickerItem(item) {
    if (window.Game.Objects[item] !== undefined) {
      return window.Game.Objects[item];
    }

    if (window.Game.Upgrades[item] !== undefined) {
      return window.Game.Upgrades[item];
    }

    return null;
  }

  GetDesiredBankAmount() {
    return this.CMData().Cache.LuckyFrenzy;
  }

  PaybackPeriod(item) {
    if (this.CMUpgrades()[item] && this.CMUpgrades()[item].pp !== null) {
      return this.CMUpgrades()[item].pp;
    }

    if (this.CMObjects()[item] && this.CMObjects()[item].pp !== null) {
      return this.CMObjects()[item].pp;
    }

    return Infinity;
  }
}

class AutoBuyer extends RepeatingManager {
  constructor(name, settings, interval_ms) {
    super(name, settings, interval_ms);

    this.GameConnector = null;
    let DefaultSettings = {
      UseAdapterThreshold: true,
      MaxWaitTimeToBuy_s: 2160000, // 25days
    };
    super.FillSettings(DefaultSettings);

    this.Status.TooExpensiveItems = [];
  }

  Activate() {
    // Look for CookieMonster (use that in order to understand what to buy)
    this.GameConnector = new CookieMonsterConnector();

    if (!this.GameConnector.valid) {
      window.CBLogger.Error(
        this.Name + "::Activate",
        "CookieMonster not found!",
        this.GameConnector
      );
      console.log(
        "AutoBuyer requires CookeMonster to work correctly. Load it and then restart the manager with"
      );
      return false;
    } else {
      return super.Activate();
    }
  }

  Check() {
    this.RefreshExpensiveItems();

    let bestItem = this.GameConnector.findBestItemFunc(
      this.Status.TooExpensiveItems
    );

    // Decide the money we want left in the bank
    let target_bank_amount = this.ItemCost(bestItem, 1);
    if (this.Settings.UseAdapterThreshold) {
      target_bank_amount += this.GameConnector.GetDesiredBankAmount();
    }

    // Check if we can actually afford
    let time_until_afford = this.TimeUntilBankValue(target_bank_amount);
    if (time_until_afford == 0) {
      this.Buy(bestItem);
    }

    window.CBLogger.Debug("AutoBuyer::Check", Date.now(), this.Status)

  }

  TimeUntilCanAfford(item, quantity) {
    let target_amount = this.ItemCost(item, quantity);

    return this.TimeUntilBankValue(target_amount);
  }

  TimeUntilBankValue(target_amount) {

    let cps = window.Game.unbuffedCps;

    let cookies_missing = target_amount - window.Game.cookies;

    return Math.max(cookies_missing / cps, 0);
  }

  ItemCost(item, quantity) {
    return item.getPrice(quantity);
  }

  Buy(bestItem) {
    // Find the button in the game interface
    let is_an_object = typeof bestItem.type === "undefined";
    let dom_item = null;
    if (is_an_object) {
      dom_item = CBDOMUtilities.GetObjectDOMElement(bestItem);
    } else {
      dom_item = CBDOMUtilities.GetUpgradeDOMElement(bestItem);
    }
    CBDOMUtilities.ClickDOMElement(dom_item);
    CBLogger.Debug(
      this.Status.Name + "::Buy",
      bestItem,
      this.Status.TooExpensiveItems
    );
  }

  RefreshExpensiveItems() {
    let new_list = [];

    this.Status.TooExpensiveItems.forEach((item) => {
      if (this.TimeUntilCanAfford(item, 1) > this.Settings.MaxWaitTimeToBuy_s) {
        new_list.push(item);
      }
    }, this);

    this.Status.TooExpensiveItems = new_list;
  }
}

var CB = {
  Settings: {
    LoggingLevel: 1,
    Managers: {
      Wrinklers: {
        Activate: true,
        CustomSettings: {},
      },
      Shimmers: {
        Activate: true,
        CustomSettings: {},
      },
      ClickFrenzy: {
        Activate: true,
        CustomSettings: {},
      },
      Dragonflight: {
        Activate: true,
        CustomSettings: {},
      },
      ElderFrenzy: {
        Activate: true,
        CustomSettings: {},
      },
      CursedFinger: {
        Activate: true,
        CustomSettings: {},
      },
      Grimoire: {
        Activate: true,
        CustomSettings: {},
      },
      AutoBuyer: {
        Activate: true,
        CustomSettings: {},
      },
    },
  },
};

CB.Managers = {
  Wrinklers: new WrinklersManager(
    "wrinklers_manager",
    CB.Settings.Managers.Wrinklers.CustomSettings,
    5000
  ),
  Shimmers: new ShimmersManager(
    "shimmers_manager",
    CB.Settings.Managers.Shimmers.CustomSettings,
    800
  ),
  ClickFrenzy: new AutoClickerChecker(
    "click_frenzy_checker",
    CB.Settings.Managers.Wrinklers.CustomSettings,
    1000,
    "Click frenzy"
  ),
  Dragonflight: new AutoClickerChecker(
    "dragonflight_checker",
    CB.Settings.Managers.Dragonflight.CustomSettings,
    1000,
    "Dragonflight"
  ),
  ElderFrenzy: new AutoClickerChecker(
    "elder_frenzy_checker",
    CB.Settings.Managers.ElderFrenzy.CustomSettings,
    1000,
    "Elder frenzy"
  ),
  CursedFinger: new AutoClickerChecker(
    "cursed_finger_checker",
    CB.Settings.Managers.CursedFinger.CustomSettings,
    1000,
    "Cursed finger"
  ),

  // Grimoire: new GrimoireManager(
  //   "grimoire_manager",
  //   CB.Settings.Managers.Grimoire.CustomSettings
  // ),

  AutoBuyer: new AutoBuyer(
    "autobuyer_manager",
    CB.Settings.Managers.AutoBuyer.CustomSettings,
    3000
  ),
};

CB.Activate = function () {
  // Set logging level
  window.CBLogger.Settings.LoggingLevel = CB.Settings.LoggingLevel;

  // Activate all the Managers
  Object.entries(CB.Managers).forEach(([name, manager]) => {
    if (CB.Settings.Managers[name].Activate) {
      if (manager.Activate()) {
        window.CBLogger.Warn("Activated", name, manager.Status);
      } else {
        window.CBLogger.Error(
          "Activated",
          "Failed to activate " + name,
          manager.Status
        );
      }
    }
  });

  console.log("Thank you for using CookieButler! Visit the homepage at:");
  console.log("https://github.com/iacosite/cookie_butler");
};

CB.Deactivate = function () {
  // Deactivate all the Managers
  Object.entries(this.Managers).forEach(([name, manager]) => {
    if (manager.Deactivate()) {
      window.CBLogger.Warn("Deactivated", name, manager.Status);
    } else {
      // There has been an error, retry
      window.CBLogger.Error(
        "Deactivated",
        "Failed to deactivate " + name,
        manager.Status
      );
    }
  }, this);
};

CB.Restart = function () {
  this.Deactivate();
  this.Activate();
};

CB.Activate()