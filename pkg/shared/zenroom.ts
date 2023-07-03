import { JsonableObject } from './jsonable';

import { zencode_exec } from '@slangroom/deps/zenroom';

/**
 * Output of execution of a contract in Zenroom.
 */
export type ZenroomResult = {
	result: string;
	logs: string;
};

/**
 * Zenroom parameters suitable for zencode_exec() (after each value's
 * been piped to JSON.stringify()).
 */
export type ZenroomParams = { data?: JsonableObject; keys?: JsonableObject };

/**
 * Like ZenroomParams, but each value's been piped into JSON.stringify().
 *
 * Also, the keys are readonly since it makes little sense to mutate
 * them after they're converted to JSON strings.
 */
export type ZenroomStringParams = { readonly [K in keyof ZenroomParams]?: string };

/**
 * A utility that converts each value in ZenroomParams to a JSON string
 * if possible.
 *
 * @param params is the ZenroomParams to be.
 * @returns params with each value converted to a JSON string, or
 * undefined if params' values are null or undefined.
 */
export const convZenParams = (params?: ZenroomParams): ZenroomStringParams => {
	// We remove readonly here, and at the end, we put it back due to
	// the return type.
	const ret: { -readonly [k in keyof ZenroomStringParams]: ZenroomStringParams[k] } = {};
	for (const k in params) {
		if (k == 'data' || k == 'keys') {
			if (params[k]) ret[k] = JSON.stringify(params[k]);
		}
	}
	// And while we are on it, let's freeze it.
	return ret;
};

/**
 * Executes a contract with provided parameters in Zenroom.
 *
 * @param contract is a zencode contract.
 * @param params is parameters to Zenroom.
 * @returns the output of Zenroom.
 */
export const zencodeExec = async (
	contract: string,
	params?: ZenroomParams
): Promise<ZenroomResult> => await zencode_exec(contract, convZenParams(params));
