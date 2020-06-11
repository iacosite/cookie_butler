# CookieButler
This CookieClicker mod has two main functionalities:
1. Automatically click all the golden cookies in the screen (Golden/Wrath cookies and Reindeers)
2. Keep the number of wrinklers to either `Game.getWrinklersMax-1` or to an used defined number by popping them. Pops normal wrinkles first and only pops shiny ones when they are the only present.
3. Enable and disable an autoclicker when the following buffs are active:
   * Click Frenzy
   * Elder Frenzy
   * Dragonflight

This mod has been developed on Firefox with CookieClicker 2.022. I tested it on Chrome and it seems to work too!
Feel free to test it with different browser/game version combinations and let me know if it works!

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

In case you want to change the some settings, just edit them in `CB.Managers['the_one_you_want'].Settings` or `CB.AutoclickerCheckers['the_one_you_want'].Settings` using the browser console and restart the mod with `CB.Restart()` 

# Sponsor
If you liked CookieButler and would like to contibute, either get involved or buy me a beer! -> [:beer:](https://www.paypal.me/iacosite/10USD) (or a coffee [:coffee:](https://www.paypal.me/iacosite/5USD)).

You can also give some suggestions (just open an issue) and star this project to give it visibility!
Enjoy! :)
