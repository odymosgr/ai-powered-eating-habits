# AI-Powered Eating Habits

The words we use for the app's domain: what users log and how the app reads it. Product detail lives in the [product plan](docs/product-plan.md).

## Time

**Day**:
A calendar day in the user's timezone, changing at midnight. Later, at a boundary set from the user's sleep ([plan §3.3](docs/product-plan.md#33-days)).

**Week**:
Monday to Sunday. It belongs to the month its Monday falls in.

## Bodyweight

**Bodyweight entry attempt**:
One save for a day: a weight, or none to clear the day, either confirmed or declined at a pop-up. Kept forever, never changed.
_Avoid_: Entry, measurement, log

**Bodyweight**:
A day's weight: the weight of its latest confirmed bodyweight entry attempt. A day whose latest confirmed attempt clears it has none.
_Avoid_: Weight (alone), BW

**Weight Room**:
The screen where users log their bodyweight and see it week by week.
_Avoid_: Weight Viewer

**Week trend**:
The change, in %, of a week's average bodyweight from the previous week's average. N/A when either week has fewer than 4 logged days.
_Avoid_: Trend (alone), weekly change

**Recent trend**:
The change, in %, of the average bodyweight of the last 3 days, ending today, from the 3 days before them. N/A when either group has fewer than 2 bodyweights.
_Avoid_: Trend (alone), current trend
