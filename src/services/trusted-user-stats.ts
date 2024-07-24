import { fetchWithProxy } from "../helpers/request";

export type NostrBandUserStats = {
  pubkey: string;
  pub_note_count: number;
  pub_post_count: number;
  pub_reply_count: number;
  pub_reaction_count: number;
  pub_repost_count: number;
  pub_report_count: number;
  pub_badge_definition_count: number;
  pub_long_note_count: number;
  pub_note_ref_event_count: number;
  pub_note_ref_pubkey_count: number;
  pub_reaction_ref_event_count: number;
  pub_reaction_ref_pubkey_count: number;
  pub_repost_ref_event_count: number;
  pub_repost_ref_pubkey_count: number;
  pub_report_ref_event_count: number;
  pub_report_ref_pubkey_count: number;
  pub_mute_ref_pubkey_count: number;
  pub_bookmark_ref_event_count: number;
  pub_badge_award_ref_pubkey_count: number;
  pub_profile_badge_ref_event_count: number;
  pub_following_pubkey_count: number;
  reaction_count: number;
  reaction_pubkey_count: number;
  repost_count: number;
  repost_pubkey_count: number;
  reply_count: number;
  reply_pubkey_count: number;
  report_count: number;
  report_pubkey_count: number;
  mute_pubkey_count: number;
  followers_pubkey_count: number;
  zaps_sent?: {
    count: number;
    zapper_count: number;
    target_event_count: number;
    target_pubkey_count: number;
    provider_count: number;
    msats: number;
    min_msats: number;
    max_msats: number;
    avg_msats: number;
    median_msats: number;
  };
  zaps_received?: {
    count: number;
    zapper_count: number;
    target_event_count: number;
    target_pubkey_count: number;
    provider_count: number;
    msats: number;
    min_msats: number;
    max_msats: number;
    avg_msats: number;
    median_msats: number;
  };
};

class TrustedUserStatsService {
  private userStats = new Map<string, NostrBandUserStats>();

  async fetchUserStats(pubkey: string) {
    try {
      const stats = await fetchWithProxy(`https://api.nostr.band/v0/stats/profile/${pubkey}`).then(
        (res) => res.json() as Promise<{ stats: Record<string, NostrBandUserStats> }>,
      );

      if (stats?.stats[pubkey]) {
        this.userStats.set(pubkey, stats?.stats[pubkey]);
        return stats?.stats[pubkey];
      }
    } catch (e) {}
  }

  private dedupe = new Map<string, Promise<NostrBandUserStats | undefined>>();
  async getUserStats(pubkey: string, alwaysFetch = false) {
    if (this.userStats.has(pubkey) && !alwaysFetch) return this.userStats.get(pubkey)!;

    if (this.dedupe.has(pubkey)) this.dedupe.get(pubkey)!;
    const p = this.fetchUserStats(pubkey);
    this.dedupe.set(pubkey, p);
    p.then(() => this.dedupe.delete(pubkey));
    return p;
  }
}

const trustedUserStatsService = new TrustedUserStatsService();

export default trustedUserStatsService;
