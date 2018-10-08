# offline-report

![WebReflection status](https://offline.report/status/webreflection.svg)

A GitHub based offline planner through command line.

The easiest way to let others know you are offline and, whatever it is, could wait until you are back.


#### Use cases ?

  * you are on vacation
  * you are spending time over the weekend with friends and family
  * you are watching a movie at the cinema
  * every single time you don't want to be disturbed for a certain amount of time


### How to test the experimental CLI

```js
// npm i -g offline-report or ...
npx offline-report about webreflection
```

If you'd like to start handling your own offline time just type `npx offline-report`.

You'll be put in front of a one-time GitHub verification through your user, password, and eventually the 2FA code.

If everything is OK, you'll be able from that time on to read, remove, and update all your vacations so that both you, and anyone else, could find out if it's a good time to bother you.

Please note that your **password**, **or** your **token**, will **never** be **stored**.

However the password will be required per each vacations removal or updates.

The service works offline first, but you need a connection to update, hence let others know, your offline time.


### Options

Currently, there are few semantic, English only, options you can check through `offline-report --help`.

Following few examples.

```js
// read another github user vacations
offline-report about webreflection

// see in a range from today until 31st of December
offline-report about webreflection from now til 31/12

// setup first time and/or ready your own vacations
offline-report

// set your own vacations (you cannot set other users vacations anyway)
offline-report set day tomorrow
offline-report book from 20/12 to 27/12
// there are few aliases too, shown in --help

// cancel some vacation
offline-report cancel from 22/12 to 24/12
```

#### Still missing

 * [x] binary offline status through the website `offline.report/status/USER(.svg,.txt)`
 * [ ] auto-responder bot while on vacation
 * [ ] vacations through the website `offline.report/about/USER`
 * [ ] vacations admin through the website (stretch goal)
