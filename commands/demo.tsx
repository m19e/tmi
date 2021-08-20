import React from "react";
import { Box, Text } from "ink";
import { splitGraphemes } from "split-graphemes";

const Demo = () => (
	<Box flexDirection="column">
		{splitGraphemes("𝙧𝙖𝐑𝐫𝙄𝙉𝙐🧙‍♀🌤🤏🏻🙆🏻‍♀️🙇🏻‍♀️🤲🏻").map((line, i) => (
			<Box key={i} borderStyle="round" borderColor="white">
				{([...line].length !== 1 || /[𝐀-𝟵]/u.test(line)) && (
					<Text>
						{[...line].map((c) => c.codePointAt(0).toString(16)).join() + "　"}
					</Text>
				)}
				<Text>{line}</Text>
			</Box>
		))}
	</Box>
);

export default Demo;
