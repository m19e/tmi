import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import path from "path";
import {
	mkdirsSync,
	readdirSync,
	existsSync,
	readJsonSync,
	writeJson,
} from "fs-extra";
import { Text, Box, useApp } from "ink";
import useDimensions from "ink-use-stdout-dimensions";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import Twitter, { TwitterOptions } from "twitter-lite";
import { config as dotenvConfig } from "dotenv";

import { Tweet, TrimmedList } from "../src/types/twitter";
import { GetListTweetsParams } from "../src/types";
import { convertTweetToDisplayable } from "../src/lib";
import { getUserListsApi, getListTweetsApi } from "../src/lib/api";
import {
	useUserId,
	useClient,
	useTimeline,
	getFocusedPosition,
	useCursorIndex,
	useFocusIndex,
	useDisplayTweetsCount,
} from "../src/hooks";
import Timeline from "../src/components/Timeline";
import ListPage from "../src/components/pages/List";

/// Hello world command
const Tink = () => {
	return <ListPage />;
};

Tink.propTypes = {
	/// Name of the person to greet
	name: PropTypes.string,
};

export default Tink;
