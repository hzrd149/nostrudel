# nostrudel

## 0.46.1

### Patch Changes

- 2e02dce: Fix issue with application hanging from capacitorjs modules
- 8bb958c: Fix elements under nav bar on mobile

## 0.46.0

### Minor Changes

- 61ec618: Add option for custom share service (njump.me)
- e4befec: Add article reader component using native web TTS API
- b114c2a: Show favorite relays in discovery view
- b114c2a: Add relay feed to discovery view
- 5df6134: Redesign user profile navigation

### Patch Changes

- 9219f47: Fix open graph link images not being blured
- 9219f47: Fix ncrypsec accounts not prompting for decryption password

## 0.45.1

### Patch Changes

- 50d7153: Fix recalculating the social graph every 15s

## 0.45.0

### Minor Changes

- da4935f: Add setting for NIP-17 DM relays
- c18959f: Add messages cache for direct messages
- e555ff2: Support NIP-17 group messages
- 98ee868: Show NIP-17 messages in direct message view
- 4f9c5b9: Add profile editor to settings
- 2ea2ebc: Add NIP-17 message inbox for decrypting messages
- 4f592dc: Add DM conversation info drawer
- 403315c: Redesign direct messages
- 4f9c5b9: Add preview to porfile editor

### Patch Changes

- 5d533bc: Remove unused dependencies

## 0.44.1

### Patch Changes

- 9a714ab: Correct `applesauce` and `blossom-client-sdk` package versions

## 0.44.0

### Minor Changes

- 605905f: Detect `naddr1` and `nevent` links in normal web links
- ebf622e: Improve blossom URL verify modal
- 5027e92: Add setting to hide events based on social graph
- 5027e92: Add option to hide media and embeds based on social graph
- 0432b4e: Add background worker settings page
- 5027e92: Remove keyboard shortcuts

### Patch Changes

- 124345b: Fix new note view spamming `getPublicKey`

## 0.43.0

### Minor Changes

- 697d4c6: Add "Migrate to signing device" option in account manager
- 8e25ba5: Add list edit modal
- 0b6e8e9: Remove "open in drawer" for notes
- 1d04e20: Remove legacy relay connection pool
- 1167dba: Use TimelineLoader from applesauce packages
- 1045c26: Add option to favorite apps
- 3d7a5bd: Update task manager to reflect relay connections and auth
- ab394aa: Add option to mirror blobs when sharing notes
- 39bfbe8: Add simple relay chat views
- ad4b744: Add comments under badges
- 747b7e2: Add default auth options to task manager and app relays views
- e92d4b3: Add max height to timeline notes
- b25979b: Use the mute words, threads, and hashtags in the NIP-51 mute list
- ee7a5b3: Add simple file views and comments
- 92b9e9a: Replace amber login with NIP-46 connect
- 931ea61: Add tenor gif picker
- b185b0a: Remove NIP-72 communities
- 26b376e: Add nsfw option to reply form
- bd6e21e: Linkify BIPs
- 508b37d: Add 404 page
- b5a7f76: Remove legacy satellite cdn view
- 44def1d: Fix bug with uploading blank images
- fc2063b: Add NIP-22 comments on articles
- 931ea61: Add new emoji picker
- 92b9e9a: Remove mute graph tool
- 92b9e9a: Remove DM graph tool
- 931ea61: Remove quick reactions from settings

### Patch Changes

- 598b424: Fix articles view freezing on load

## 0.42.0

### Minor Changes

- 4d0d770: Move core logic out into applesauce packages
- 2f1d50a: Add support for olas media posts and NIP-22 comments
- b7bf4a3: Add tools menu under thread post
- 820d8ab: Add favorite DVM feeds
- 6e6baa7: Add templates to event publisher
- 5777ea6: Add validation messages to profile edit view
- 0e20544: Add unknown notifications toggle
- 4659ad7: Add option to hide noStrudel logo in nav bar
- 979a860: Support nostr links in markdown
- 60b61e9: Update timelines to use applesauce
- e0e2ed9: Unclutter notifications view
- 962ba25: Use applesauce for NIP-28 channels
- f15328f: Add open and share button to stream view
- bbd19d7: Add "Proactively authenticate to relays" option to privacy settings, defaults to off
- dd37773: Add option for debug API
- 6157bec: Remove support for legacy password account
- 5403d37: Add insert gif button
- 694e261: Add top zappers support page
- 81e4c5f: Support searching local relay
- f2f8186: Add support for cashu v4 tokens
- 0e20544: Add "q" tags for quoted notes
- 0438f3e: Remove legacy npub1 bunker URI format
- 6e6baa7: Add edit button to event debug modal
- 5ea8604: Cleanup zap parsing
- 5ea8604: Remove old community trending view

### Patch Changes

- cab89b6: Fix delete events not getting published to outbox
- dec7230: Fix page changing from RTL when viewing some profiles
- 962ba25: Refresh relay info on relay page
- cab89b6: Improve list background loading
- fc8c758: Fix bug with removing "about" in profile editor
- bbd19d7: Fix automatically disconnecting from authenticated relays

## 0.41.0

### Minor Changes

- 50b636c: Add option to wipe wasm relay database
- 8614cb6: Update `@snort/worker-relay` WASM relay
- a016adf: Add Support for embedding HLS videos
- 6ff03b5: Support pinning articles
- c5e7035: Add relay discovery map
- 5f789d2: Add option to disable keyboard shortcuts

### Patch Changes

- 331ec5d: Fixed search results not being cached
- 1353ccd: Fix amber signer missing pubkey
- d4286ee: Fix some tidal embeds not playing
- 37bf63e: Hide avatars of muted users
- 359dbcb: Fix bookmark view not showing latest bookmarks
- 7e8855d: Fixed client sending filters with empty #a tags
- fff8a1d: Fix client tag breaking POW on notes
- b3a52cb: Add noStrudel NIP-05 to domain
- cfa77a5: Update bitcoin connect
- c5e7035: Fix relay notes showing notes from other relays from cache
- a702121: Improve notifications timeline rendering performance
- fc6d36b: Add bookmark button to articles
- 3768645: Fixed keyboard shortcuts activating when replying to notification

## 0.40.1

### Patch Changes

- 2d74bc7: Add "mark read" button to notifications view
- 43d02ee: Fix nostr-relay-tray connection issues

## 0.40.0

### Minor Changes

- a38efa5: Add support for NIP-49 (ncryptsec)
- 085e12a: Display NIP-89 client tags on events
- 03bec50: Add wiki pages
- f53f5ca: Add support for wiki links in text notes
- f53f5ca: Add simple article view
- d03b329: Show read status on notifications
- 5add281: Add blindspots discovery feed
- f9ba9cb: Remove "Setup Relays" overlay when starting app
- 4c3d041: Show individual zaps on notes
- 1eb6c49: Show notifications on launchpad
- c648923: Add Streams and Tools to launchpad
- 4c3d041: Add details tabs under thread post
- f9443af: Make user avatars square
- d20f698: Add Multi-threaded PoW Hashing thanks to [Thoreau](https://github.com/thoreaufyi)
- 6862854: Add option to hide emojis in usernames
- 8bb7fc1: Rebuilt settings view tabs
- 9deb032: Add option to hide zap bubbles on notes
- 8d46272: Add blossom media upload option
- 92b950a: Add support for native android and ios sharing
- c137b3d: Add support for NIP-51 search relay list
- 423632f: Add option to prune older events in wasm relay
- 781948a: Use Relay class from nostr-tools
- b4c4c7a: Show relay authentication requests
- 91c9ad1: Fallback to users blossom servers on broken image links with sha256
- 7a486bb: Add menu to zap events
- 958a850: Add option to use nostr-wasm to verify events
- 24c664e: Add NIP-46 connection initiated by client
- fa6bc0e: Make "Show embeds" option work again
- 8a24016: Add No cache relay option
- 8a24016: Add In-Memory cache relay option
- 8defd66: Add support for @snort/worker-relay as a cache relay
- 289fff2: Remove CORS_PROXY env option in docker image
- 8faf3e4: Add task manager modal for debugging
- 7506141: Show timelines, subscriptions, and services in task manager
- 289fff2: Add REQUEST_PROXY, TOR_PROXY, and I2P_PROXY env options in docker image

### Patch Changes

- 3da4c3f: Support embedding media from IPFS
- 81aefc5: Fix null relay hints in DMs
- 5c49114: Fix users own events being hidden by muted words
- 51c8aff: Fix random events showing up as DM messages
- f36a82a: Fix app prompting NIP-07 extension to unlock when app opens
- fbcfa42: Remove corsproxy.io as default service for CORS proxy

## 0.39.0

### Minor Changes

- 15cb30d: Add "open in" modal (NIP-89)
- 16ae69c: Add event publisher tool
- b88ecd2: Added Event Console tool
- e053e5d: Add option to automatically decrypt DMs

### Patch Changes

- df094b2: Rebuild observable class
- 3359064: Add UI tab to relays
- a967cc8: Fix custom emoji reactions having multiple colons
- cfa0461: Fix jsonl database export format
- 45e447c: Fix auto-playing blurred videos
- 3a8bea9: Fix bunker://pubkey connect URIs
- 0c36f57: Fix profile form removing unknown metadata fields
- 45e447c: Unblur all images when clicking on a note
- bcb3ff8: Update emojilib

## 0.38.4

### Patch Changes

- 64c2bb3: Fix translation selector stuck on english

## 0.38.3

### Patch Changes

- Add option to use NIP-65 relays on relay prompt

## 0.38.2

### Patch Changes

- ad6e51e: Add explanations to relay views

## 0.38.1

### Patch Changes

- Always use the bitcoin connect webln

## 0.38.0

### Minor Changes

- e8e3dc0: Support for nsecBunker OAuth flow
- 31a649e: Add offline mode
- 3bae870: Restore scroll position when returning to the timeline
- fd6ce3e: Show unavailable events in threads
- bbf5b0e: Add POW option when writing note
- 91f4c7c: Overhaul core relay code
- aaa6208: Support kind 16 generic reposts
- f965281: Support using nostr-relay-tray as cache relay
- 5831791: Rebuild tools menu
- 7640beb: Improve display of unknown events
- d1af1e1: Add track view for stemstr tracks
- 92fe0bb: Support for local image proxy and cors servers
- 1731b66: Show Videos and articles on bookmark list
- 9fa2ae4: Add threads notifications view
- 33ff50f: Support for bunker://npub@relay NIP-46 login
- 05b4ca2: Add search when selecting list in feed
- be49839: Improve channel message layout
- a39e6ad: Add NIP-66 relay stats service
- 1191d99: Add NIP definitions when hovering over "NIP-xx"
- c744751: Add messages to launchpad
- 075fb4e: Add simple bookmarks view
- 1888caa: Build simple flare video page
- d9225ed: Add support for .mp3 and .wav urls
- ad53ed1: Add Simple Satellite CDN view
- c3bcfe4: Remove ackee
- 1f77a48: Add CACHE_RELAY option to docker container

### Patch Changes

- 065a90f: Show quotes as mentions in notifications
- 4fb0faa: count nevent and naddr as pubkey mentions
- 5831791: Show NIP-05 verified icons in @ mentions
- 0972691: Fix issue with search relays getting reset
- c744751: Fix bug with stuck timelines
- 3204258: Upgrade nostr-tools to v2

## 0.37.1

### Patch Changes

- feec6880: Fix storage and clipboard use on http connection

## 0.37.0

### Minor Changes

- 53b2c9e3: Add reactions and zaps to DMs
- 98b4bef4: Add support for threads in DMs
- 43faa025: Add support for Amber signer
- 53b2c9e3: Make DMs view more readable
- 53b2c9e3: Add support for NIP-46 signer
- ca4d6df8: Support NIP-31 on unknown event kinds

## 0.36.0

### Minor Changes

- bc71d920: Add option to hide usernames
- abce505a: Add Torrent create view
- 2786f848: Add support for default bookmark list
- c119e02a: Add decrypt all button to DMs
- abce505a: Change "Copy Share Link" to use njump.me
- abce505a: Replace "Copy Note Id" with "Copy Embed Code"
- 6ab2d1c2: Add colors to notifications view
- a2a920c4: Add simple torrents view
- 7ff3c81d: Add Channels view
- a714a2c6: Use nevent instead of note1 in urls
- 199f208b: Add local relay cache option
- d8e08d6a: Add support for Nostr Signing Device
- 6d44e534: Rebuild notifications view
- c8ee526a: Rebuild tools view
- b372edab: Show reposts in note details modal
- c119e02a: Cache decrypted events
- a796661e: Add comments to torrents
- a714a2c6: Blur videos from strangers
- d18e03af: Rebuild thread loading
- b69bfa37: Show list links on muted by view

## 0.35.0

### Minor Changes

- 7cbffb96: Add option to pin notes
- 7cbffb96: Show pinned notes on user profile

## 0.34.0

### Minor Changes

- 32c3e74a: Add note translations modal using DVMs
- e144f13e: Improve how reposts and replies are displayed in timelines
- 90700ebb: Use kind 10004 for communities list instead of kind 30001
- d19b0001: Show SoundCloud embeds

## 0.33.0

### Minor Changes

- 5e9afb0d: Add "DM Feed" tool
- cc4247dc: Thread view improvements
- 6d701a7b: Add option to search communities in search view
- 5e9afb0d: Add "create $prism" link to lists
- 35bb0e37: Add people lists to search and hashtag views

### Patch Changes

- d1181ef9: Fix link cards breaking lines

## 0.32.1

### Patch Changes

- 5c036ff: Fix error when clearing database cache
- 5c036ff: Fix scrolling in direct messages view
- 02b8374: Fix community join button "no account" error

## 0.32.0

### Minor Changes

- 0414039: Show users joined communities on about page
- 5d66750: Add vote buttons to community view
- 5f9c96e: Add approval button for pending community posts
- 0d00f71: Add network dm graph tool
- d7e289a: Show community members
- 5d66750: Improve community view on mobile
- 8871aed: Add support for kind 6 events in communities
- 1f73120: Add option to search notes in search view
- 28de4d4: Add community create and edit modals

### Patch Changes

- 5ac4cfc: Fix hashtags and links with (non-english) mark characters in them
- 7b03925: Improve drawer navigation
- a11d448: Center layout
- 1c8f005: Fix reaction counts when user react multiple times
- 35236c6: Add "show more" button when viewing all reactions

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
