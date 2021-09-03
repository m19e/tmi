import { splitGraphemes } from "split-graphemes";
import { Tweet } from "../types/twitter";

export const getDisplayTimeAgo = (created_at: string): string => {
	const dt = new Date(created_at);
	const diff_time = Date.now() - dt.getTime();
	const diff_sec = Math.floor(diff_time / 1000);
	const diff_min = Math.floor(diff_sec / 60);
	const diff_hour = Math.floor(diff_min / 60);
	const diff_day = Math.floor(diff_hour / 24);
	const diff_week = Math.floor(diff_day / 7);
	const diff_year = Math.floor(diff_day / 365);

	if (diff_year)
		return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
	if (diff_week) return `${dt.getMonth() + 1}/${dt.getDate()}`;
	if (diff_day) return `${diff_day}d`;
	if (diff_hour) return `${diff_hour}h`;
	if (diff_min) return `${diff_min}m`;
	if (diff_sec) return `${diff_sec}s`;

	return "now";
};

const splitWithGraphemes = (text: string): string[] => splitGraphemes(text);

const UNESCAPE_PATTERNS = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
};

const unescapeText = (target: string) =>
	target.replace(/&(lt|gt|amp);/g, (match: string) => UNESCAPE_PATTERNS[match]);

const reg = new RegExp(
	"[" +
		// "Basic Latin"
		"\u{1}-\u{6}\u{8}-\u{c}\u{10}-\u{1f}" +
		// "Latin-1 Supplement"
		"\u{84}\u{85}\u{8c}\u{90}\u{98}\u{9b}\u{9d}-\u{9f}" +
		// "Combining Diacritical Marks"
		"\u{300}-\u{36f}" +
		// "Dingbats"
		"\u{270c}\u{270d}" +
		// "Linear B Syllabary" ~ "Early Dynastic Cuneiform"
		"\u{10000}-\u{1254f}" +
		// "Egyptian Hieroglyphs" ~ "Anatolian Hieroglyphs"
		"\u{13000}-\u{1467f}" +
		// "Bamum Supplement" ~ "Tangut Supplement"
		"\u{16800}-\u{18d8f}" +
		// "Kana Supplement" ~ "Duployan"
		"\u{1b002}-\u{1bcaf}" +
		// "Byzantine Musical Symbols" ~ "Sutton SignWriting"
		"\u{1d000}-\u{1daaf}" +
		// "Glagolitic Supplement" ~ "Enclosed Alphanumeric Supplement"
		"\u{1e000}-\u{1f003}\u{1f005}-\u{1f18d}\u{1f18f}\u{1f190}\u{1f19b}-\u{1f1e5}" +
		// "Enclosed Ideographic Supplement"
		"\u{1f260}-\u{1f265}" +
		// "Miscellaneous Symbols and Pictographs"
		"\u{1f321}-\u{1f32c}\u{1f336}\u{1f37d}\u{1f394}-\u{1f39f}\u{1f3cd}\u{1f3ce}\u{1f3d4}-\u{1f3df}\u{1f3f1}-\u{1f3f3}\u{1f3f5}-\u{1f3f7}\u{1f43f}\u{1f441}\u{1f4fe}\u{1f4fd}\u{1f53e}-\u{1f54a}\u{1f54f}\u{1f568}-\u{1f573}\u{1f576}-\u{1f579}\u{1f57b}-\u{1f58f}\u{1f591}-\u{1f594}\u{1f597}-\u{1f5a3}\u{1f5a5}-\u{1f5fa}" +
		// "Ornamental Dingbats"
		"\u{1f650}-\u{1f67f}" +
		// "Transport and Map Symbols"
		"\u{1f6c6}-\u{1f6cb}\u{1f6cd}-\u{1f6cf}\u{1f6d3}\u{1f6d4}\u{1f6d6}-\u{1f6ea}\u{1f6f0}-\u{1f6f3}\u{1f6fb}-\u{1f6fc}" +
		// "Alchemical Symbols"
		"\u{1f700}-\u{1f77f}" +
		// "Geometric Shapes Extended"
		"\u{1f780}-\u{1f7df}" +
		// "Supplemental Arrows-C"
		"\u{1f800}-\u{1f8ff}" +
		// "Supplemental Symbols and Pictographs"
		"\u{1f900}-\u{1f90c}\u{1f93b}\u{1f946}\u{1f972}\u{1f977}-\u{1f979}\u{1f9a3}\u{1f9a4}\u{1f9ab}-\u{1f9ad}\u{1f9cb}\u{1f9cc}\u{1f9}-\u{1f9}\u{1f9}-\u{1f9}" +
		// "Chess Symbols"
		"\u{1fa00}-\u{1fa6f}" +
		// "Symbols and Pictographs Extended-A"
		"\u{1fa74}\u{1fa83}-\u{1fa86}\u{1fa96}-\u{1faa8}\u{1fab0}-\u{1fab6}\u{1fac0}-\u{1fac2}\u{1fad0}-\u{1fad6}" +
		// "Symbols for Legacy Computing"
		"\u{1fb00}-\u{1fbff}" +
		// "Variation Selectors Supplement"
		"\u{e0100}-\u{e01ef}" +
		// "Variation Selectors"
		"\u{fe00}-\u{fe0f}" +
		"]",
	"u"
);

const convertToCorrectWidthText = (text: string): string => {
	if (!text.match(reg)) return unescapeText(text);

	return unescapeText(text)
		.split(/\n|\r\n|\r/)
		.map((line) =>
			splitWithGraphemes(line)
				.map((g) => {
					const arr = [...g];
					if (arr.length === 1) {
						if (/[\u{fe00}-\u{fe0f}]/u.test(g)) return "";
						if (reg.test(g)) return "☒";
						return g;
					}
					return arr.filter((c) => !reg.test(c)).join("");
				})
				.join("")
		)
		.join("\n");
};

export const convertTweetToDisplayable = (t: Tweet): Tweet => {
	const full_text = convertToCorrectWidthText(t.full_text);
	const name = convertToCorrectWidthText(t.user.name);
	let tweet: Tweet = {
		...t,
		full_text,
		user: { ...t.user, name },
	};

	if (t.retweeted_status) {
		const rt = t.retweeted_status;
		const rt_full_text = convertToCorrectWidthText(rt.full_text);
		const rt_user_name = convertToCorrectWidthText(rt.user.name);
		tweet.retweeted_status = {
			...rt,
			full_text: rt_full_text,
			user: { ...rt.user, name: rt_user_name },
		};
	}

	if (t.quoted_status) {
		const qt = t.quoted_status;
		const qt_full_text = convertToCorrectWidthText(qt.full_text);
		const qt_user_name = convertToCorrectWidthText(qt.user.name);
		tweet.quoted_status = {
			...qt,
			full_text: qt_full_text,
			user: { ...qt.user, name: qt_user_name },
		};
	}

	return tweet;
};
