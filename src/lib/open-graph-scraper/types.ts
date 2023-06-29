export type TwitterImageObject = {
  alt?: string;
  height?: number;
  url: string;
  width?: number;
};

export type TwitterPlayerObject = {
  height?: number;
  stream?: string;
  url: string;
  width?: number;
};

export type ImageObject = {
  height?: number;
  type: string;
  url: string;
  width?: number;
};

export type VideoObject = {
  height?: number;
  type?: string;
  url: string;
  width?: number;
};

export type MusicSongObject = {
  disc?: string;
  track?: number;
  url: string;
};

export type OgObjectInteral = {
  alAndroidAppName?: string;
  alAndroidClass?: string;
  alAndroidPackage?: string;
  alAndroidUrl?: string;
  alIosAppName?: string;
  alIosAppStoreId?: string;
  alIosUrl?: string;
  alIpadAppName?: string;
  alIpadAppStoreId?: string;
  alIpadUrl?: string;
  alIphoneAppName?: string;
  alIphoneAppStoreId?: string;
  alIphoneUrl?: string;
  alWebShouldFallback?: string;
  alWebUrl?: string;
  alWindowsAppId?: string;
  alWindowsAppName?: string;
  alWindowsPhoneAppId?: string;
  alWindowsPhoneAppName?: string;
  alWindowsPhoneUrl?: string;
  alWindowsUniversalAppId?: string;
  alWindowsUniversalAppName?: string;
  alWindowsUniversalUrl?: string;
  alWindowsUrl?: string;
  articleAuthor?: string;
  articleExpirationTime?: string;
  articleModifiedTime?: string;
  articlePublishedTime?: string;
  articlePublisher?: string;
  articleSection?: string;
  articleTag?: string;
  author?: string;
  bookAuthor?: string;
  bookCanonicalName?: string;
  bookIsbn?: string;
  bookReleaseDate?: string;
  booksBook?: string;
  booksRatingScale?: string;
  booksRatingValue?: string;
  bookTag?: string;
  businessContactDataCountryName?: string;
  businessContactDataLocality?: string;
  businessContactDataPostalCode?: string;
  businessContactDataRegion?: string;
  businessContactDataStreetAddress?: string;
  charset?: string;
  dcContributor?: string;
  dcCoverage?: string;
  dcCreator?: string;
  dcDate?: string;
  dcDateCreated?: string;
  dcDateIssued?: string;
  dcDescription?: string;
  dcFormatMedia?: string;
  dcFormatSize?: string;
  dcIdentifier?: string;
  dcLanguage?: string;
  dcPublisher?: string;
  dcRelation?: string;
  dcRights?: string;
  dcSource?: string;
  dcSubject?: string;
  dcTitle?: string;
  dcType?: string;
  error?: string;
  errorDetails?: Error;
  favicon?: string;
  modifiedTime?: string;
  musicAlbum?: string;
  musicAlbumDisc?: string;
  musicAlbumTrack?: string;
  musicAlbumUrl?: string;
  musicCreator?: string;
  musicDuration?: string;
  musicMusician?: string;
  musicReleaseDate?: string;
  musicSong?: MusicSongObject[];
  musicSongDisc?: string | null[];
  musicSongProperty?: string | null[];
  musicSongTrack?: number | null[];
  musicSongUrl?: string | null[];
  ogArticleAuthor?: string;
  ogArticleExpirationTime?: string;
  ogArticleModifiedTime?: string;
  ogArticlePublishedTime?: string;
  ogArticlePublisher?: string;
  ogArticleSection?: string;
  ogArticleTag?: string;
  ogAudio?: string;
  ogAudioSecureURL?: string;
  ogAudioType?: string;
  ogAudioURL?: string;
  ogAvailability?: string;
  ogDate?: string;
  ogDescription?: string;
  ogDeterminer?: string;
  ogImage?: ImageObject[];
  ogImageHeight?: string | null[];
  ogImageProperty?: string | null[];
  ogImageSecureURL?: string | null[];
  ogImageType?: string | null[];
  ogImageURL?: string | null[];
  ogImageWidth?: string | null[];
  ogLocale?: string;
  ogLocaleAlternate?: string;
  ogLogo?: string;
  ogPriceAmount?: string;
  ogPriceCurrency?: string;
  ogProductAvailability?: string;
  ogProductCondition?: string;
  ogProductPriceAmount?: string;
  ogProductPriceCurrency?: string;
  ogProductRetailerItemId?: string;
  ogSiteName?: string;
  ogTitle?: string;
  ogType?: string;
  ogUrl?: string;
  ogVideo?: VideoObject[];
  ogVideoActorId?: string;
  ogVideoHeight?: string | null[];
  ogVideoProperty?: string | null[];
  ogVideoSecureURL?: string;
  ogVideoType?: string | null[];
  ogVideoWidth?: string | null[];
  placeLocationLatitude?: string;
  placeLocationLongitude?: string;
  profileFirstName?: string;
  profileGender?: string;
  profileLastName?: string;
  profileUsername?: string;
  publishedTime?: string;
  releaseDate?: string;
  requestUrl?: string;
  restaurantContactInfoCountryName?: string;
  restaurantContactInfoEmail?: string;
  restaurantContactInfoLocality?: string;
  restaurantContactInfoPhoneNumber?: string;
  restaurantContactInfoPostalCode?: string;
  restaurantContactInfoRegion?: string;
  restaurantContactInfoStreetAddress?: string;
  restaurantContactInfoWebsite?: string;
  restaurantMenu?: string;
  restaurantRestaurant?: string;
  restaurantSection?: string;
  restaurantVariationPriceAmount?: string;
  restaurantVariationPriceCurrency?: string;
  success?: boolean;
  twitterAppIdGooglePlay?: string;
  twitterAppIdiPad?: string;
  twitterAppIdiPhone?: string;
  twitterAppNameGooglePlay?: string;
  twitterAppNameiPad?: string;
  twitterAppNameiPhone?: string;
  twitterAppUrlGooglePlay?: string;
  twitterAppUrliPad?: string;
  twitterAppUrliPhone?: string;
  twitterCard?: string;
  twitterCreator?: string;
  twitterCreatorId?: string;
  twitterDescription?: string;
  twitterImage?: TwitterImageObject[];
  twitterImageAlt?: string | null[];
  twitterImageHeight?: string | null[];
  twitterImageProperty?: string | null[];
  twitterImageSrc?: string | null[];
  twitterImageWidth?: string | null[];
  twitterPlayer?: TwitterPlayerObject[];
  twitterPlayerHeight?: string | null[];
  twitterPlayerProperty?: string | null[];
  twitterPlayerStream?: string | null[];
  twitterPlayerStreamContentType?: string;
  twitterPlayerWidth?: string | null[];
  twitterSite?: string;
  twitterSiteId?: string;
  twitterTitle?: string;
  twitterUrl?: string;
  updatedTime?: string;
};

export type OgObject = Omit<
  OgObjectInteral,
  | "musicSongDisc"
  | "musicSongProperty"
  | "musicSongTrack"
  | "musicSongUrl"
  | "ogImageHeight"
  | "ogImageProperty"
  | "ogImageSecureURL"
  | "ogImageType"
  | "ogImageURL"
  | "ogImageWidth"
  | "ogVideoHeight"
  | "ogVideoProperty"
  | "ogVideoType"
  | "ogVideoWidth"
  | "twitterImageAlt"
  | "twitterImageHeight"
  | "twitterImageProperty"
  | "twitterImageSrc"
  | "twitterImageWidth"
  | "twitterPlayerHeight"
  | "twitterPlayerProperty"
  | "twitterPlayerStream"
  | "twitterPlayerWidth"
>;
