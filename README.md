[README.md](https://github.com/user-attachments/files/30768400/README.md)
# WendlingWx

**Satellite weather forecasts for the Alaska backcountry.**

Text a request from your inReach. Get back a full high resolution forecast
for your exact spot, packed into 1 to 3 short messages. Decode it on your
phone with no cell service.

Built by Logan Wendling. Free to use, free to run, free to copy.

---

## What it does

Weather services that send forecasts to satellite messengers usually give
you a few lines of text: a temperature, a wind, maybe a chance of rain.
That is all that fits in 160 characters of plain English.

WendlingWx compresses the forecast into a dense code instead, then unpacks
it on your phone. The same 160 characters that would hold four numbers as
text instead hold **twelve time steps**, each with temperature, wind,
gusts, precipitation amount and type, cloud cover, freezing level, and
winds aloft at three elevations.

The decoder is a small web page that works entirely offline once installed.

## Where the data comes from

**HRRR-AK**, NOAA's 3 km High-Resolution Rapid Refresh model for Alaska.
Fine enough to resolve terrain, which matters enormously in mountains: the
difference between a valley and the ridge above it, inlet channeling, gap
winds. Covers 48 hours.

**Open-Meteo**, a blend of global models, for days 3 to 5. Coarser, around
11 to 13 km. Good for "is a system coming," poor for timing.

**National Weather Service forecast grids**, which are model output
adjusted by Alaska forecasters who know the local biases. Available for all
five days, with different failure modes than raw model output.

Ground elevation comes from the Copernicus GLO-90 dataset, and is used to
correct temperature from the model's smoothed terrain to your actual
height, using the model's own vertical temperature profile so inversions
come out right rather than backwards.

## What you get

| Choice | Messages | Coverage |
|---|---|---|
| Basic, cover 2 days | 1 | 48 h at 4 h steps |
| Basic, detail 24 h | 1 | 24 h at 2 h steps |
| Standard | 2 | 48 h at 2 h steps |
| Full | 3 | hourly through day 1, then 2 h |

The 5 day and NWS options extend to 120 hours at coarser steps beyond
48 hours.

Every step carries the same fields. Length buys time resolution, not more
information per step.

**Winds aloft** at 3,000, 6,000 and 10,000 ft above sea level come only
from HRRR-AK, and therefore only within 48 hours. They are interpolated
from the model's pressure levels to those true heights, not relabeled
pressure surfaces.

## Running your own

Everything runs on free tiers: GitHub Pages serves the app, GitHub Actions
does the computing, Gmail and Google Apps Script handle the mail, and the
weather data is public. There is nothing to pay for and no server to keep
running.

You will need: a Garmin inReach with an active plan, a GitHub account, and
a spare Gmail account.

The next improvement beyond my skill level would be to expand to including satellite text messages (SMS) or iMessages. 
## Honest limitations

**This is a hobby tool with no guarantee.** It depends on free tiers of
several services, any of which can change without notice.

**Delivery uses Garmin's public reply page**, the one their notification
email links to, because Garmin does not accept email replies. That page is
undocumented and has changed before. When it changes, delivery breaks until
the code is updated.

**Models are wrong sometimes**, especially in valleys during winter
inversions and for precipitation timing in complex terrain. Two of the
three options exist precisely so you can compare independent sources.

**The coded reply is unreadable without the app.** If your phone dies, you
have nothing. Carry knowledge of the pattern before you leave, and treat
this as a supplement rather than a plan.

Never bet a river crossing, a flight, or an exposed night on the ridge on a single
forecast from anything, including this.

## Credits

Forecast data from NOAA (HRRR-AK, National Weather Service), Open-Meteo,
and Copernicus. Model data retrieval by Herbie and pygrib. None of these
organizations endorse or are involved with this tool, and any errors in
what you see are this tool's, not theirs.
