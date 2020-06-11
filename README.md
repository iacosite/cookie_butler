# CookieButler
This CookieClicker mod has two main functionalities:
1. Automatically click all the golden cookies in the screen (Golden/Wrath cookies and Reindeers)
2. Keep the number of wrinklers to either `Game.getWrinklersMax-1` or to an used defined number by popping them. Pops normal wrinkles first and only pops shiny ones when they are the only present.
3. Enable and disable an autoclicker when the following buffs are active:
   * Click Frenzy
   * Elder Frenzy
   * Dragonflight

This mod has been developed on Firefox with CookieClicker 2.022. Feel free to test it with different browse/game version combinations and report if it works!

# How to use
The current way I use this is by:
1. Create a bookmarklet with the code 

```javascript
javascript:(function() { Game.LoadMod('https://iacosite.github.io/cookie_butler/CookieButler.js'); }());
```

2. Control CookieButler by typing in your console: (The mod is activated by default)
    * `CookieButler.Activate()`
    * `CookieButler.Deactivate()`
    * `CookieButler.Restart()` 

In case you want to change the mod settings, just edit the variable `CookieButler.Settings` and restart the mod with `CookieButler.Restart()` 

# Sponsor
If you liked CookieButler and would like to contibute, either get involved or buy me a beer! -> [:beer:](https://www.paypal.me/iacosite/10USD) (or a coffee [:coffee:](https://www.paypal.me/iacosite/5USD)).
