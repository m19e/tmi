export interface TrimmedList {
	id_str: string;
	name: string;
	owner: {
		id_str: string;
		screen_name: string;
		name: string;
	};
	mode: "public" | "private";
}
