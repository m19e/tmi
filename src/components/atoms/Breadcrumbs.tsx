import { VFC } from "react";
import { Text } from "ink";

export const Breadcrumbs: VFC<{ root: string; breadcrumbs?: string[] }> = ({
	root,
	breadcrumbs,
}) => {
	if (Array.isArray(breadcrumbs)) {
		return (
			<Text>
				<Text color="#00acee">{root}</Text>
				{breadcrumbs.map((b) => (
					<Text key={b}>
						<Text dimColor>{" > "}</Text>
						<Text>{b}</Text>
					</Text>
				))}
			</Text>
		);
	}

	return <Text color="#00acee">{root}</Text>;
};
