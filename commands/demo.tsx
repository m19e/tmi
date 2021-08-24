import React from "react";
import { Box, Text } from "ink";
import { splitGraphemes } from "split-graphemes";

const general_reg =
	/[\u{1d400}-\u{1d7ff}\u{1f3fb}-\u{1f3ff}\u{1f43f}\u{270c}\u{fe0f}\u{1f3d6}\u{1fad6}\u{1fa9a}\u{1fa98}\u{361}\u{35c}\u{32e}]/u;

const Demo = () => (
	<Box flexDirection="column" paddingY={2}>
		{splitGraphemes(
			"🧙‍♀🤏🏻🙆🏻‍♀️🙇🏻‍♀️🤲🏻𓈒𓂂✌🩰🪘🪚🫖🐿(◜‧̮◝ )( ͡° ͜ʖ ͡°)🏖🌡🌣🌥🌦🌨🌪🌬🌭🎔🎖🎘🎚🎜🎞🎠🏔🏗🏚🏝🏱🏲🏳🏵🏶🏷🐿📾🔾🕀🕃🕈🕏🕪🕰🕶🖈🖔🗐🗺🌶🍽🏍🏎👁🕭"
		).map((line, i) => (
			<Box key={i} borderStyle="round" borderColor="white">
				<Text>
					{[...line].map((c) => c.codePointAt(0).toString(16)).join() + "　"}
				</Text>
				<Text>{[...line].filter((c) => !general_reg.test(c)).join("")}</Text>
			</Box>
		))}
	</Box>
);

export default Demo;
