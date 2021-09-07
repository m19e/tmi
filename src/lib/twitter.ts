import type Twitter from "twitter-lite";
import { getClient } from "../hooks";

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
