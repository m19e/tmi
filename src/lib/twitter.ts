import type Twitter from "twitter-lite";

export const postReply = async (
	client: Twitter,
	params: {
		status: string;
		in_reply_to_status_id: string;
	}
): Promise<null | any> => {
	try {
		await client.post("statuses/update", params);
		return null;
	} catch (error) {
		return error;
	}
};

export const postDeleteTweet = async (
	client: Twitter,
	params: {
		id: string;
	}
): Promise<null | any> => {
	try {
		await client.post("statuses/destroy", params);
		return null;
	} catch (error) {
		return error;
	}
};
