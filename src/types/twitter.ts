export interface List {
	id: number;
	id_str: string;
	name: string;
	uri: string;
	subscriber_count: number;
	member_count: number;
	mode: "public" | "private";
	description: string;
	slug: string;
	full_name: string;
	created_at: string;
	following: boolean;
	user: User;
}

export interface TrimmedList {
	id_str: string;
	name: string;
	mode: "public" | "private";
}

export interface Tweet {
	contributors?: null;
	coordinates?: Coordinates | null;
	created_at: string;
	current_user_retweet?: TrimmedUser;
	display_text_range?: [number, number] | null;
	entities: Entities;
	extended_entities?: ExtendedEntities | null;
	favorite_count: number;
	favorited: boolean;
	full_text: string;
	id_str: string;
	id: number;
	in_reply_to_screen_name?: string | null;
	in_reply_to_status_id_str?: string | null;
	in_reply_to_status_id?: number | null;
	in_reply_to_user_id_str?: string | null;
	in_reply_to_user_id?: number | null;
	is_quote_status: boolean;
	lang?: string | null;
	place?: Place | null;
	possibly_sensitive?: boolean | null;
	quoted_status_id_str?: string | null;
	quoted_status_id?: number | null;
	quoted_status_permalink?: QuotedStatusPermalink | null;
	quoted_status?: Tweet | null;
	retweet_count: number;
	retweeted_status?: Tweet | null;
	retweeted: boolean;
	scopes?: Scope | null;
	source: string;
	truncated: boolean;
	user: User;
	withheld_copyright?: boolean | null;
	withheld_in_countries?: string[] | null;
	withheld_scope?: string | null;
}

export interface User {
	created_at: string;
	default_profile_image: boolean;
	default_profile: boolean;
	description?: string | null;
	entities: UserEntities;
	favourites_count: number;
	followers_count: number;
	friends_count: number;
	id_str: string;
	id: number;
	listed_count: number;
	location?: string | null;
	name: string;
	profile_banner_url?: string;
	profile_image_url_https: string;
	protected: boolean;
	screen_name: string;
	status?: Tweet;
	statuses_count: number;
	url?: string | null;
	verified: boolean;
	withheld_in_countries?: string[];
	withheld_scope?: string;
}

interface TrimmedUser {
	id_str: string;
	id: number;
}

interface UserEntities {
	description: UserDescriptionEntity;
	url?: UserUrlEntity | null;
}

interface UserDescriptionEntity {
	urls?: UrlEntity[] | null;
}

interface UserUrlEntity {
	urls?: UrlEntity[] | null;
}

interface UrlEntity {
	display_url?: string;
	expanded_url?: string;
	indices?: [number, number] | null;
	url: string;
}

interface Entities {
	hashtags?: HashtagEntity[] | null;
	media?: MediaEntity[] | null;
	symbols?: SymbolEntity[] | null;
	urls?: UrlEntity[] | null;
	user_mentions?: UserMentionEntity[] | null;
}

interface ExtendedEntities {
	media?: MediaEntity[] | null;
}

interface HashtagEntity {
	indices?: [number, number] | null;
	text: string;
}
interface MediaEntity {
	additional_media_info?: AdditionalMediaInfo | null;
	display_url: string;
	expanded_url: string;
	id_str: string;
	id: number;
	indices?: [number, number] | null;
	media_url_https: string;
	media_url: string;
	sizes: Sizes;
	source_status_id_str?: string | null;
	source_status_id?: number | null;
	source_user_id_str?: string | null;
	source_user_id?: number | null;
	type: string;
	url: string;
	video_info?: VideoInfo | null;
}

interface AdditionalMediaInfo {
	call_to_actions?: CallToActions | null;
	description?: string | null;
	embeddable?: boolean | null;
	monetizable: boolean;
	source_user?: User | null;
	title?: string | null;
}

interface CallToActions {
	visit_site?: VisitSite | null;
	watch_now?: WatchNow | null;
}

interface Sizes {
	large: Size;
	medium: Size;
	small: Size;
	thumb: Size;
}

interface Size {
	h: number;
	resize: string;
	w: number;
}

interface VideoInfo {
	aspect_ratio?: [number, number] | null;
	duration_millis?: number | null;
	variants?: VideoVariant[] | null;
}

interface VideoVariant {
	bitrate?: number | null;
	content_type: string;
	url: string;
}

interface VisitSite {
	url: string;
}

interface WatchNow {
	url: string;
}

interface SymbolEntity {
	indices?: [number, number] | null;
	text: string;
}

interface UserMentionEntity {
	id_str: string;
	id: number;
	indices?: number[] | null;
	name: string;
	screen_name: string;
}

interface Place {
	attributes: Attributes;
	bounding_box: BoundingBox;
	contained_within?: string[] | null;
	country_code: string;
	country: string;
	full_name: string;
	id: string;
	name: string;
	place_type: string;
	url: string;
}

interface Attributes {}

interface BoundingBox {
	coordinates?: [number, number][][] | null;
	type: string;
}

interface QuotedStatusPermalink {
	display: string;
	expanded: string;
	url: string;
}

interface Coordinates {
	coordinates?: [number, number] | null;
	type: string;
}

interface Scope {
	followers: boolean;
	place_ids?: string[] | null;
}
