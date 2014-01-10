Leaderboard demo
================

This is my presentation notes from a demonstration (quickly translated to english) of some basic Meteor concepts, using [Meteor](http://www.meteor.com), performed as a "Lunch & Learn"-session at Valtech (in November 2013).
Please use as a simple Meteor introduction if you like...

Where to start?
---------------

A good first example is to start from one of the most basic examples distributed with Meteor, Leaderboard.

    curl https://install.meteor.com | /bin/sh
    meteor create --example leaderboard
    meteor

open [http://localhost:3000](http://localhost:3000) in two different browsers
open editor and watch the generated sample structure

Key concepts to show:

* Basic reactivity in Meteor - how any change in one browser is reflected in the other without browser reload
* Hot code push - Change a file on disk, and watch the content be immidiately reflected in each connected browser (without a browser refresh)
* MongoDB API is available on client side (minimongo) - Open javascript console in browser and show e.g. : Players.findOne() , update, insert etc...

That's very usable for development. But for a production app it is not practical to allow clients to update DB via javascript console...

Let's remove the training wheels
--------------------------------

    meteor remove insecure

Show:

* Now you can no longer update DB from browser (and the "Give 5 points" button in the app no longer works) - it will give "access denied")
* One interesting finding - if you kill the server (i.e. Ctrl-C ), you are allowed to do local changes again in the browser. But when you start the server again, and client is synced with server your changes will be overwritten - _Latency compensation in action_

Let's also remove the other default publications

    meteor remove autopublish

Show:

* Nothing is shown in browser windows any more

We have to add publish/subscribe.

First add publish to server-part of leaderboard.js:

    Meteor.publish('players', function() {
      return Players.find();
    });

Then add subscribe to client side of leaderboard.js:

    Meteor.subscribe('players');

Result should be that the leader board list is back in the browser again.

Try this is browser JS-console:

    Players.insert({name: "Andy"})

Result in websocket log should be: websocket log: Access denied, because we have not added permissions yet.

Adding this (below) should make it possible to insert a Player via the browser console again:

    Players.allow({
      insert: function() { return true; },
      update: function() { return true; }
    });

Now we are back to where we were when using packages: insecure and autopublish.

New requirement: Only logged in users should be allowed to add a player
-----------------------------------------------------------------------

Add login packages:

    meteor add accounts-password
    meteor add account-ui

The only thing that is needed in the html.file is to add the row:

    {{loginButtons}}

By adding those packages and the single handlebars-helper call we get a signup/login-form.
Go to the site: [http://localhost:3000](http://localhost:3000) and create a new account and log in.

Now we can change the Players.allow statement to only allow inserts for logged in users:

    Players.allow({
      insert: function() { return Meteor.user() },

So if we log out the user and test the following in browser console, we should get "access denied"

    Players.insert({name: "Some user"})

So what if we want Facebook login?
That is really easy with Meteor (account packages for e.g. Google and Facebook are built in).

    meteor add accounts-facebook

This adds a facebook option to the built-in login dialog with clear instructions of how to create a facebook app and use the credentials. Just click the "Configure Facebook login" button, and follow the guide, and add your Facebook tokens to the dialog.

Without any more coding you should now be able to login using a Facebook-login and in browser window type:

    Players.insert({name: "Bert"})

And this time you should not get an "access denied" error.

Real users does not use their browser console to add stuff to an app...
-----------------------------------------------------------------------

Now when we have an app with user accounts and facebook login, it is time to add more ways to insert data than using the browser console.

Add a simple form inside template "leaderboard" in leaderboard.html:

    <form>
      <input name="name" type="text" value="" placeholder="New name" />
      <input type="submit" value="Add"/>
    </form>

...and a new event handler in leaderboard.js : Template.leaderboard.events:

    'submit form': function(e) {
      e.preventDefault();
      var player = {
        name: $(e.target).find('[name=name]').val(),
        score: 5
      }

      Players.insert(player);
      $(e.target).find('[name=name]').val("");
    }

That's all needed to let a logged in user add a new player by adding a name in the form . And as usual in Meteor all changes to any client will be reflected on all other connected clients at once, without any browser refresh.

But to use client side Mongo insert is not the only way you can add data in Meteor, sometimes it is better to use a Meteor method instead.
Place the following code in the "common part" of the js file (i.e.: outside of both Meteor.isServer() and .isClient(), because this is code that should run on both client and server):

    Meteor.methods({
      add: function(player) {
        var user = Meteor.user();

        if (!user)
          throw new Meteor.Error(401, "You need to login to post new stories");

        // ensure the post has a title
        if (!player.name)
          throw new Meteor.Error(422, 'Please fill in a name');

        var id = Players.insert(player);
        return id;
      }
    });

And replace the client side Mongo insert (Players.insert(player)) with:

    Meteor.call('add', player);

Or if you want to have better error handling use the async version:

    Meteor.call('add', player, function(err) {
      if (error)
        return alert(error.reason);
    });

Adding more fields to a Mongo collection is easy.
Add this to the 'add'-function:

    player['timestamp'] = new Date().getTime()
    player['author'] = Meteor.user().profile.name

...and this to the player template in the html:

    <span class="">{{author}}</span>

 Now any logged in user can add a player and the name of the author is reflected next to the player in the interface.

So, now we have a cool app (Well...a starting point at least). Let's publish it to the world!
The nice folks at Meteor will host it for free (I don't know all the details about quota etc.), just write:

    meteor deploy your-cool-app-name.meteor.com

Mine is deployed on: [http://valtech-leaderboard.meteor.com](http://valtech-leaderboard.meteor.com/). Just login with a Facebook account and try to add a player.

This [commit](https://github.com/andreasekstrom/demo-meteor-leaderboard/commit/3a734366c36d10c97e297b06c67168daf50ac443) shows all the few changes I did during the demo.

That's all for a first introduction. Go ahead and try out yourself!





