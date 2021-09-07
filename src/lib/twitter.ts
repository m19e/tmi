import { getClient } from "../hooks";

export const postReply = async (params: {
	status: string;
	in_reply_to_status_id: string;
}): Promise<null | any> => {
	const client = getClient();

	try {
		await client.post("statuses/update", params);
		return null;
	} catch (error) {
		return error;
	}
};
