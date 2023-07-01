# nostrudel

## 0.15.0

### Minor Changes

- 0c92da8: Add views for watching streams
- 7a339ae: cache timelines

### Patch Changes

- 593ad6b: show type of account on account picker
- 038d342: truncate open graph card description

## 0.14.0

### Minor Changes

- c036a9a: Fix all pop-in issues when loading timelines (rebuild timeline loader to use IntersectionObserver to correctly set cursor)
- b23fe91: Rebuild timeline loader class

### Patch Changes

- b23fe91: Remove broken discover tab

## 0.13.1

### Patch Changes

- 4bdae99: Only fetch open graph metadata for html urls

## 0.13.0

### Minor Changes

- 644c53e: Handle hashtags in search view
- 0cc4059: Fetch open graph metadata for links
- 2eeb79c: Display custom emojis
- 214487e: Add relay icons to notes
- f383903: replace momentjs with dayjs
- 5d19861: Add multi relay selection to hashtag view
- 39ef920: Improve editing and saving app settings
- 0cc4059: Add CORS proxy

### Patch Changes

- 9936c25: Add validation check to LNURL address in profile edit view
- 7f162ac: Fix user app settings being cached
- 17d5160: Use nevent when quote reposting note

## 0.12.0

### Minor Changes

- a6a1ca3: Create about tab in profile view
- a6a1ca3: Virtulize following and followers tabs in profile view
- a6a1ca3: Add profile stats from nostr.band
- 9464e3a: Add settings for Invidious, Nitter, Libreddit, Teddit redirects
- 305f5e2: Add link to nostr army knife tool

### Patch Changes

- 65bd2e9: Only show kind 0 events in media tab
- 305f5e2: Correctly handle web+nostr: links in search
- a6a1ca3: Fix redirect not working on login view
- 3939f66: Correctly handle quote notes with nostr: links and e tags

## 0.11.0

### Minor Changes

- ddcafeb: Add nostrapp.link option in profile and note menus
- ddcafeb: add embeds for wavlake tracks

## 0.10.0

### Minor Changes

- 868227a: Add e2e tests
- 2aa6ec5: Dont require login for profile and note views
- d58ef29: Add simple nip19 tool
- 7e92cba: Add media tab in profile view

### Patch Changes

- d4aef8f: cleanup fetching user relays
- 0189507: Dont add p tag when sharing events

## 0.9.0

### Minor Changes

- c21a662: Make all note links nevent
- 40c5e19: Update nostr-tools dependency

### Patch Changes

- 5e7f6b0: Dont proxy main user profile image
- 2d2e233: Dont blur images on shared notes
- f432cf6: Trim note content
- 40c5e19: Fix link regexp

## 0.8.0

### Minor Changes

- 4dfb277: Make photo flush with edge of note
- 285a2dd: Add content warning for NIP-36 notes
- 4dfb277: Replace laggy photo lightbox

### Patch Changes

- 0df1db8: Fix subscription id too long

## 0.7.0

### Minor Changes

- 80eda91: Add support for nprofile and nevent types in paths
- 3ae7fe6: Show "Follow Back" on follow button if user is following you
- 444ba5f: Add external link for mostr notes
- 10dc835: Add option to load image thumbnails with imageproxy service
- ac1c9cb: Add simple hashtag view
- 10dc835: Add image lightbox and zoom

## 0.6.0

### Minor Changes

- b75b1b3: Show image and video embeds in DMs (big refactor to support hashtags)
- 096bc06: Desktop: Remove following list on right side
- 5cfdd90: Add simple event deletion modal
- 096bc06: Mobile: Move user icon to bottom bar

## 0.5.1

### Patch Changes

- 3f4477a: Confirm before reposting

## 0.5.0

### Minor Changes

- 66c6b4d: Add option to change primary color for theme
- a209b9d: Improve database migration
- a209b9d: Store app settings in NIP-78 Arbitrary app data event with local fallback

## 0.4.0

### Minor Changes

- e75ac1b: Add support for kind 6 reposts
- b9b8179: Add copy button to user QrCode modal

## 0.3.0

### Minor Changes

- d4321c0: Remove brb.io link from user profiles
- de46005: Add custom zap amounts to settings
- 52033fc: Support nostr: links in notes
- c6a4f96: Add "Download Backup" link to profile edit view

### Patch Changes

- 06f8e59: Increase min height of note before showing expandable overlay

## 0.2.0

### Minor Changes

- 7aec637: Add github link to settings view
- 1f40f56: Add lighting payment mode setting
