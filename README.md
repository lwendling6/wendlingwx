[README.md](https://github.com/user-attachments/files/30800811/README.md)
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
text instead hold **sixteen time steps**, each with temperature, wind,
gusts, precipitation amount and type, cloud cover, freezing level, and wind
aloft.

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

| Detail | Messages | HRRR-AK | Blend 5-day | NWS 5-day |
|---|---|---|---|---|
| **Basic** | 1 | 3 h steps, 48 h | not available | not available |
| **Standard** | 2 | 2 h steps, 48 h | 3 h to 48 h, then 6 h to day 5 | 2 h to 48 h, then 6 h to day 5 |
| **Full** | 3 | hourly 24 h, then 2 h to 48 h | 2 h to 48 h, then 3 h to day 5 | hourly to 48 h, then 4 h to day 5 |

Every step carries the same fields. Length buys time resolution, not more
information per step. Basic is HRRR-AK only, because one message cannot
carry five days at any resolution worth having.

**Winds aloft** come only from HRRR-AK, and therefore only within 48 hours.
Standard and Full carry three levels, 3,000, 6,000 and 10,000 ft above sea
level, interpolated from the model's pressure levels to those true heights
rather than relabeled pressure surfaces. Basic squeezes to a single
5,000 ft level, which is what fits in one message.

## Running your own

Everything runs on free tiers: GitHub Pages serves the app, GitHub Actions
does the computing, Gmail and Google Apps Script handle the mail, and the
weather data is public. There is nothing to pay for and no server to keep
running.

You will need: a Garmin inReach with an active plan, a GitHub account, and
a spare Gmail account.

The next improvement beyond my skill level would be to expand to including satellite text messages (SMS) or iMessages.

### How the pieces fit

```
 you, in the field
   |  "WX 61.104498 -149.878428 5day"
   v
 inReach --> wx Gmail inbox
                 |  checked every 5 min by a Google Apps Script
                 v
              GitHub Actions, a free computer GitHub runs on demand
                 |  downloads HRRR-AK / Open-Meteo / NWS
                 |  packs the forecast into 1-3 coded messages
                 v
              posts them back through the reply link in Garmin's email
                 |
   you <-- satellite <--+
   |
   v
 WendlingWx app decodes them, fully offline
```

Garmin does not accept email replies; their notification email says so.
What it does contain is a link to a public page with a reply box, which
exists so anyone you message can answer without a Garmin account. The
service fills in that box the same way a person would, reading the two
identifiers it needs off the page automatically.

Two repositories: a **public** one holding the app, because GitHub only
serves free websites from public repos, and a **private** one holding the
scripts, because run logs contain your coordinates.

### Keys and money safety

You create exactly two credentials.

A **GitHub fine-grained token**, scoped to the single backend repository
with only the Contents permission. If it leaked, the worst anyone could do
is trigger forecast runs or edit that one private repo.

A **Gmail app password**, on the dedicated wx account. App passwords only
work for mail protocols and cannot log into the account.

The rules that keep them safe: the token goes only into Apps Script's
Script Properties, the app password goes only into the backend repo's
Actions Secrets, and neither ever appears in a file, a commit, or the app.
No service here has a credit card attached, so nothing can charge you. The
worst possible abuse is someone wasting free Action minutes.

To revoke: GitHub > Settings > Developer settings > Personal access tokens
> delete. Google account > Security > App passwords > remove.

### Part 1: the backend

1. On GitHub, **+** > **New repository**. Name it `wendlingwx-backend`,
   set **Private**, create it.
2. Click **creating a new file**. Create each file below one at a time,
   **typing the full path** into the filename box. The slashes create the
   folders. Do not use the upload button; it flattens folders.

   | Path to type | Contents |
   |---|---|
   | `.github/workflows/forecast.yml` | forecast.yml |
   | `scripts/forecast.py` | forecast.py |
   | `scripts/codec.py` | codec.py |
   | `scripts/send_reply.py` | send_reply.py |
   | `scripts/test_codec.py` | test_codec.py |
   | `spec/FORMAT.md` | FORMAT.md |
   | `Code.gs` | Code.gs |

3. Open the **Actions** tab. A workflow named **forecast** should appear.
   Enable workflows if GitHub asks.
4. **Dry run.** Actions > forecast > **Run workflow**, tick the synthetic
   data box, leave reply_email blank, run. It should go green in 2 to 3
   minutes, and the Build step prints the coded parts.
5. **Real run.** Same, with synthetic data unticked. Takes 5 to 15 minutes
   because it downloads real HRRR-AK. If it fails, open the red step and
   read the last 30 lines; a model run that has not published yet is the
   usual cause, so wait an hour and retry.

### Part 2: the mail loop

1. Create a fresh Gmail account, for example `wendlingwx@gmail.com`. Use a
   separate account, never your main one, and stay signed in as it for this
   whole part.
2. At myaccount.google.com > **Security**, turn on **2-Step Verification**,
   then open **App passwords**, create one named `wendlingwx actions`, and
   copy the 16 characters.
3. In the backend repo: **Settings > Secrets and variables > Actions > New
   repository secret**, twice.

   | Name | Value |
   |---|---|
   | `MAIL_ADDRESS` | the wx Gmail address |
   | `MAIL_APP_PASSWORD` | the 16 characters, no spaces |

4. Make the token: GitHub > avatar > **Settings** > **Developer settings** >
   **Personal access tokens** > **Fine-grained tokens** > **Generate new
   token**. Repository access: only `wendlingwx-backend`. Permissions >
   Repository permissions > **Contents: Read and write**, nothing else.
   Copy it now; it is shown once.
5. Go to `script.google.com` > **New project**. Delete the placeholder,
   paste in all of `Code.gs`, rename the project WendlingWx.
6. Gear icon (**Project Settings**) > **Script properties**, add three:
   `GITHUB_USER` (your username), `GITHUB_REPO` (`wendlingwx-backend`),
   `GITHUB_TOKEN` (the token).
7. Save the file. The function dropdown then populates. Choose `selfTest`,
   press **Run**, approve the permissions. At the unverified-app screen:
   **Advanced** > **Go to WendlingWx (unsafe)**. That warning appears for
   all personal scripts; this is your own code.
8. Within about 4 minutes the wx inbox receives two coded messages.
9. Clock icon (**Triggers**) > **Add Trigger**: function `main`,
   time-driven, minutes timer, **every 5 minutes**. Save.
10. Test from the device. Send to the wx address:
    `WX 61.5998 -149.1170 fake`. The word `fake` skips the download, so you
    are testing plumbing only. Then try it for real without `fake`.

**A request must contain the word WX.** Every inReach email carries a
Lat/Lon line, so without that keyword any message you sent would trigger a
forecast. Garmin's own bounce messages are ignored too.

### Part 3: the phone app

1. GitHub > **+** > **New repository**, name it `wendlingwx`, **Public**.
2. These five files are flat with no folders, so the upload button is safe
   here: drag in `index.html`, `codec.js`, `sw.js`, `manifest.json`,
   `icon.svg`. Commit.
3. **Settings > Pages** > Source: Deploy from a branch > `main` >
   `/ (root)`. Save. After a minute it shows your URL.
4. Open that URL in Safari on the iPhone, Share > **Add to Home Screen**.
5. Open it once from the home screen with signal so it caches itself.
6. **Airplane mode test, not optional.** Turn it on, close the app, reopen
   from the home screen. It must load and decode. Do not take it to the
   field until this passes.

When you publish an update later, bump the version string in both `sw.js`
and the Help tab of `index.html`, so you can tell at a glance whether a
phone is running current code.

## Using it

1. Open the app, pick the **reply detail** and the **source**. The screen
   states exactly what that combination gives you before you spend a
   message.
2. Tap **Use current location**, then **Copy message**.
3. Send that message to your wx address from the inReach.
4. Leave location sharing on if you can. The service then uses the
   inReach's own coordinates, which beat a phone fix under trees. With
   sharing off, the coordinates in the message text are used instead.
5. Wait. Ten to twenty minutes is normal.
6. Copy each reply message, open the **Decode** tab, paste each into its
   own box in any order, and tap **Read forecast**.

The forecast is a chart you scroll sideways: time runs left to right,
variables run down, and the label column stays put. An amber line marks
where the data source changes.

You can also type the request by hand:

```
WX <lat> <lon> [5day|nws] [basic|full] [fake]
```

With no keywords you get HRRR-AK at Standard, which is two messages.

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
