var CookieButler={
    Settings:{
      ManageWrinklersInterval_ms:5000,
      ManageWrinklersInterval:null,
      ManageShimmersInterval_ms:1000,
      ManageShimmersInterval:null,

      LoggingLevel:0, //0:none, 1:all
      },
      Stats:{
          Historic:[],

          Update:function(action, type, quantity) {
              // Save a datapoint in the history
                CookieButler.Stats.Historic.push({
                    'Time_ms': Date.now(),
                    'action': action,
                    'type': type,
                    'quantity': quantity
                });

                if (CookieButler.Settings.LoggingLevel > 0) {
                    console.log(action, type, quantity);
                }
          },

          Reset:function(){
              CookieButler.Stats.Historic={};
          },

          ToJson:function() {
              console.log(JSON.stringify(CookieButler.Stats.Historic));
          }
      },
  
    Activate:function() {
          CookieButler.Settings.ManageWrinklersInterval=window.setInterval(CookieButler.ManageWrinklers, CookieButler.Settings.ManageWrinklersInterval_ms);
          CookieButler.Stats.Update('Activated', 'ManageWrinklersInterval', CookieButler.Settings.ManageWrinklersInterval_ms);
          console.log('Activated', 'ManageWrinklersInterval');
          CookieButler.Settings.ManageShimmersInterval=window.setInterval(CookieButler.ManageShimmers, CookieButler.Settings.ManageShimmersInterval_ms);
          CookieButler.Stats.Update('Activated', 'ManageShimmersInterval', CookieButler.Settings.ManageShimmersInterval_ms);
          console.log('Activated', 'ManageShimmersInterval');
      },
  
    Deactivate:function() {
          if(CookieButler.Settings.ManageWrinklersInterval !== null) {
              window.clearInterval(CookieButler.Settings.ManageWrinklersInterval);
              CookieButler.Settings.ManageWrinklersInterval=null;
              CookieButler.Stats.Update('Deactivated', 'ManageWrinklersInterval', 1);
              console.log('Deactivated', 'ManageWrinklersInterval');
          }
  
          if(CookieButler.Settings.ManageShimmersInterval !== null) {
              window.clearInterval(CookieButler.Settings.ManageShimmersInterval);
              CookieButler.Settings.ManageShimmersInterval=null;
              CookieButler.Stats.Update('Deactivated', 'ManageShimmersInterval', 1);
              console.log('Deactivated', 'ManageShimmersInterval');
          }
      },
  
    Restart:function() {
          CookieButler.Deactivate();
          CookieButler.Activate();
      },
  
    ManageWrinklers:function() {
  
          var shinies = [];
          var non_shines = [];
  
          // Divide wrinklers in shiny and not shiny
          window.Game.wrinklers.forEach(function(wrinkler) {
              if (wrinkler.type == 1) {
                  shinies.push(wrinkler);
              } else {
                  non_shines.push(wrinkler);
              }
          });
          CookieButler.Stats.Update('Log', 'shinies', shinies.length);
          CookieButler.Stats.Update('Log', 'non_shines', non_shines.length);
  
          // Check if they are almost the max and ensure one spot free for new wrinklers
          if ((shinies.length + non_shines.length) >= window.Game.getWrinklersMax()) {
              // pop 1
              if (non_shines.length > 0) {
                  non_shines[0].hp = 0; //anyone is fine
                  CookieButler.Stats.Update('pop', 'non_shiny_wrinkler', 1);
              } else {
                  shinies[0].hp = 0;
                  CookieButler.Stats.Update('pop', 'shiny_wrinkler', 1);
              }
          }
      },
  
    ManageShimmers:function() {
          // Pop all of them
          window.Game.shimmers.forEach(function(shimmer){
              shimmer.pop();
              CookieButler.Stats.Update('pop', shimmer.type, 1);
          });
      },

      AutoClick:function() {
          // To click
        document.getElementById('bigCookie').dispatchEvent(new MouseEvent('click', {}));
      },
  };