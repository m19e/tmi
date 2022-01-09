export const arrayRotate = <T>(input: T[], n: number): T[] => {
	const x = input.slice();
	return x.splice(-n % x.length).concat(x);
};
