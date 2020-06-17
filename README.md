# CookieButler

CookieButler is a mod for CookieClicker which aims at automating the most common tasks made during active play. Its phylosophy is to only automate the game, using insights available to the human player and interacting with the game interface in the most human-like manner as possible.

CookieButler has been developed on Firefox with CookieClicker 2.022. I tested it on Chrome and it seems to work too!
Feel free to test it with different browser/game version combinations and let me know if it works!

# How to use
The current way I use this is by:
1. Create a bookmarklet with the code 

```javascript
javascript:(function() { Game.LoadMod('https://iacosite.github.io/cookie_butler/CookieButler.js'); }());
```

2. Control CookieButler by typing the commands and settings in your browser's javascript console:

Main CookieButler commands:
  * `CB.Activate()`
  * `CB.Deactivate()`
  * `CB.Restart()` 

In case you want to change some manager's settings, just edit them in `CB.Managers['the_one_you_want'].Settings` using the browser console and restart the manager with `CB.Managers['the_one_you_want'].Restart()`

# Features and settings

## Golden cookie manager
Automatically click all the Golden/Wrath cookies and Reindeers in the screen.

## Wriklers manager
Keep the number of wrinklers to either `Game.getWrinklersMax()-1` or `CB.Managers.Wrinklers.Settings.DesiredWrinklersNumber` (whichever is lower) by popping them. 

Pops normal wrinkles first and only pops shiny ones when they are the only present.

### Settings:
* `CB.Managers.Wrinklers.Settings.DesiredWrinklersNumber`: The number of wrinklers to maintain alive.
* `CB.Managers.Wrinklers.Settings.PopShinyWrinklers`: Wether to pop shiny wrinklers.

## Smart Autoclicker
Enable and disable an autoclicker when the following buffs are active:
   * Click Frenzy
   * Elder Frenzy
   * Dragonflight
   * Cursed finger

### Settings
* `CBAutoClicker.Settings.ClickFrequency`: Maximum autoclick frequency.

## Grimoire spell caster
Automatically casts spells from the grimoire (if available in game). It manages three spells:
  * Force the hand of fate
  * Conjure baked goods
  * Resurrect abomination

In case of `Force the hand of fate` will be casted, CookieButler allows the user to select which desired golden cookie buffs to accept. The default buffs can be found at `CB.Managers.Grimoire.Settings.DesiredSpellOutcomes` and are:
* Click Frenzy
* Cookie Storm
* Building special (any)
* Cookie storm drop
* Free sugar lump
* Elder frenzy
* Cursed finger

The spell caster will always cast when the mana is at maximum and follows a simple logic:
1. If `Force the hand of fate` will result in a desirable outcome, cast it.
2. Otherwise: If `Conjure Baked Goods` will succeed, or there are no wrinklers if it fails, cast it.
3. Otherwise: Cast `Resurrect abomination`. This is the spell to cast when it is expected to fail and we just need to increase the spell number.

### Settings
* `CB.Managers.Grimoire.Settings.DesiredSpellOutcomes`: List of desired spell outcomes for `Force the hand of fate`.

## Autobuyer
Automatically buys buildings and upgrades depending on the one with lowe payback period. It needs [CookieMonster](https://github.com/Aktanusa/CookieMonster) in order to inderstand which is the most convenient item and then clicks the corresponding box on the game interface.

You can have it buy sets of 1/10/100 buildings at once just by toggling the game's building shop interface to that amount.

### Settings
* `CB.Managers.AutoBuyer.Settings.UseAdapterThreshold`: Wether to try to maintain CookieMonster's `"Lucky!" Cookies Required (Frenzy)`.
* `CB.Managers.AutoBuyer.Settings.MaxWaitTimeToBuy_s`: Ignore items which take more than this period to become available. This is useful to not to get stuck in waiting for kittens and similar super expensive upgrades.



# Sponsor [:star2:](https://www.paypal.me/iacosite/10USD)
If you liked CookieButler and would like to contibute, either get involved or buy me a [beer! :beer:](https://www.paypal.me/iacosite/10USD)   (or a [coffee :coffee:](https://www.paypal.me/iacosite/)   ).

Other things you can do to help:
* Star this project on Github!
* Suggestions are always well accepted! Go to the [Suggestions Section](https://github.com/iacosite/cookie_butler/issues/new/choose) and leave your feedback!
* Upvote this mod's [reddit post](https://www.reddit.com/r/CookieClicker/comments/h0pb1x/i_developed_a_mod/) to let more people know about it!

Enjoy! :)
