[README.md](https://github.com/user-attachments/files/30869219/README.md)
# WendlingWx

**Satellite weather forecasts for the Alaska backcountry.**

Text a request from your Garmin inReach. Get back a full high resolution
forecast for your exact spot, packed into 1 to 3 short messages. Read it on
your phone with no cell service.

Built by Logan Wendling. Free to use.

---

## What it is

Weather services that send forecasts to satellite messengers usually give
you a few lines of plain text: a temperature, a wind, maybe a chance of
rain. That is all that fits in 160 characters.

WendlingWx compresses the forecast into a dense code instead, then unpacks
it in an app on your phone. The same 160 characters that would hold four
numbers as text instead hold **sixteen time steps**, each with temperature,
wind, gusts, precipitation amount and type, cloud cover, freezing level,
and wind aloft.

You need a Garmin inReach with an active messaging plan. Nothing else.

---

## 1. Install the app, before you leave

The app is a web page that works completely offline once installed. Do this
at home, on wifi, not at the trailhead.

**On iPhone:**

1. Open **https://lwendling6.github.io/wendlingwx/** in **Safari**. It has
   to be Safari; Chrome on iOS cannot install web apps.
2. Tap the **Share** button, the square with an arrow.
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Close Safari and open WendlingWx from your home screen once, so it can
   save itself for offline use.

**On Android:** open the same link in Chrome, tap the three-dot menu, and
choose **Add to Home screen** or **Install app**.

### Check that offline works

This matters more than anything else on this page. Turn on **airplane
mode**, fully close the app, and reopen it from the home screen. It should
load normally and the Decode tab should still work.

If it does not load, open it once more with signal and try again. **Do not
head out until this test passes.** An app that quietly needs the network is
useless where you will be using it.

---

## 2. Save the address on your inReach

Add this as a contact on your inReach, or in the Garmin Messenger app,
whichever you send from:

```
wendlingwx@gmail.com
```

Do this at home. Typing an email address on the device in the field is
miserable.

---

## 3. Send a request

1. Open WendlingWx and stay on the **Request** tab.
2. Pick your **reply detail**: Basic, Standard or Full. This is how many
   messages come back, 1, 2 or 3. Each one counts against your inReach
   plan, so Basic is the cheap habit.
3. Pick your **source**: HRRR-AK, the 5-day blend, or NWS. The blue line
   under the buttons tells you exactly what that combination gives you
   before you spend anything.
4. Tap **Use current location**. Step into the open if it fails. GPS works
   fine in airplane mode. If you would rather type coordinates, tap **Enter
   coordinates manually**.
5. Tap **Copy message**.
6. Open your inReach or the Garmin app, start a new message to
   `wendlingwx@gmail.com`, paste, and send.

**Leave location sharing turned on if you can.** The service then uses the
inReach's own GPS coordinates, which are better than a phone fix under
trees. With sharing off it falls back to the coordinates in the message
text, and everything still works.

Then wait. **Ten to twenty minutes is normal.** The satellite link is slow
in both directions and the weather data takes several minutes to pull.

### Typing a request by hand

If the app is not handy, any message in this shape works:

```
WX <latitude> <longitude> [5day|nws] [basic|full]
```

For example `WX 63.06724 -151.00652 5day basic`. With no extra words you get
HRRR-AK at Standard detail, which is two messages back.

---

## 4. Read the reply

The reply arrives as 1 to 3 messages of jumbled letters. That is normal.

1. Copy the first reply message.
2. Open WendlingWx, tap the **Decode** tab, and paste it into **Message 1**.
3. Copy the next reply and paste it into **Message 2**, and so on. Use
   **+ Add another message** if you need a third box.
4. Order does not matter. Paste them in whatever order is convenient.
5. Tap **Read forecast**.

If it says a part is missing, one of the messages has not arrived yet.
Wait and try again once it does. If it says the checksum failed, one
message was cut off or garbled in copying, so re-copy each one in full.

---

## 5. What the choices mean

| Detail | Messages | HRRR-AK | 5-day blend | NWS 5-day |
|---|---|---|---|---|
| **Basic** | 1 | every 3 h for 48 h | not available | not available |
| **Standard** | 2 | every 2 h for 48 h | 3 h to 48 h, then 6 h to day 5 | 2 h to 48 h, then 6 h to day 5 |
| **Full** | 3 | hourly for 24 h, then 2 h to 48 h | 2 h to 48 h, then 3 h to day 5 | hourly to 48 h, then 4 h to day 5 |

Every time step carries the same information. A longer reply buys you finer
time resolution, not more detail per step.

**HRRR-AK** is NOAA's 3 km Alaska model. It is fine enough to resolve
terrain, which matters enormously in mountains: inlet channeling, gap
winds, the difference between a valley and the ridge above it. Best for
anything inside two days, and the only source that includes winds aloft.

**5-day blend** uses HRRR-AK for the first 48 hours, then a global model
for days 3 to 5 at roughly 11 to 13 km. Fine for "is a system coming,"
poor for timing. Planning, not commitment.

**NWS 5-day** is the National Weather Service forecast grids, model output
adjusted by Alaska forecasters who know the local biases. It fails in
different ways than raw model output, so when it and HRRR-AK agree your
confidence should go up. That is exactly why both are offered.

**Basic is HRRR-AK only.** One message cannot carry five days at any
resolution worth having, so the other two grey out when you pick it.

**Winds aloft come only from HRRR-AK, and only inside 48 hours.** Standard
and Full give you three levels, 3,000, 6,000 and 10,000 ft above sea level.
Basic squeezes down to a single 5,000 ft level, which is what fits in one
message.

---

## 6. Reading the forecast

The plot at the top is temperature across the whole period, so you can see
the shape of it before reading any numbers.

Below that is a chart you **scroll sideways**. Time runs left to right and
variables run down. The label column on the left stays put while you
scroll, so you always know which row you are reading.

- **Wind arrows point the way the wind is travelling.** The compass letters
  in the **From** row say where it is coming from.
- **Gusts** only appear when they are meaningfully above the sustained
  wind.
- **Freeze** is the freezing level in thousands of feet above sea level.
  Compare it to your own elevation, shown in the header.
- **3k / 6k / 10k ft** are the winds aloft, in mph, at those heights above
  sea level.
- An **amber vertical line** marks where the data source changes, for
  example HRRR-AK handing off to the global model on day 3. Trust
  everything right of that line less.

The coloured bars above the chart flag the things most likely to change a
decision: how low the freezing level gets, the peak surface gusts, and the
peak wind aloft.

---

## 7. Keeping the app updated

The app updates itself whenever you open it with a signal, so usually there
is nothing to do.

To confirm which version you have, open the **Help** tab and look at the
version line at the bottom. If you ever suspect the app is stale, delete
the home screen icon, open the link in Safari again, and re-add it.

---

## 8. If something goes wrong

**No reply after 30 minutes.** Resend. Satellite messages do go missing
sometimes, in both directions.

**A reply that says the forecast failed.** The service hit an error, often
a weather model that had not published yet. Wait 15 minutes and try again.

**The app says a part is missing.** One message has not arrived. Wait for
it, then paste all of them again.

**The app says the checksum failed.** A message was garbled or cut off in
copying. Re-copy each one completely and try again.

**Your phone is dead.** The coded reply cannot be read without the app.
This is the real limitation of the whole idea, and the reason it should
supplement a plan rather than be one.

---

## Honest limitations

**This is a hobby service with no guarantee.** It runs on free tiers of
several services, any of which can change or break without notice. There is
no support desk and no uptime promise.

**Delivery depends on a Garmin page that is not documented.** Garmin does
not accept email replies, so the service uses the reply form their
notification email links to. That page has changed before, and when it
changes, replies stop until the code is fixed.

**Models are wrong sometimes**, especially in valleys during winter
inversions and for precipitation timing in complex terrain. That is why two
independent sources are offered rather than one.

The next improvement beyond my skill level would be to expand to including satellite text messages (SMS) or iMessages.

Never bet a river crossing, a flight, or an exposed night on the ridge on a single
forecast from anything, including this.

---

## Credits

Forecast data from NOAA (HRRR-AK, National Weather Service), Open-Meteo,
and Copernicus. Model data retrieval by Herbie and pygrib. None of these
organizations endorse or are involved with this tool, and any errors in
what you see are this tool's, not theirs.
