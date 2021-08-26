import React from "react";
import PropTypes from "prop-types";
import { Box, Text } from "ink";
import { splitGraphemes } from "split-graphemes";

const general_reg =
	/[\u{1}-\u{6}\u{8}-\u{c}\u{10}-\u{1f}\u{84}\u{85}\u{8c}\u{90}\u{98}\u{9b}\u{9d}-\u{9f}\u{300}-\u{36f}\u{10000}-\u{1254f}\u{13000}-\u{1467f}\u{16800}-\u{18d8f}\u{1b002}-\u{1bcaf}\u{1d000}-\u{1daaf}\u{1e000}-\u{1f003}\u{1f005}-\u{1f18d}\u{1f18f}\u{1f190}\u{1f19b}-\u{1f1e5}\u{1f260}-\u{1f265}\u{1f700}-\u{1f77f}\u{1f780}-\u{1f7df}\u{1f800}-\u{1f8ff}\u{1fa00}-\u{1fa6f}\u{1fb00}-\u{1fbff}\u{e0100}-\u{e01ef}]/u;

// Block = "Basic Latin"
const bl_reg = new RegExp(
	"[" +
		"\u{1}-\u{6}" +
		"\u{8}-\u{c}" +
		"\u{10}-\u{1f}" +
		"\u{84}\u{85}\u{8c}\u{90}\u{98}\u{9b}\u{9d}-\u{9f}" +
		"]",
	"u"
);

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
		"\u{1f57b}-\u{1f58f}" +
		"\u{1f591}-\u{1f594}" +
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

// Block = "Supplemental Symbols and Pictographs"
const s_reg = new RegExp(
	"[" +
		"\u{1f900}-\u{1f90c}" +
		"\u{1f93b}\u{1f946}\u{1f972}" +
		"\u{1f977}-\u{1f979}" +
		"\u{1f9a3}\u{1f9a4}" +
		"\u{1f9ab}-\u{1f9ad}" +
		"\u{1f9cb}\u{1f9cc}" +
		"\u{1f9}-\u{1f9}" +
		"\u{1f9}-\u{1f9}" +
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

const Demo = ({ start, count = 100 }: { start: string; count: number }) => {
	const array: string[] = generateEmojiArray(
		String.fromCodePoint(parseInt(start, 16)),
		count
	).reverse();

	return (
		<Box flexDirection="column" paddingY={2}>
			{array.map((line, i) => (
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
										tm_reg.test(c) ||
										s_reg.test(c) ||
										extend_a_reg.test(c) ||
										dingbats_reg.test(c)
									)
							)
							.join("") +
							" " +
							line}
					</Text>
				</Box>
			))}
			<Box width={16} borderStyle="round" borderColor="cyan">
				<Text>
					LastIndex:{" "}
					{[...array[0]].map((c) => c.codePointAt(0).toString(16)).join() +
						" " +
						array[0]}
				</Text>
			</Box>
		</Box>
	);
};

Demo.propTypes = {
	start: PropTypes.string.isRequired,
	count: PropTypes.number,
};

Demo.shortFlags = {
	start: "s",
	count: "c",
};

export default Demo;
