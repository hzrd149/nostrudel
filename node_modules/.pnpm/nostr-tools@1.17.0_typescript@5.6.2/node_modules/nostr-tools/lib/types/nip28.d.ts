import { Event, Kind } from './event.ts';
export interface ChannelMetadata {
    name: string;
    about: string;
    picture: string;
}
export interface ChannelCreateEventTemplate {
    content: string | ChannelMetadata;
    created_at: number;
    tags?: string[][];
}
export interface ChannelMetadataEventTemplate {
    channel_create_event_id: string;
    content: string | ChannelMetadata;
    created_at: number;
    tags?: string[][];
}
export interface ChannelMessageEventTemplate {
    channel_create_event_id: string;
    reply_to_channel_message_event_id?: string;
    relay_url: string;
    content: string;
    created_at: number;
    tags?: string[][];
}
export interface ChannelHideMessageEventTemplate {
    channel_message_event_id: string;
    content: string | {
        reason: string;
    };
    created_at: number;
    tags?: string[][];
}
export interface ChannelMuteUserEventTemplate {
    content: string | {
        reason: string;
    };
    created_at: number;
    pubkey_to_mute: string;
    tags?: string[][];
}
export declare const channelCreateEvent: (t: ChannelCreateEventTemplate, privateKey: string) => Event<Kind.ChannelCreation> | undefined;
export declare const channelMetadataEvent: (t: ChannelMetadataEventTemplate, privateKey: string) => Event<Kind.ChannelMetadata> | undefined;
export declare const channelMessageEvent: (t: ChannelMessageEventTemplate, privateKey: string) => Event<Kind.ChannelMessage>;
export declare const channelHideMessageEvent: (t: ChannelHideMessageEventTemplate, privateKey: string) => Event<Kind.ChannelHideMessage> | undefined;
export declare const channelMuteUserEvent: (t: ChannelMuteUserEventTemplate, privateKey: string) => Event<Kind.ChannelMuteUser> | undefined;
