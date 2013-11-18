// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");

Players.allow({
  //insert: function() { return Meteor.user() },
  update: function() { return true },
});

Meteor.methods({
  add: function(player) {
    var user = Meteor.user();

    if (!user)
      throw new Meteor.Error(401, "You need to login to add players");

    if (!player.name)
      throw new Meteor.Error(422, 'Please fill in a name');

    player['timestamp'] = new Date().getTime()
    player['author'] = Meteor.user().profile.name

    var id = Players.insert(player);
    return id;
  }
});

if (Meteor.isClient) {
  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    },
    'submit form': function(e) {
      e.preventDefault();
      console.log("hit");
      var player = {
        name: $(e.target).find('[name=name]').val(),
        score: 5
      }

      Meteor.call('add', player, function (err, res) {
        if (err)
          return alert(err.reason);
      });
      $(e.target).find('[name=name]').val("");
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });

  Meteor.subscribe('players');

 Deps.autorun(function() {
   console.log("There are " + Players.find().count() + ' players');
 });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });

  Meteor.publish('players', function() {
    return Players.find();
  });
}
