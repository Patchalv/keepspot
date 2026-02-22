# MapVault — Product Requirements Document

## 1. Problem Statement

People who live in big cities are constantly collecting place recommendations — from friends, colleagues, social media, and their own discoveries. They save these to tools like Google Maps, but when the moment comes to actually _use_ those recommendations ("we're in Tribunal, where should we eat?"), they can't effectively retrieve them.

Google Maps treats every saved place identically. There are no categories, no filters, no personal context. A saved Michelin-star restaurant looks the same as a saved gift shop. Users end up with a sea of identical pins on a map with no way to distinguish between them.

The result: people who have done the work of building a curated, trusted list of recommendations end up ignoring it entirely. They fall back to generic Google searches — behaving like tourists in their own city — because their personal collection is inaccessible when they need it most.

**Who has this problem:** Socially active people living in big cities who regularly receive and collect place recommendations.

**How painful is it:** Moderately painful, frequently experienced. It's a recurring friction point every time someone wants to go out and can't quickly find the right place from their own collection.

---

## 2. Target User

**Primary persona:** A socially active person living in a large city (e.g., Madrid, London, New York).

**Context:** They regularly receive recommendations for restaurants, bars, cafes, brunch spots, shops, museums, and other places from friends, partners, colleagues, and social media. They go out frequently — for meals, drinks, weekend plans — often with a partner or group of friends.

**Goals:**

- Quickly save a recommended place with useful context (type, tags, notes)
- Find the right place from their collection in the moment they need it
- Share and collaborate on place collections with their partner or friend groups

**Frustrations:**

- Google Maps saves are an undifferentiated mess — no filtering, no categories, no "have I been here?" tracking
- The more places they save, the less useful the list becomes
- They end up Googling instead of using their own curated recommendations
- Going out is often a shared decision, but saved lists are personal and siloed

---

## 3. Core Value Proposition

**MapVault helps city dwellers save and rediscover place recommendations so they never waste a trusted suggestion again.**

---

## 4. User Stories (prioritized)

### Must Have (v1)

- **As a user, I want to add a place by searching for it (like Google Maps)** so that saving a recommendation is quick and I don't have to manually enter addresses.
  - Acceptance criteria:
    - [ ] User can search for a place by name
    - [ ] Search results pull from Google Maps data (name, address, location)
    - [ ] User can select a result and save it to their currently active map
    - [ ] User can add tags (e.g., "restaurant", "bar", "brunch") when saving
    - [ ] User can add a personal note when saving
    - [ ] User can mark whether they've already visited the place

- **As a user, I want to see my saved places on a map** so that I can visually browse what's around me.
  - Acceptance criteria:
    - [ ] Saved places display as pins on an interactive map
    - [ ] Map shows user's current location
    - [ ] User can pan and zoom the map freely
    - [ ] Pins are visually distinguishable (e.g., by type/tag)

- **As a user, I want to filter and search my saved places** so that I can quickly narrow down options when deciding where to go.
  - Acceptance criteria:
    - [ ] User can filter by tag/type (restaurant, bar, cafe, etc.)
    - [ ] User can filter by visited/not visited status
    - [ ] User can search saved places by name
    - [ ] Filters update the map view in real time
    - [ ] Multiple filters can be applied at once

- **As a user, I want to tap a saved place and see its details** so that I can decide if it's the right choice.
  - Acceptance criteria:
    - [ ] Tapping a pin shows place details: name, address, tags, notes, visited status
    - [ ] Details include information pulled from Google (e.g., address, category)
    - [ ] Details include user-added context (tags, notes, visited status)

- **As a user, I want to get directions to a saved place** so that I can get there easily.
  - Acceptance criteria:
    - [ ] Place detail view includes a "Directions" button
    - [ ] Tapping "Directions" opens the place in the user's default maps app (Google Maps, Apple Maps, Citymapper, etc.)

- **As a user, I want to mark a place as visited** so that I can track where I've been.
  - Acceptance criteria:
    - [ ] User can toggle visited/not visited on any saved place
    - [ ] Visited status is personal — on shared maps, each user has their own visited status
    - [ ] Visited status can be used as a filter

- **As a user, I want to create maps and share them with others** so that my partner or friends and I can build and browse a shared collection.
  - Acceptance criteria:
    - [ ] User starts with a default "My Map" on sign-up
    - [ ] User can create additional maps with custom names
    - [ ] User can invite others to a map
    - [ ] All members of a shared map can add, edit, and remove places
    - [ ] User always has one map selected as the active context
    - [ ] New places are saved to the currently active map

- **As a user, I want to view all my places across all maps at once** so that I don't miss a relevant place saved in a different map.
  - Acceptance criteria:
    - [ ] User can switch to an "All Maps" view
    - [ ] "All Maps" shows every place the user has access to (personal and shared)
    - [ ] Filters and search still work in "All Maps" view

### Should Have (v1.1)

- As a user, I want to control permissions on shared maps (e.g., view-only vs. edit) so that I can share a map without everyone being able to modify it.
- As a user, I want to import my saved places from Google Maps so that I don't have to re-enter everything manually.
- As a user, I want to edit tags and notes on a place after saving it so that I can keep my collection up to date.
- As a user, I want to access my saved places offline so that I can browse my list even without internet.
- As a user, I want to use the app on the web so that I can save and browse places from my computer.

### Nice to Have (future)

- As a user, I want to see places grouped or color-coded by tag on the map so that I can visually scan for a specific type.
- As a user, I want to be notified when someone adds a place to a shared map so that I stay in the loop.
- As a traveler, I want to create a map for a trip I'm planning so that I can save recommendations for a city I'm visiting.

---

## 5. Key User Flows

### First-Time Experience

1. User downloads the app and creates an account.
2. A default map called "My Map" is automatically created.
3. User sees a brief onboarding tour (2 steps):
   - How to add a place
   - How to search and filter saved places
4. User lands on the main map view — empty, showing their current location, ready to add their first place.

### Core Daily Loop

**Saving a recommendation (the "input" moment):**

1. A friend recommends a restaurant.
2. User opens the app (active map is already selected).
3. User taps "Add place".
4. User searches for the place by name.
5. User selects the correct result from Google Maps data.
6. User adds tags (e.g., "restaurant") and optionally a note (e.g., "Sarah recommended, great pasta").
7. Place is saved to the active map.

**Finding somewhere to go (the "retrieval" moment):**

1. User is in a neighborhood and wants to find a restaurant.
2. User opens the app — map view loads showing saved places around their current location.
3. User applies filters: tag = "restaurant", visited = "no".
4. Map updates to show only unvisited restaurants.
5. User sees a few options nearby, taps one.
6. Detail view shows the place name, address, their note ("Sarah recommended, great pasta"), and that they haven't visited yet.
7. User taps "Directions" — their phone's default maps app opens with navigation to the restaurant.

### Key Edge Cases

- **No results after filtering:** The map shows empty. No special messaging or fallback — the user adjusts their filters or moves the map.
- **Tags on shared maps:** Tags are shared and editable by all map members. Any member can change a tag. (Permissions to restrict this are a v1.1 feature.)
- **Visited status on shared maps:** "Visited" is always personal per user. If one person marks a place as visited, it doesn't affect what others see.
- **Duplicate places across maps:** The same place can exist on multiple maps independently. Each instance has its own tags, notes, and per-user visited status.

---

## 6. Success Metrics

**Core metrics:**

1. **Save frequency:** Are users regularly adding new places? This indicates the saving experience is frictionless enough to maintain the habit.
2. **Retrieval frequency:** Are users coming back to search/filter when deciding where to go? This indicates the app is replacing the "just Google it" fallback.

**What success looks like:**

- Users with growing collections over time (not just a burst at sign-up)
- Users opening the app in "decision mode" — filtering and browsing before going out
- Shared maps with multiple active contributors

**What failure looks like:**

- Users save places but never come back to search/filter (retrieval isn't good enough)
- Users stop adding new places (saving is too much friction)
- Users save places here but still default to Google when deciding where to go

---

## 7. What This App Is NOT

- **Not a review platform.** Users don't rate or review places. The value is in personal curation, not crowd-sourced opinions.
- **Not a social network.** There are no public profiles, no following, no feeds. Sharing is limited to explicit map collaboration with people you know.
- **Not a booking tool.** The app helps you decide where to go — actually booking a table or buying tickets is outside scope.
- **Not a discovery engine.** The app doesn't suggest new places or surface trending spots. Every place in your collection was deliberately saved by you or someone you shared a map with.

---

## 8. Resolved Decisions

1. **Platform:** Mobile-first for v1 (iOS or Android — TBD). Web app planned for v1.1 to support the "planning from the desk" use case. Retrieval and saving both happen on mobile and desktop, but mobile is the priority.
2. **Google Maps import:** Not required for v1. Users can start adding places immediately and get value without their full history. Import moves to v1.1 — worth investigating technical feasibility early as it could significantly reduce the cold-start problem for power users.
3. **Tag system:** Tags are per-map, not global. Each new map comes with sensible defaults ("Restaurant", "Bar", "Friend") and users can create additional custom tags for that map. All members of a shared map see and use the same tag set.
4. **Onboarding:** On first launch, users get a default "My Map", a brief 2-step tour (how to add, how to search/filter), and a simple "Save your first place" prompt on the empty map. Lightweight — no heavy onboarding flow.
5. **Monetization:** Freemium model.
   - **Free tier:** One personal map, up to 50 saved places. Can see premium features but they are behind a paywall.
   - **Premium tier:** Multiple maps, shared maps, higher (or no) place limits.
   - Early testers may receive premium access for free permanently.
6. **Offline access:** Users should be able to browse their saved places without internet. This is a v1.1 feature — the app is usable without it in most situations.
7. **Place data freshness:** Not a v1 concern. Users will naturally discover if a place closes and can remove it themselves. A future enhancement could flag places Google Maps shows as "permanently closed."

## 9. Open Questions

1. **Mobile platform for v1** — iOS only, Android only, or cross-platform from the start?
2. **Google Maps import feasibility** — technical investigation needed to understand what data is exportable and how cleanly it can be imported.
3. **Default tag set** — the current defaults are "Restaurant", "Bar", and "Friend". Are there others that should be included out of the box?
