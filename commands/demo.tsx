import React from "react";
import { Box, Text } from "ink";
import { splitGraphemes } from "split-graphemes";

const general_reg =
	/[\u{1d400}-\u{1d7ff}\u{1f3fb}-\u{1f3ff}\u{300}-\u{36f}\u{fe0f}]/u;

// Block = “Miscellaneous Symbols and Pictographs”
const m_reg = new RegExp(
	"[" +
		"\u{1f321}-\u{1f32c}" +
		"\u{1f336}" +
		"\u{1f37d}" +
		"\u{1f394}-\u{1f39f}" +
		"\u{1f3cd}\u{1f3ce}" +
		"\u{1f3d4}-\u{1f3df}" +
		"\u{1f3f1}-\u{1f3f3}" +
		"\u{1f3f5}-\u{1f3f7}" +
		"\u{1f43f}\u{1f441}" +
		"\u{1f4fe}\u{1f4fd}" +
		"\u{1f53e}-\u{1f54a}" +
		"\u{1f54f}" +
		"\u{1f568}-\u{1f573}" +
		"\u{1f576}-\u{1f579}" +
		"\u{1f57b}-\u{1f594}" +
		"\u{1f597}-\u{1f5a3}" +
		"\u{1f5a5}-\u{1f5fa}" +
		"]",
	"u"
);

// Block = "Transport and Map Symbols"
const tm_reg = new RegExp(
	"[" +
		"\u{1f6c6}-\u{1f6cb}" +
		"\u{1f6cd}-\u{1f6cf}" +
		"\u{1f6d6}-\u{1f6ea}" +
		"\u{1f6f0}-\u{1f6f3}" +
		"\u{1f6fb}-\u{1f6fc}" +
		"]",
	"u"
);

/// Block = "Symbols and Pictographs Extended-A"
const extend_a_reg = new RegExp(
	"[" +
		"\u{1fa74}" +
		"\u{1fa83}-\u{1fa86}" +
		"\u{1fa96}-\u{1faa8}" +
		"\u{1fab0}-\u{1fab6}" +
		"\u{1fac0}-\u{1fac2}" +
		"\u{1fad0}-\u{1fad6}" +
		"]",
	"u"
);

const dingbats_reg = new RegExp("[" + "\u{270c}\u{270d}" + "]", "u");

const generateEmojiArray = (emoji: string, range: number): string[] => {
	const cp = emoji.codePointAt(0).toString(16);
	const int = parseInt(cp, 16);

	return [...Array(range).keys()].map((index) =>
		String.fromCodePoint(int + index)
	);
};

const tmp =
	"🧙‍♀🤏🏻🙆🏻‍♀️🙇🏻‍♀️🤲🏻𓈒𓂂✌🩰🪘🪚🫖🐿(◜‧̮◝ )( ͡° ͜ʖ ͡°)🏖🌡🌣🌥🌦🌨🌪🌬🌭🎔🎖🎘🎚🎜🎞🎠🏔🏗🏚🏝🏱🏲🏳🏵🏶🏷🐿📾📽🔾🕀🕃🕈🕏🕪🕰🕶🖈🖔🗐🗺🌶🍽🏍🏎👁🕭✍";

const Demo = () => (
	<Box flexDirection="column" paddingY={2}>
		{splitGraphemes(generateEmojiArray("\u{2776}", 100).join("")).map(
			(line, i) => (
				<Box key={i} width={16} borderStyle="round" borderColor="white">
					<Text>
						{[...line].map((c) => c.codePointAt(0).toString(16)).join() + " "}
					</Text>
					<Text>
						{[...line]
							.filter(
								(c) =>
									!(
										general_reg.test(c) ||
										m_reg.test(c) ||
										extend_a_reg.test(c) ||
										dingbats_reg.test(c)
									)
							)
							.join("") +
							" " +
							line}
					</Text>
				</Box>
			)
		)}
	</Box>
);

export default Demo;
