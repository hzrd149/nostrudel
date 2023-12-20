import { createIcon, IconProps } from "@chakra-ui/icons";

import SearchMd from "./icons/search-md";
import Settings02 from "./icons/settings-02";
import Mail01 from "./icons/mail-01";
import StickerSquare from "./icons/sticker-square";
import Code01 from "./icons/code-01";
import DistributeSpacingVertical from "./icons/distribute-spacing-vertical";
import Grid01 from "./icons/grid-01";
import Microscope from "./icons/microscope";
import Server04 from "./icons/server-04";
import ChevronDown from "./icons/chevron-down";
import ChevronUp from "./icons/chevron-up";
import ChevronLeft from "./icons/chevron-left";
import ChevronRight from "./icons/chevron-right";
import Zap from "./icons/zap";
import Target04 from "./icons/target-04";
import Award01 from "./icons/award-01";
import LayoutRight from "./icons/layout-right";
import ThumbsUp from "./icons/thumbs-up";
import ThumbsDown from "./icons/thumbs-down";
import LogOut01 from "./icons/log-out-01";
import Tool02 from "./icons/tool-02";
import ImagePlus from "./icons/image-plus";
import LockUnlocked01 from "./icons/lock-unlocked-01";
import PencilLine from "./icons/pencil-line";
import Share07 from "./icons/share-07";
import Copy01 from "./icons/copy-01";
import Trash01 from "./icons/trash-01";
import Share04 from "./icons/share-04";
import FaceSmile from "./icons/face-smile";
import Eye from "./icons/eye";
import EyeOff from "./icons/eye-off";
import Colors from "./icons/colors";
import Database01 from "./icons/database-01";
import Speedometer03 from "./icons/speedometer-03";
import UserCircle from "./icons/user-circle";
import DotsHorizontal from "./icons/dots-horizontal";
import Feather from "./icons/feather";
import List from "./icons/list";
import VideoRecorder from "./icons/video-recorder";
import Map01 from "./icons/map-01";
import PlayCircle from "./icons/play-circle";
import StopCircle from "./icons/stop-circle";
import CheckVerified01 from "./icons/check-verified-01";
import AlertOctagon from "./icons/alert-octagon";
import AlertTriangle from "./icons/alert-triangle";
import Key01 from "./icons/key-01";
import Check from "./icons/check";
import Bell01 from "./icons/bell-01";
import QrCode02 from "./icons/qr-code-02";
import PlusCircle from "./icons/plus-circle";
import AtSign from "./icons/at-sign";
import UserPlus01 from "./icons/user-plus-01";
import UserX01 from "./icons/user-x-01";
import Plus from "./icons/plus";
import Bookmark from "./icons/bookmark";
import BankNote01 from "./icons/bank-note-01";
import Wallet02 from "./icons/wallet-02";
import Download01 from "./icons/download-01";
import Repeat01 from "./icons/repeat-01";
import ReverseLeft from "./icons/reverse-left";
import Pin01 from "./icons/pin-01";
import Translate01 from "./icons/translate-01";
import MessageChatSquare from "./icons/message-chat-square";
import File01 from "./icons/file-01";

const defaultProps: IconProps = { boxSize: 4 };

export const NotesIcon = StickerSquare;

export const NoteFeedIcon = DistributeSpacingVertical;

export const MoreIcon = DotsHorizontal;

export const CodeIcon = Code01;

export const SettingsIcon = Settings02;
export const LogoutIcon = LogOut01;
export const ProfileIcon = UserCircle;

export const CopyToClipboardIcon = Copy01;

export const TrashIcon = Trash01;

export const AddIcon = Plus;

export const ChevronDownIcon = ChevronDown;
export const ChevronUpIcon = ChevronUp;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;

export const LightningIcon = Zap;
export const RelayIcon = Server04;
export const BroadcastEventIcon = Share07;
export const ShareIcon = Share07;
export const PinIcon = Pin01;

export const ExternalLinkIcon = Share04;

export const SearchIcon = SearchMd;

export const ReplyIcon = ReverseLeft;
export const RepostIcon = Repeat01;
export const QuoteRepostIcon = createIcon({
  displayName: "QuoteRepostIcon",
  d: "M19.4167 6.67891C20.4469 7.77257 21.0001 9 21.0001 10.9897C21.0001 14.4891 18.5436 17.6263 14.9695 19.1768L14.0768 17.7992C17.4121 15.9946 18.0639 13.6539 18.3245 12.178C17.7875 12.4557 17.0845 12.5533 16.3954 12.4895C14.591 12.3222 13.1689 10.8409 13.1689 9C13.1689 7.067 14.7359 5.5 16.6689 5.5C17.742 5.5 18.7681 5.99045 19.4167 6.67891ZM9.41669 6.67891C10.4469 7.77257 11.0001 9 11.0001 10.9897C11.0001 14.4891 8.54359 17.6263 4.96951 19.1768L4.07682 17.7992C7.41206 15.9946 8.06392 13.6539 8.32447 12.178C7.78747 12.4557 7.08452 12.5533 6.39539 12.4895C4.59102 12.3222 3.16895 10.8409 3.16895 9C3.16895 7.067 4.73595 5.5 6.66895 5.5C7.742 5.5 8.76814 5.99045 9.41669 6.67891Z",
  defaultProps,
});

export const VerifiedIcon = CheckVerified01;
export const VerificationFailed = AlertOctagon;

export const VerificationMissing = createIcon({
  displayName: "VerificationFailed",
  d: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0 0 12 6.5a3.501 3.501 0 0 0-3.433 2.813l1.962.393A1.5 1.5 0 1 1 12 11.5a1 1 0 0 0-1 1V14h2v-.645z",
  defaultProps,
});

export const SpyIcon = createIcon({
  displayName: "SpyIcon",
  d: "M17 13a4 4 0 1 1-4 4h-2a4 4 0 1 1-.535-2h3.07A3.998 3.998 0 0 1 17 13zM7 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM16 3a4 4 0 0 1 4 4v3h2v2H2v-2h2V7a4 4 0 0 1 4-4h8zm0 2H8c-1.054 0-2 .95-2 2v3h12V7c0-1.054-.95-2-2-2z",
  defaultProps,
});

export const KeyIcon = Key01;
export const CheckIcon = Check;

export const NotificationsIcon = Bell01;

export const LikeIcon = ThumbsUp;
export const DislikeIcon = ThumbsDown;

export const QrCodeIcon = QrCode02;

export const DirectMessagesIcon = Mail01;

export const UnlockIcon = LockUnlocked01;
export const UploadImageIcon = ImagePlus;

export const PlusCircleIcon = PlusCircle;

export const GithubIcon = createIcon({
  displayName: "GithubIcon",
  d: "M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0",
  defaultProps,
});

export const ToolsIcon = Tool02;

export const EditIcon = PencilLine;

export const WritingIcon = Feather;

export const AtIcon = AtSign;

export const FollowIcon = UserPlus01;
export const UnfollowIcon = UserX01;

export const ListsIcon = List;
export const LiveStreamIcon = VideoRecorder;

export const ImageGridTimelineIcon = Grid01;

export const TimelineHealthIcon = Microscope;

export const MapIcon = Map01;

export const StarEmptyIcon = createIcon({
  displayName: "StarEmptyIcon",
  d: "M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26ZM12.0006 15.968L16.2473 18.3451L15.2988 13.5717L18.8719 10.2674L14.039 9.69434L12.0006 5.27502L9.96214 9.69434L5.12921 10.2674L8.70231 13.5717L7.75383 18.3451L12.0006 15.968Z",
  defaultProps,
});
export const StarFullIcon = createIcon({
  displayName: "StarFullIcon",
  d: "M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z",
  defaultProps,
});
export const StarHalfIcon = createIcon({
  displayName: "StarHalfIcon",
  d: "M12.0006 15.968L16.2473 18.3451L15.2988 13.5717L18.8719 10.2674L14.039 9.69434L12.0006 5.27502V15.968ZM12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26Z",
  defaultProps,
});

export const ErrorIcon = AlertTriangle;

export const BookmarkIcon = Bookmark;

// TODO: switch to untitled UI solid icon
export const BookmarkedIcon = createIcon({
  displayName: "BookmarkedIcon",
  d: "M4 2H20C20.5523 2 21 2.44772 21 3V22.2763C21 22.5525 20.7761 22.7764 20.5 22.7764C20.4298 22.7764 20.3604 22.7615 20.2963 22.7329L12 19.0313L3.70373 22.7329C3.45155 22.8455 3.15591 22.7322 3.04339 22.4801C3.01478 22.4159 3 22.3465 3 22.2763V3C3 2.44772 3.44772 2 4 2ZM12 13.5L14.9389 15.0451L14.3776 11.7725L16.7553 9.45492L13.4695 8.97746L12 6L10.5305 8.97746L7.24472 9.45492L9.62236 11.7725L9.06107 15.0451L12 13.5Z",
  defaultProps,
});

export const V4VStreamIcon = PlayCircle;
export const V4VStopIcon = StopCircle;

export const AddReactionIcon = createIcon({
  displayName: "AddReactionIcon",
  d: "M19.0001 13.9999V16.9999H22.0001V18.9999H18.9991L19.0001 21.9999H17.0001L16.9991 18.9999H14.0001V16.9999H17.0001V13.9999H19.0001ZM20.2426 4.75736C22.505 7.0244 22.5829 10.636 20.4795 12.992L19.06 11.574C20.3901 10.0499 20.3201 7.65987 18.827 6.1701C17.3244 4.67092 14.9076 4.60701 13.337 6.01688L12.0019 7.21524L10.6661 6.01781C9.09098 4.60597 6.67506 4.66808 5.17157 6.17157C3.68183 7.66131 3.60704 10.0473 4.97993 11.6232L13.412 20.069L11.9999 21.485L3.52138 12.993C1.41705 10.637 1.49571 7.01901 3.75736 4.75736C6.02157 2.49315 9.64519 2.41687 12.001 4.52853C14.35 2.42 17.98 2.49 20.2426 4.75736Z",
  defaultProps,
});

export const EmojiPacksIcon = FaceSmile;
export const GoalIcon = Target04;
export const BadgeIcon = Award01;

export const DrawerIcon = LayoutRight;

export const UnmuteIcon = Eye;
export const MuteIcon = EyeOff;

export const AppearanceIcon = Colors;
export const DatabaseIcon = Database01;
export const PerformanceIcon = Speedometer03;

export const CommunityIcon = createIcon({
  displayName: "CommunityIcon",
  d: "M9.55 11.5C8.30736 11.5 7.3 10.4926 7.3 9.25C7.3 8.00736 8.30736 7 9.55 7C10.7926 7 11.8 8.00736 11.8 9.25C11.8 10.4926 10.7926 11.5 9.55 11.5ZM10 19.748V16.4C10 15.9116 10.1442 15.4627 10.4041 15.0624C10.1087 15.0213 9.80681 15 9.5 15C7.93201 15 6.49369 15.5552 5.37091 16.4797C6.44909 18.0721 8.08593 19.2553 10 19.748ZM4.45286 14.66C5.86432 13.6168 7.61013 13 9.5 13C10.5435 13 11.5431 13.188 12.4667 13.5321C13.3447 13.1888 14.3924 13 15.5 13C17.1597 13 18.6849 13.4239 19.706 14.1563C19.8976 13.4703 20 12.7471 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 12.9325 4.15956 13.8278 4.45286 14.66ZM18.8794 16.0859C18.4862 15.5526 17.1708 15 15.5 15C13.4939 15 12 15.7967 12 16.4V20C14.9255 20 17.4843 18.4296 18.8794 16.0859ZM12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM15.5 12.5C14.3954 12.5 13.5 11.6046 13.5 10.5C13.5 9.39543 14.3954 8.5 15.5 8.5C16.6046 8.5 17.5 9.39543 17.5 10.5C17.5 11.6046 16.6046 12.5 15.5 12.5Z",
  defaultProps,
});

/** @deprecated */
export const GhostIcon = createIcon({
  displayName: "GhostIcon",
  d: "M12 2C16.9706 2 21 6.02944 21 11V18.5C21 20.433 19.433 22 17.5 22C16.3001 22 15.2413 21.3962 14.6107 20.476C14.0976 21.3857 13.1205 22 12 22C10.8795 22 9.9024 21.3857 9.38728 20.4754C8.75869 21.3962 7.69985 22 6.5 22C4.63144 22 3.10487 20.5357 3.00518 18.692L3 18.5V11C3 6.02944 7.02944 2 12 2ZM12 4C8.21455 4 5.1309 7.00478 5.00406 10.7593L5 11L4.99927 18.4461L5.00226 18.584C5.04504 19.3751 5.70251 20 6.5 20C6.95179 20 7.36652 19.8007 7.64704 19.4648L7.73545 19.3478C8.57033 18.1248 10.3985 18.2016 11.1279 19.4904C11.3053 19.8038 11.6345 20 12 20C12.3651 20 12.6933 19.8044 12.8687 19.4934C13.5692 18.2516 15.2898 18.1317 16.1636 19.2151L16.2606 19.3455C16.5401 19.7534 16.9976 20 17.5 20C18.2797 20 18.9204 19.4051 18.9931 18.6445L19 18.5V11C19 7.13401 15.866 4 12 4ZM12 12C13.1046 12 14 13.1193 14 14.5C14 15.8807 13.1046 17 12 17C10.8954 17 10 15.8807 10 14.5C10 13.1193 10.8954 12 12 12ZM9.5 8C10.3284 8 11 8.67157 11 9.5C11 10.3284 10.3284 11 9.5 11C8.67157 11 8 10.3284 8 9.5C8 8.67157 8.67157 8 9.5 8ZM14.5 8C15.3284 8 16 8.67157 16 9.5C16 10.3284 15.3284 11 14.5 11C13.6716 11 13 10.3284 13 9.5C13 8.67157 13.6716 8 14.5 8Z",
  defaultProps,
});

export const ECashIcon = BankNote01;
export const WalletIcon = Wallet02;
export const DownloadIcon = Download01;

export const TranslateIcon = Translate01;
export const ChannelsIcon = MessageChatSquare;
export const ThreadIcon = MessageChatSquare;
export const FileIcon = File01;