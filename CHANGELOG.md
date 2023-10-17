# nostrudel

## 0.31.0

### Minor Changes

- 9569281: Add option to customize quick reactions

### Patch Changes

- 4c0d10f: Fix people list selection
- 08eb8b2: Fix zap button on prism posts

## 0.30.0

### Minor Changes

- f701942: Add redeem button for cashu tokens
- 7a3674f: Add option to set zap splits when creating note
- 85a9dad: Add stemstr embeds
- bcc8427: Add theme option and better dark theme
- 5a455c7: Show repost counts on notes
- c0e3269: Add support for paying zap splits
- cdfdc71: Show recent badge awards on badges page
- d2f3076: Make notes clickable
- 4efbc48: Add sign up view
- 21a1a8a: Show profile badges on users profile
- b2be294: Support video and audio file uploads to nostr.build
- 2a17d9e: Show articles in lists
- d9353b0: Update all icons
- 56fc982: Add badge activity tab

### Patch Changes

- c635b2b: Fix bug with stream chat not showing on chromium based browsers
- 37489e5: Reduce churn when loading relays on app load

## 0.29.0

### Minor Changes

- 9fd16ea: Add time durations for muting users
- cff1e8b: Add simple stream moderation tool
- a1a0e33: Add popular relays view
- 02ea06a: Add nostr.build image uploads
- 0f87642: Add simple community views
- d0e58de: Add image upload button to reply form
- 9fd16ea: Add ghost mode

### Patch Changes

- 20fb8fb: Fix freezing when navigating back to main timeline
- 4ce9897: Fix broken links in side drawer
- 4ce9897: Fix bug when clicking on shared long form note

## 0.28.0

### Minor Changes

- 6021318: Add community browse view
- e04aa5c: Hide muted users in stream views
- e04aa5c: Add option to add user to k 10000 mute list
- b961ee1: Add side drawer for viewing threads
- f440e81: Redesign side navigation
- 269acae: Add Max Page width option to display settings
- e04aa5c: Filter out muted users in home feed
- dfce72d: Clean up embedded note component
- e04aa5c: Hide muted users in threads
- 4b5445a: Add tabs to notification view
- cde3174: Add Muted words option in display settings

### Patch Changes

- 03ed574: Small fix for url RegExp
- 054e3f2: Show multiple pubkeys on badge award event
- d5a50d0: Fix follow and mute button not updating when switching accounts

## 0.27.0

### Minor Changes

- 94cd156: Add share button to stream view
- 03fb661: Sort search results by follower count
- cbb3aa5: Show embedded badges in stream cards and timelines
- 3d5d234: Clean up user reactions view
- 6b4fd8a: Show list embeds in notes
- b561568: Rebuild notifications view
- 409f219: Add content warning switch when writing note
- 076b89e: Add articles tab to user view
- 094a6fb: Show stream goal zaps in stream chat

### Patch Changes

- 81e86c9: Fix threads not loading when navigating directly to them

## 0.26.0

### Minor Changes

- 8fd08ed: Add reply button to note feed
- 1b5ee34: Add emoji edit view
- 7a5a4b1: Add emoji pack views
- 2a490dd: Add goal views
- 27abb20: Show host emojis when writing stream chat message
- 3a2745e: Add @ user autocomplete when writing notes
- 2a490dd: Improve event embed card
- c10a17e: Add emoji autocomplete when writing notes
- 6dd6196: Rebuild stream view layout

### Patch Changes

- 8bf5d82: Optimize caching time for user metadata events

## 0.25.0

### Minor Changes

- f83d1ad: Show streamer cards in stream view on desktop
- c79c292: Show emoji reactions on notes
- 0af6c2c: Add bookmark button to notes
- 8ea8c88: Add more details to publish details modal
- d53a34c: Add browse lists view
- 343a23c: Add sats per minute button on stream view on desktop
- 6bb4589: Add option to favorite lists
- 8ea8c88: Filter relay reviews by list
- f6f4656: Allow user to select people list for home feed
- 0af6c2c: Show note lists on lists view
- 63474a7: Add delete button for lists

### Patch Changes

- 954ec50: Fix reactions showing on wrong notes
- fbc1ea4: Fix mentioning npub would freeze app

## 0.24.0

### Minor Changes

- 03d84eb: Show notes in relay view
- 1e75dbd: Improve layout of image galleries
- 07f67cc: Show all images in lightbox
- d2948e7: Rebuild event publish details
- 1148093: Render multiple images as image gallery
- d8b29b4: Add relay review form
- 9b6c653: Add simple timeline health view
- b7deb16: Clean up navigation menu
- 018c917: Add mobile friendly lightbox
- ce550f5: Show label for paid relays
- e052991: Add inline reply form
- 70bada5: Add <url> and <encoded_url> options to CORS proxy url
- 70bada5: Use corsproxy.io as default service for CORS proxy

### Patch Changes

- 1bc4500: Fix non-english characters breaking links

## 0.23.0

### Minor Changes

- e24e55c: Show relay reviews under user relays tab
- fa30250: Add relay view
- e24e55c: Add relay reviews page
- d984577: Show relay recommendations in timeline
- 33da3e2: Rebuild relay view and show relay reviews
- 615e19b: Hide muted users in stream chat

### Patch Changes

- cb780e1: Cleanup responsive breakpoints

## 0.22.0

### Minor Changes

- c7d9a04: Rebuild search view to use NIP-50
- 69bea82: Add support for playing back stream recordings

### Patch Changes

- 69bea82: Correctly handle replaceable events in timeline loader

## 0.21.0

### Minor Changes

- 980c68a: Show lightning address on about page
- 68001bb: Add people list context and selector
- 640edef: Use timeline loader for followers view
- 5c061ca: Add expiration to cached metadata events
- 5c061ca: Rebuild underlying event requester classes

## 0.20.1

### Patch Changes

- 85dd32a: Add logging to app setting services
- 85dd32a: Fix Color Mode setting

## 0.20.0

### Minor Changes

- 52d567c: Cleanup embed content (hopefully performance improvement)
- 7cc9c9a: cache url open graph data
- 52d567c: Remove twitter tweet embeds
- 1afbe85: Add docker image

### Patch Changes

- b8a3fd1: small fix for hashtags
- 7cc9c9a: Performance improvements

## 0.19.1

### Patch Changes

- af5ed2f: Fix broken post button

## 0.19.0

### Minor Changes

- f786056: Replace nostrchat clink with blowater
- 0074c9e: Remove scroll-boxes and return to natural page scrolling

## 0.18.0

### Minor Changes

- d46327e: Support hashtags in new post modal

### Patch Changes

- d46327e: Fix bug with non-english hashtags not showing

## 0.17.2

### Patch Changes

- b32b6be: Image gallery: Only show open button on over

## 0.17.1

### Patch Changes

- 5d4a680: Fix stream view crashing when failing to parse zap request
- dd4cb0b: Fix npub in url getting replaced in post modal

## 0.17.0

### Minor Changes

- d4a8110: Standardize timeline rendering between views
- facb287: Add more prominent new post button
- bdc1c98: Rebuild direct message chat view using timeline loader

### Patch Changes

- d4a8110: Fix performance bug with large timelines
- bdc1c98: Don't show multiple images on open-graph link card

## 0.16.0

### Minor Changes

- e4b40dd: Blur images in stream chat
- 33acce5: UX improvements to zap modal
- 5a537ab: Add toggle chat button to mobile stream view
- 086279e: Add user likes tab under profile view

### Patch Changes

- 33acce5: Fixed bug with stream loading wrong chat
- 871d699: Fix blured images opening when clicked

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
