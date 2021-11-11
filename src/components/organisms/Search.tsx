import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import useDimensions from "ink-use-stdout-dimensions";
import { useError, useHint } from "../../hooks";
import {
	useTimeline,
	useMover,
	useSearchPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../hooks/search";
import { AbstractTimeline } from "./AbstractTimeline";

interface Props {
	query: string;
}

export const SearchPage = ({ query }: Props) => {
	const [, rows] = useDimensions();
	const [, setError] = useError();
	const [{ key: hintKey }, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useTimeline();
	const paginator = useSearchPaginator();
	const mover = useMover();
	const [count, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();
	const [{ cursor }] = usePosition();

	const [status, setStatus] = useState<"init" | "timeline">("init");
	const [searchQuery, setSearchQuery] = useState(`"${query}"`);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [formQuery, setFormQuery] = useState(`"${query}"`);

	useEffect(() => {
		search(`"${query}"`);
		return () => setStatus("init");
	}, []);

	const search = async (queryText: string) => {
		const q = `${queryText} -RT`;
		const error = await paginator.fetch({ q });
		if (typeof error === "string") {
			setError(error);
		}
		setStatus("timeline");
		setHintKey("search/timeline");
	};

	const handleFormSubmit = async (value: string) => {
		setStatus("init");
		await search(value);
		setSearchQuery(value);
		setIsFormOpen(false);
	};

	useInput(
		(input, key) => {
			if (input === "s" && !isFormOpen) {
				setFormQuery(searchQuery);
				setIsFormOpen(true);
				setHintKey("search/timeline/form");
			} else if (key.escape && isFormOpen) {
				setTimeout(() => {
					setIsFormOpen(false);
					setHintKey("search/timeline");
				});
			}
		},
		{
			isActive:
				hintKey === "search/timeline" || hintKey === "search/timeline/form",
		}
	);

	const Header = () => {
		if (isFormOpen) {
			return (
				<Box justifyContent="flex-start" marginBottom={1}>
					<Text color="#00acee" bold>
						<>Search: </>
					</Text>
					<TextInput
						value={formQuery}
						onChange={setFormQuery}
						onSubmit={handleFormSubmit}
					/>
				</Box>
			);
		}
		return (
			<Box justifyContent="space-between" marginBottom={1}>
				<Text color="#00acee" bold>
					Search: {searchQuery}
				</Text>
				{!!total ? (
					<Text>
						[{cursor + 1}-{cursor + count}/{total}]
					</Text>
				) : (
					<Text>[empty]</Text>
				)}
			</Box>
		);
	};

	if (status === "init") {
		return <Text>Loading...</Text>;
	}
	return (
		<Box flexDirection="column" minHeight={rows}>
			<Header />
			{(() => {
				if (!total) {
					return (
						<Text bold color="gray">
							No results for {`"${searchQuery}"`}
						</Text>
					);
				}
				if (!isFormOpen) {
					return (
						<AbstractTimeline
							type="search"
							timeline={displayTimeline}
							setTimeline={setTimeline}
							paginator={paginator}
							mover={mover}
							countActions={countActions}
							focusedTweet={focusedTweet}
						/>
					);
				}
				return null;
			})()}
		</Box>
	);
};
