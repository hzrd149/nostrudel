import replaceableEventLoaderService from "./replaceable-event-requester";

class UserMuteListService {
  getMuteList(pubkey: string) {
    return replaceableEventLoaderService.getEvent(10000, pubkey);
  }
  requestMuteList(relays: string[], pubkey: string, alwaysRequest = false) {
    return replaceableEventLoaderService.requestEvent(relays, 10000, pubkey, undefined, alwaysRequest);
  }
}

const userMuteListService = new UserMuteListService();

export default userMuteListService;
