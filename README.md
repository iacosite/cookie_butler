# CookieButler
This CookieClicker extension has two main tasks:
1. Automatically click all the golden cookies in the screen (Golden/Wrath cookies and Reindeers)
2. Always allow one free wrinkler spot for new wrinklers by keeping their number to Game.getWrinklersMax-1. Pops normal wrinkles and allows shiny ones to remain alive.

This extension works with CookieClicker 2.022 and has been developed on Firefox. 

# How to use
The current way I use this is by:
1. Copy all the content of https://raw.githubusercontent.com/iacosite/cookie_butler/master/CookieButler.js in your browser javascript console
2. Enable CookieButler with:
    * `CookieButler.Activate()`
    * `CookieButler.Deactivate()`
    * `CookieButler.Restart()` 

In case you want to change the mod settings, just edit the variable `CookieButler.Settings` and restart the extension with `CookieButler.Restart()` 
