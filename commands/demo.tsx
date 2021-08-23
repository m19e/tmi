import React from "react";
import { Box, Text } from "ink";
import { splitGraphemes } from "split-graphemes";

const Demo = () => (
	<Box flexDirection="column" paddingY={2}>
		{splitGraphemes("𝙧𝙖𝐑𝐫𝙄𝙉𝙐🧙‍♀🌤🤏🏻🙆🏻‍♀️🙇🏻‍♀️🤲🏻🧊🤍𓈒𓂂✌🩰🪘🪚🫖🐿").map((line, i) => (
			<Box key={i} borderStyle="round" borderColor="white">
				{/* {([...line].length !== 1 || /[\u{1d400}-\u{1d7ff}]/u.test(line)) && (
					<Text>
						{[...line].map((c) => c.codePointAt(0).toString(16)).join() + "　"}
					</Text>
				)} */}
				<Text>
					{[...line].map((c) => c.codePointAt(0).toString(16)).join() + "　"}
				</Text>
				<Text>
					{[...line]
						.filter(
							(c) =>
								!/[\u{1d400}-\u{1d7ff}\u{1f3fb}-\u{1f3ff}\u{fe0f}]/u.test(c)
						)
						.join("")}
				</Text>
			</Box>
		))}
	</Box>
);

export default Demo;
