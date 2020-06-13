# CookieButler

CookieButler is a mod for CookieClicker which aims at automating the most common tasks made during active play. Its phylosophy is to only automate the game, using insights available to the human player and interacting with the game interface in the most human-like manner as possible.

CookieButler has been developed on Firefox with CookieClicker 2.022. I tested it on Chrome and it seems to work too!
Feel free to test it with different browser/game version combinations and let me know if it works!

## Golden cookie manager
Automatically click all the Golden/Wrath cookies and Reindeers in the screen.

## Wriklers manager
Keep the number of wrinklers to either `Game.getWrinklersMax()-1` or `CM.Managers.Wrinklers.Settings.DesiredWrinklersNumber` (whichever is lower) by popping them. 

Pops normal wrinkles first and only pops shiny ones when they are the only present.

## Smart Autoclicker
Enable and disable an autoclicker when the following buffs are active:
   * Click Frenzy
   * Elder Frenzy
   * Dragonflight
   * Cursed finger

It is possible to set the autoclicker speed at `CM.AutoClickerInstance.Settings.ClickFrequency`. 

## Grimoire spell caster
Automatically casts spells from the grimoire (if available in game). It manages three spells:
  * Force the hand of fate
  * Conjure baked goods
  * Resurrect abomination

In case of `Force the hand of fate` will be casted, CookieButler allows the user to select which desired golden cookie buffs to accept. The default buffs can be found at `CM.Managers.Grimoire.Settings.DesiredSpellOutcomes` and are:
* Click Frenzy
* Cookie Storm
* Building special (any)
* Cookie storm drop
* Free sugar lump
* Elder frenzy
* Cursed finger

The spell caster will always cast when the mana is at maximum and follows a simple logic:
1. If `Force the hand of fate` will result in a desirable outcome, cast it.
2. Otherwise: If `Conjure Baked Goods` will succeed, cast it.
3. Otherwise: Cast `Resurrect abomination`. This spell is expected to fail.

# How to use
The current way I use this is by:
1. Create a bookmarklet with the code 

```javascript
javascript:(function() { Game.LoadMod('https://iacosite.github.io/cookie_butler/CookieButler.js'); }());
```

2. Control CookieButler by typing in your console: (The mod is activated by default)
    * `CB.Activate()`
    * `CB.Deactivate()`
    * `CB.Restart()` 

In case you want to change the some settings, just edit them in `CB.Managers['the_one_you_want'].Settings` using the browser console and restart the manager with `CB.Managers['the_one_you_want'].Restart()` 

# Sponsor [:beer:](https://www.paypal.me/iacosite/10USD)
If you liked CookieButler and would like to contibute, either get involved or buy me a beer! -> [:beer:](https://www.paypal.me/iacosite/10USD)   (or a coffee [:coffee:](https://www.paypal.me/iacosite/5USD)   ).

You can also give some suggestions (just open an issue) and star this project to give it visibility!
Enjoy! :)
