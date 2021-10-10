import React, { useState, useEffect } from "react";
import type { FC } from "react";
import { Text } from "ink";
import spinners from "cli-spinners";

type SpinnerName =
	| "dots"
	| "dots2"
	| "dots3"
	| "dots4"
	| "dots5"
	| "dots6"
	| "dots7"
	| "dots8"
	| "dots9"
	| "dots10"
	| "dots11"
	| "dots12"
	| "dots8Bit"
	| "line"
	| "line2"
	| "pipe"
	| "simpleDots"
	| "simpleDotsScrolling"
	| "star"
	| "star2"
	| "flip"
	| "hamburger"
	| "growVertical"
	| "growHorizontal"
	| "balloon"
	| "balloon2"
	| "noise"
	| "bounce"
	| "boxBounce"
	| "boxBounce2"
	| "triangle"
	| "arc"
	| "circle"
	| "squareCorners"
	| "circleQuarters"
	| "circleHalves"
	| "squish"
	| "toggle"
	| "toggle2"
	| "toggle3"
	| "toggle4"
	| "toggle5"
	| "toggle6"
	| "toggle7"
	| "toggle8"
	| "toggle9"
	| "toggle10"
	| "toggle11"
	| "toggle12"
	| "toggle13"
	| "arrow"
	| "arrow2"
	| "arrow3"
	| "bouncingBar"
	| "bouncingBall"
	| "smiley"
	| "monkey"
	| "hearts"
	| "clock"
	| "earth"
	| "material"
	| "moon"
	| "runner"
	| "pong"
	| "shark"
	| "dqpb"
	| "weather"
	| "christmas"
	| "grenade"
	| "point"
	| "layer"
	| "betaWave";

type AddedSpinnerName =
	| SpinnerName
	| "fingerDance"
	| "fistBump"
	| "soccerHeader"
	| "mindblown"
	| "speaker"
	| "orangePulse"
	| "bluePulse"
	| "orangeBluePulse"
	| "timeTravel"
	| "aesthetic";

interface Props {
	type?: AddedSpinnerName;
}

const Spinner: FC<Props> = ({ type = "dots" }) => {
	const [frame, setFrame] = useState(0);
	const spinner = spinners[type];

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((previousFrame) => {
				const isLastFrame = previousFrame === spinner.frames.length - 1;
				return isLastFrame ? 0 : previousFrame + 1;
			});
		}, spinner.interval);

		return () => {
			clearInterval(timer);
		};
	}, [spinner]);

	return <Text>{spinner.frames[frame]}</Text>;
};

export default Spinner;
