export const getDisplayTimeAgo = (created_at: string): string => {
	const dt = new Date(created_at);
	const diff_time = Date.now() - dt.getTime();
	const diff_sec = Math.floor(diff_time / 1000);
	const diff_min = Math.floor(diff_sec / 60);
	const diff_hour = Math.floor(diff_min / 60);
	const diff_day = Math.floor(diff_hour / 24);
	const diff_week = Math.floor(diff_day / 7);
	const diff_year = Math.floor(diff_day / 365);

	if (diff_year)
		return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
	if (diff_week) return `${dt.getMonth() + 1}/${dt.getDate()}`;
	if (diff_day) return `${diff_day}d`;
	if (diff_hour) return `${diff_hour}h`;
	if (diff_min) return `${diff_min}m`;
	if (diff_sec) return `${diff_sec}s`;

	return "now";
};
