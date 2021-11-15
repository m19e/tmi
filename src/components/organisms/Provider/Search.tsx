import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useCurrentColumn, useError, useHint } from "../../../hooks";
import {
	useTimelineWithCache,
	useMover,
	useSearchPaginator,
	useDisplayTweetsCount,
	getDisplayTimeline,
	getFocusedTweet,
	usePosition,
} from "../../../hooks/search";
import { AbstractTimeline } from "../AbstractTimeline";

interface Props {
	query: string;
}

export const SearchProvider = () => {
	const [column] = useCurrentColumn();
	const [, setError] = useError();
	const [{ key: hintKey }, setHintKey] = useHint();

	const displayTimeline = getDisplayTimeline();
	const [{ length: total }, setTimeline] = useTimelineWithCache();
	const paginator = useSearchPaginator();
	const mover = useMover();
	const [count, countActions] = useDisplayTweetsCount();
	const focusedTweet = getFocusedTweet();
	const [{ cursor }, { loadPosition }] = usePosition();

	const [status, setStatus] = useState<"init" | "timeline">("init");
	const [searchQuery, setSearchQuery] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [formQuery, setFormQuery] = useState("");

	useEffect(() => {
		if (column.type === "search") {
			if (column.timeline.length) {
				setTimeline(column.timeline);
				loadPosition();
				initColumn(column.query);
			} else if (column.query) {
				const f = async () => {
					setHintKey("none");
					setStatus("init");
					const error = await paginator.fetch({ q: column.query });
					if (typeof error === "string") {
						setError(error);
					}
					initColumn(column.query);
				};
				f();
			} else {
				initColumn("");
			}
		}

		return () => setStatus("init");
	}, [column.name]);

	const initColumn = (q: string) => {
		setSearchQuery(q);
		setFormQuery(q);
		setStatus("timeline");
		setHintKey("search/timeline");
	};

	const handleFormSubmit = async (value: string) => {
		const q = value.trim();
		if (q === "") return;
		setStatus("init");
		const error = await paginator.fetch({ q });
		if (typeof error === "string") {
			setError(error);
		}
		setIsFormOpen(false);
		initColumn(q);
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
		<Box flexDirection="column" flexGrow={1}>
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
