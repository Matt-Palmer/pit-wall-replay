# Pit Wall Replay: Roadmap

Status as of 2026-10-10. Tick boxes as tasks are completed.

**Current step:** 0.2f, commit the timeline fix.

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

**Client: race list page** (`/`)
- Season picker, race cards, fetching a race's drivers early on hover

### Built but not wired up (hardcoded data)

| Component | State | What it needs |
|---|---|---|
| `TelemetryPanel` | Hardcoded NOR data | A selected driver, plus OpenF1 `car_data` (speed, gear, DRS, throttle, brake) and sector times from laps |
| `RaceControl` | 4 hardcoded messages | A new `/race_control` route and schema, filtered to the current replay time |
| `ContinueWatching` | Hardcoded "British GP, lap 34" | Save the last session and its playback position to localStorage |
| `RaceFilters` | Buttons and search box do nothing | Filter state in `App.tsx`. Sprint filtering needs sprint session data |
| `RaceCard` | Sprint tag is a TODO; status always says "Ready" | Sprint lookup and real status (upcoming, cancelled) |
| Driver route | Renders `<div>About Page</div>` | An actual driver detail page |
| `LapsPanel` / `LapTable` / `LapRow` / `LapHeader` | Not used anywhere | Reuse them on the driver page or delete them |
| `pitStopSchema` | Exported, but no server route | A `/pit` route; would feed race control and telemetry ("1 stop") |

### Bugs and loose ends

1. ~~**Client typecheck fails**: unused `isMeetingLoading` in `Session.tsx`~~ (fixed in e6dc0f9)
2. **Unnecessary recalculation in `useSessionTimeline.ts`**: if the result query fails, `result = []` is a new array every render, so the timeline is rebuilt every frame during playback
3. **Broken driver links**: `DriverListItem` links to `/drivers/N`, which doesn't match `/race/:sessionKey/driver/:driverNumber`. It's also a plain `<a>`, so clicking it reloads the page and loses playback position
4. **Conflicting tyre colours**: `DriverListItem` has its own colour switch, which doesn't match the unused `constants/compounds.ts`
5. **Mixed import styles**: some files use `@pitwall/shared`, others use relative `../../../shared/src/...`
6. **Bare error and 404 states**: plain `<div>Error: …</div>` and a plain-text not-found page
7. **Deferred**: hide each car's map marker once that driver crosses the finish line
8. **README** is still the default Vite template

---

## Phases

### Phase 0: Fix what's broken
Small, mechanical work so the build is green and the code is consistent. Detailed breakdown below.

### Phase 1: Driver selection
Needed by the telemetry panel, the driver page and the map.
- Add a selected-driver state to `Session.tsx`: click a driver in the list or on the map to select them; hovering stays a temporary highlight
- Fix the driver link (bug 3) at the same time

### Phase 2: Fill in the session page panels
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
- [ ] **f.** Commit

### 0.3 One source of tyre colours

- [ ] **a.** Compare the `switch` in `DriverListItem.tsx` with `TYRE_COMPOUND_COLOURS` in `constants/compounds.ts`. Note that `TYRE_COMPOUND_COLOURS` isn't imported anywhere
- [ ] **b.** Pick which colours are correct. Hint: `TelemetryPanel` uses `#F5D33F` for medium
- [ ] **c.** Update `TYRE_COMPOUND_COLOURS` with the chosen values
- [ ] **d.** Check the type of `row.compound` in `StandingRow` (`lib/timeline.ts`). Is `.toLowerCase()` needed at all? Are the keys `'SOFT'` or `'soft'`?
- [ ] **e.** Replace the `switch` with a lookup into the constant, keeping a fallback for `undefined`
- [ ] **f.** Run the app and check the tyre pills look the same as before
- [ ] **g.** Commit

`TelemetryPanel` also hardcodes a tyre colour, but its data is all placeholder and gets replaced in Phase 2, so leave it alone for now.

### 0.4 Use `@pitwall/shared` everywhere

There are 25 relative `../../../shared/src/...` imports across 11 files. Do one file (or small group) per step, and keep `import type` for type-only imports.

- [ ] **a.** Check `packages/shared/src/index.ts` and confirm everything those files import is exported from it
- [ ] **b.** `lib/queries.ts` (most imports, so start here)
- [ ] **c.** `lib/timeline.ts`
- [ ] **d.** `hooks/useSessionTimeline.ts`
- [ ] **e.** `components/TrackMap/TrackMap.tsx`
- [ ] **f.** `components/Charts/PositionPerLapD3.tsx` and `lineStyles.ts`
- [ ] **g.** `lib/tableConfig.tsx` and the four `Lap*` components
- [ ] **h.** `grep -rn "shared/src" packages/client/src` returns nothing
- [ ] **i.** Typecheck, tests, commit
