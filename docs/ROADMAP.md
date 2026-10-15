# Pit Wall Replay: Roadmap

Status as of 2026-10-15. Tick boxes as tasks are completed.

**Current step:** Phase 2, task 2.1a (Telemetry, part A).

---

## Where the project stands

### Working

**Server (Express → OpenF1)**
- Proxy routes for sessions, meeting, session, drivers, laps, positions, intervals, stints, result and locations
- OpenF1 token handling with refresh and retry on a 401, a shared 5 req/s rate limiter with Retry-After backoff, and a TTL cache that merges duplicate in-flight requests
- Location downsampling to about 1 Hz and building the track outline from the fastest lap
- Tests pass (29)

**Client: race replay page** (`/race/:sessionKey`)
- `useSessionTimeline` merges all the data streams into per-driver timelines and works out who stopped running (DNS/DNF), including a fallback for when there's no result yet
- Playback engine: play/pause, 2×/5×/10×, hold to fast-forward or rewind, jump to next or previous lap, keyboard shortcuts. Tests pass (12)
- Live driver standings (gap or interval, tyre compound and age), track map with interpolated cars, position-per-lap D3 chart, scrubber, session header, loading skeletons
- Driver selection: click a driver in the list or a car on the map to select them (click again to clear); the selected car keeps its map label

**Client: race list page** (`/`)
- Season picker, race cards, fetching a race's drivers early on hover

### Built but not wired up (hardcoded data)

| Component | State | What it needs |
|---|---|---|
| `TelemetryPanel` | Hardcoded NOR data | `selectedDriver` is ready in `Session.tsx`; still needs OpenF1 `car_data` (speed, gear, DRS, throttle, brake) and sector times from laps |
| `RaceControl` | 4 hardcoded messages | A new `/race_control` route and schema, filtered to the current replay time |
| `ContinueWatching` | Hardcoded "British GP, lap 34" | Save the last session and its playback position to localStorage |
| `RaceFilters` | Buttons and search box do nothing | Filter state in `App.tsx`. Sprint filtering needs sprint session data |
| `RaceCard` | Sprint tag is a TODO; status always says "Ready" | Sprint lookup and real status (upcoming, cancelled) |
| Driver route | Renders `<div>About Page</div>` | An actual driver detail page |
| `LapsPanel` / `LapTable` / `LapRow` / `LapHeader` | Not used anywhere | Reuse them on the driver page or delete them |
| `pitStopSchema` | Exported, but no server route | A `/pit` route; would feed race control and telemetry ("1 stop") |

### Bugs and loose ends

1. ~~**Client typecheck fails**: unused `isMeetingLoading` in `Session.tsx`~~ (fixed in e6dc0f9)
2. ~~**Unnecessary recalculation in `useSessionTimeline.ts`**: if the result query fails, `result = []` is a new array every render, so the timeline is rebuilt every frame during playback~~ (fixed in e812cf0)
3. ~~**Broken driver links**: `DriverListItem` links to `/drivers/N`, which doesn't match `/race/:sessionKey/driver/:driverNumber`. It's also a plain `<a>`, so clicking it reloads the page and loses playback position~~ (fixed in 8870426; the row is now a selection button, and the driver page link returns in Phase 4)
4. ~~**Conflicting tyre colours**: `DriverListItem` has its own colour switch, which doesn't match the unused `constants/compounds.ts`~~ (fixed in 9339271)
5. ~~**Mixed import styles**: some files use `@pitwall/shared`, others use relative `../../../shared/src/...`~~ (fixed in 334a910 and 9224486)
6. **Bare error and 404 states**: plain `<div>Error: …</div>` and a plain-text not-found page
7. **Deferred**: hide each car's map marker once that driver crosses the finish line
8. **README** is still the default Vite template

---

## Phases

### Phase 0: Fix what's broken ✅
Small, mechanical work so the build is green and the code is consistent. Breakdown below.

### Phase 1: Driver selection ✅
Needed by the telemetry panel, the driver page and the map. Breakdown below.
- Add a selected-driver state to `Session.tsx`: click a driver in the list or on the map to select them; hovering stays a temporary highlight
- Fix the driver link (bug 3) at the same time

### Phase 2: Fill in the session page panels (in progress)
Telemetry part A is broken down below. The other items get broken down once part A is done.
- **Telemetry, part A**, using data already loaded: position, gap, last and best lap, sectors, tyre and stop count for the selected driver
- **Race control**: server route and schema, then show messages up to the current time. Adding the pit stop route alongside it lets pit stops appear as messages too
- **Telemetry, part B**: speed, gear, throttle, brake and DRS from `car_data`. Heaviest data, so fetch it for one driver at a time and cache it on the server like locations
- Hide finisher markers on the map (bug 7): compute a per-driver `finishedAt` (final lap start + `lap_duration`) in `useSessionTimeline`; test the case where the final lap has no `lap_duration`

### Phase 3: Race list page
- **Continue watching**: save to localStorage while watching; hide the panel when nothing is saved
- **Search and filters**: search box first (easy); sprint filter and card tag need a sprint-session lookup
- Race card status: upcoming or cancelled (`is_cancelled` is already in the schema)

### Phase 4: Driver page
- Build `/race/:sessionKey/driver/:driverNumber` using the existing lap table components, or delete them if the page isn't wanted

### Phase 5: Polish
- Proper error, empty and 404 states (bug 6)
- Handle `fetchMeeting` returning `undefined` when OpenF1 sends an empty array: the session header skeleton currently shows forever in that case
- Project README (bug 8)
- Express error handler so a failed OpenF1 call returns JSON instead of Express's default HTML error page

---

## Phase 0 breakdown

Each task is a single change you can check before moving on.

### 0.1 Get the build green

- [x] **a.** Run `npm run typecheck` from the repo root and read the one error. *Done when:* you can say which file, which line, and what TypeScript is complaining about
- [x] **b.** Decide whether `isMeetingLoading` should be used or removed, by looking at how `Session.tsx` decides when to show `SessionHeaderSkeleton`. *Decision:* removed; the header already shows the skeleton whenever there's no meeting and no error
- [x] **c.** Make the change. *Done when:* `npm run typecheck` passes for all three packages
- [x] **d.** Run `npm run build -w packages/client`. *Done when:* the Vite build succeeds
- [x] **e.** Commit. One small commit with just this change. Pick a conventional-commit prefix (`feat:` doesn't fit) and a message under about 60 characters

### 0.2 Stop the timeline rebuilding on every render

- [x] **a.** Open `client/src/hooks/useSessionTimeline.ts` and find where `result` is assigned (the line with `isError ? [] : ...`)
- [x] **b.** Work out why `[]` breaks `useMemo`: how does React compare dependencies? *Done when:* you can explain it in one sentence
- [x] **c.** Look at how `Session.tsx` avoids the same problem with `NO_LAPS`
- [x] **d.** Apply that pattern here
- [x] **e.** Run `npx oxlint` in `packages/client`. *Done when:* the `exhaustive-deps` warning on `result` is gone
- [x] **f.** Commit

### 0.3 One source of tyre colours

- [x] **a.** Compare the `switch` in `DriverListItem.tsx` with `TYRE_COMPOUND_COLOURS` in `constants/compounds.ts`. Note that `TYRE_COMPOUND_COLOURS` isn't imported anywhere
- [x] **b.** Pick which colours are correct. Hint: `TelemetryPanel` uses `#F5D33F` for medium. *Decision:* keep the `switch` colours; the constant only had placeholder values
- [x] **c.** Update `TYRE_COMPOUND_COLOURS` with the chosen values
- [x] **d.** Check the type of `row.compound` in `StandingRow` (`lib/timeline.ts`). Is `.toLowerCase()` needed at all? Are the keys `'SOFT'` or `'soft'`?
- [x] **e.** Replace the `switch` with a lookup into the constant, keeping a fallback for `undefined`
- [x] **f.** Run the app and check the tyre pills look the same as before
- [x] **g.** Commit

`TelemetryPanel` also hardcodes a tyre colour, but its data is all placeholder and gets replaced in Phase 2, so leave it alone for now.

### 0.4 Use `@pitwall/shared` everywhere

There are 25 relative `../../../shared/src/...` imports across 11 files. Do one file (or small group) per step, and keep `import type` for type-only imports.

- [x] **a.** Check `packages/shared/src/index.ts` and confirm everything those files import is exported from it
- [x] **b.** `lib/queries.ts` (most imports, so start here)
- [x] **c.** `lib/timeline.ts`
- [x] **d.** `hooks/useSessionTimeline.ts` (done in e812cf0)
- [x] **e.** `components/TrackMap/TrackMap.tsx`
- [x] **f.** `components/Charts/PositionPerLapD3.tsx` and `lineStyles.ts`
- [x] **g.** `lib/tableConfig.tsx` and the four `Lap*` components
- [x] **h.** `grep -rn "shared/src" packages/client/src` returns nothing
- [x] **i.** Typecheck, tests, commit

---

## Phase 1 breakdown

Hovering already works: `Session.tsx` holds `hoveredDriver` and passes it down to `DriverList` and `TrackMap`. Selection follows the same path, but it sticks after the pointer leaves. Clicking the selected driver again clears it.

### 1.1 Add the state

- [x] **a.** In `Session.tsx`, add `selectedDriver` state next to `hoveredDriver`, with the same type
- [x] **b.** Write a `toggleSelectedDriver(driverNumber)` function that selects the driver, or clears the selection if that driver is already selected. Hint: pass a function to the setter (`setSelectedDriver(current => ...)`) so you don't read stale state
- [x] **c.** Temporarily render `{selectedDriver}` somewhere visible (e.g. above `<TelemetryPanel />`) so you can watch it change in the next steps. You'll delete it in 1.4

### 1.2 Driver list: click to select (also fixes bug 3)

- [x] **a.** Read `DriverListItem`. The row is an `<a href="/drivers/N">`. Answer two questions: why does clicking it reload the whole page, and does a row that *selects* something belong in a link or a button? *Done when:* you can say in a sentence why it should be a `<button type="button">`. The real driver page link comes back in Phase 4 using React Router's `<Link>`
- [x] **b.** Swap the `<a>` for a `<button type="button">` and remove the `href`. Leave the click handler for the next step
- [x] **c.** Run the app. Buttons come with browser styles (background, border, font, centred text, width), so the row will probably look different. Fix it in `.driver-list-item` in `driversPanel.css`. *Done when:* the list looks the same as before
- [x] **d.** Add two props to `DriverListItem`: `selected: boolean` and `onSelect: (driverNumber: number) => void`. Call `onSelect` from `onClick`
- [x] **e.** Add `selectedDriver` and `onSelectDriver` props to `DriverList` and pass them through to each item (same pattern as `hoveredDriver` and `onHoverDriver`)
- [x] **f.** Pass `selectedDriver` and `toggleSelectedDriver` from `Session.tsx`. *Done when:* clicking a row changes the number from 1.1c, and clicking it again clears it
- [x] **g.** Add `aria-pressed={selected}` to the button. Look up what it tells a screen reader
- [x] **h.** Give the selected row its own look. The `className` ternary only handles one flag, so first change it to build the class list from both `highlighted` and `selected`, then add an `.is-selected` rule in the CSS. Make it different from hover (e.g. a team-colour left border or a stronger background using `--team-colour`). *Done when:* you can hover one driver while another is selected and tell them apart
- [x] **i.** Gotcha check: click a driver, then press Space. What happens, and why? (Read the comment in `usePlayback.ts` near `HTMLButtonElement`.) Decide if that's acceptable. It's fine to leave it, but know why it happens
- [x] **j.** Typecheck, lint, commit

### 1.3 Track map: click to select

- [x] **a.** Add `selectedDriver` and `onSelectDriver` props to `TrackMap`, and pass them from `Session.tsx`
- [x] **b.** Add `onClick` to each car's `<g>`. Add `cursor: pointer` for `.track-map__car` in `trackMap.css`. *Done when:* clicking a car on the map highlights its row in the list
- [x] **c.** Right now only `hoveredCar` gets drawn on top with its name label, so the selected car loses its label as soon as the mouse leaves. Change it so the selected car always gets the label, and the hovered car does too. Watch out for the case where they're the same driver: don't draw it twice
- [x] **d.** Run the app: select from the list, move the mouse away, and check the map label stays. Select from the map and check the list row
- [x] **e.** Edge case: select a driver who retires (pick a race with a DNF) and play past the point where they stop. The car disappears from the map. Check nothing breaks and the list row still shows as selected
- [x] **f.** Typecheck, lint, commit

### 1.4 Tidy up

- [x] **a.** Remove the temporary `{selectedDriver}` from 1.1c
- [x] **b.** Update the `TelemetryPanel` TODO comment in `Session.tsx` to say it will use `selectedDriver` (Phase 2)
- [ ] **c.** *(Optional, skipped)* Press Escape to clear the selection. Think about where the listener belongs: `usePlayback` handles playback keys, and selection isn't playback
- [x] **d.** Strike through bug 3 above and tick Phase 1
- [x] **e.** Typecheck, lint, tests, commit

---

## Phase 2 breakdown: Telemetry, part A

The goal is to make `TelemetryPanel` show the selected driver using data that's already loaded. Speed, gear, DRS and pedals stay as placeholders until part B.

Most of what's needed is already in the selected driver's `StandingRow`: driver, position, gap, compound and tyre age. What's still missing is lap and sector times and the stop count, and those are pure functions you can test first.

### 2.1 Pass the selected driver in

- [x] **a.** In `Session.tsx`, just below `standings`, add one line: `const selectedRow = standings.find(...)`, matching each row's `driverNumber` against `selectedDriver`. **No new state:** keep storing only the number and work out the row on each render. If you stored the row object, it would be a snapshot from the moment of the click and would never update during playback. The result is `StandingRow | undefined` (undefined when nothing is selected). Questions: why `standings` rather than `timeline`? (Which one already reflects `raceTimeMs`?) Is `useMemo` worth it for a `.find()` over 20 rows?
- [x] **b.** Give `TelemetryPanel` a `row: StandingRow | undefined` prop and pass it in. Import the type with `import type`
- [x] **c.** Empty state: when `row` is undefined, show a short message such as "Select a driver from the list or map" instead of the panel body. Keep the `<section>` and the title so the layout doesn't jump. *Done when:* the panel shows the prompt on load, and clicking a driver brings back the (still hardcoded) panel
- [x] **d.** Replace `DRIVER.code` and `DRIVER.teamColour` with values from `row.driver`. Watch out: OpenF1 sends `team_colour` without the `#`, so check how `DriverListItem` handles it. Also think about what to show if `row.driver` is undefined

### 2.2 Position and gap (one formatter, used in two places)

- [ ] **a.** Read `formatGapOrInterval` in `DriverListItem.tsx`. It reads `row.outAt` from the surrounding scope, which is why it can't simply be moved somewhere else yet
- [ ] **b.** Move it to `lib/helpers.ts` as an exported function that takes everything it needs as parameters (e.g. `formatGap(value, isOut)`). Update `DriverListItem` to use it. *Done when:* the driver list looks exactly as it did before
- [ ] **c.** Add a few tests for it in a new `lib/helpers.test.ts`: a number, a string such as `"+1 LAP"`, `null`, `0`, and a driver who is out
- [ ] **d.** Use it in the panel for `P{position} · {gap}`. Decide what the leader should show: right now `0` gives `-`. Would "Leader" read better here? If so, should the list change too?

### 2.3 Tyre

- [ ] **a.** Replace the compound pill with `row.compound`, using `TYRE_COMPOUND_COLOURS` from `constants/compounds.ts` (the same lookup as `DriverListItem`)
- [ ] **b.** `row.compound` is `'MEDIUM'`, but the panel shows `Medium`. Write the conversion. Then handle `undefined` compound and `undefined` tyre age without showing "undefined laps old"
- [ ] **c.** "1 laps old" vs "1 lap old": handle the singular. Leave the stop count hardcoded for now

### 2.4 Stop count (test first)

A stop is when a new stint starts, so the number of stops at a given lap is the number of stints started by that lap, minus one.

- [ ] **a.** Add `stops: number` to `StandingRow` and work out the value in `standingAt`, next to the existing stint lookup. Decide what it should be before lap 1 (when `lap` is undefined)
- [ ] **b.** Before you implement it, write a test in `timeline.test.ts` that calls `standingAt` with a small fake timeline: one driver, two stints (laps 1–20 and 21–50), checked at lap 10 and at lap 30. You'll need to build a minimal `SessionTimeline` and `driversMap`. Run it and watch it fail
- [ ] **c.** Implement it until the test passes. Add a second case: a stint whose `lap_end` is `null` (the stint the driver is currently on in a live session)
- [ ] **d.** Show it in the panel: "No stops", "1 stop", "2 stops"

### 2.5 Lap and sector times (test first)

This is the main task of part A. The rule to stick to is **no spoilers**: at replay time `t`, only show laps the driver has already *finished*.

- [ ] **a.** Decide when a lap counts as finished at time `t`. A lap has `t` (its start) and `lap_duration` in seconds. Write the condition down. What about a lap whose `lap_duration` is `null`?
- [ ] **b.** Write tests first for a new function in `lib/timeline.ts`, such as `lapTimesAt(laps: Timed<Lap>[], t: number): { last: Lap | undefined; best: Lap | undefined }`. Cases to cover:
  - before the first lap is finished, both are `undefined`
  - partway through lap 3, `last` is lap 2, not lap 3
  - `best` only looks at finished laps (a faster lap later in the race mustn't show up early)
  - a finished lap with `lap_duration: null` is skipped for `best`
  You'll need `Timed` exported from `useSessionTimeline.ts`, or you can type the parameter as `DriverStreams['laps']`
- [ ] **c.** Implement it. *Done when:* the tests pass. Tip: `laps` is sorted by `t`, but a simple loop is fine here (a driver has about 60 laps), so don't reach for binary search unless you want the practice
- [ ] **d.** Add a `formatLapTime(seconds: number | null | undefined)` helper with tests: `87.357` → `1:27.357`, `28.39` → `28.390`, `null` → `–`. Hint: `padStart` for the seconds when there's a minute part
- [ ] **e.** Call `lapTimesAt` in `Session.tsx` for the selected driver (you'll need `timeline.byDriver.get(selectedDriver)`) and pass the result to the panel as a prop. Then think about whether it belongs in `StandingRow` instead. It would get worked out for all 20 drivers every frame. Does that matter?
- [ ] **f.** Fill in the "Last" row: S1, S2, S3 and time
- [ ] **g.** Fill in the "Best" row's time. Then decide: show the best lap's sectors, or keep the dashes? (Note: the best lap's sectors aren't the same as the best sectors, so pick one and be clear which one it is.)
- [ ] **h.** *(Stretch)* `is-personal-best` on a sector of the last lap when it's the driver's fastest of that sector so far. This is a small extension of `lapTimesAt`, so add a test for it first

### 2.6 Placeholders and tidy-up

- [x] **a.** Speed, gear, DRS, throttle and brake are still `DRIVER.*`. Replace them with placeholders. Keep the markup, because part B fills it in. *Decision:* speed and gear show dashes; the full pedal bars and always-open DRS are accepted until part B
- [ ] **b.** Delete the `DRIVER` constant. *Done when:* typecheck passes with it gone
- [ ] **c.** Update the TODO comment above `<TelemetryPanel />` in `Session.tsx` so it only mentions part B (`car_data`)
- [ ] **d.** Run the app. Select a driver and scrub through the race: lap times should change as laps finish, and the stop count and tyre should change at a pit stop. Try a driver who retires, and scrubbing back to before lap 1
- [ ] **e.** Typecheck, lint, tests, commit (one commit per numbered task is fine if you'd rather)
