import { visit } from './visitor';

import { getIgnoredStatements } from '@slangroom/ignored';
import { zencodeExec } from '@slangroom/shared';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

test('ast is correct with one statement', async () => {
	// Given I have a contract with one filesystems statement in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite'
Given I have a 'string' named 'nameOfTheFile'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
`;
	const data = {
		stringToWrite: 'hello world',
		nameOfTheFile: 'hello-world.txt',
	};
	// When I get the ignored statements of it
	const ignoreds = await getIgnoredStatements(contract, {
		data: data,
	});
	// and I generate AST of each of them
	const asts = ignoreds.map((x) => visit(x));
	// Then the result must contain only one item
	expect(asts).toHaveLength(1);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const ast = asts[0]!;
	// and its content must be "stringToWrite"
	expect(ast.content).toStrictEqual('stringToWrite');
	// and its filename must be "nameOfTheFile"
	expect(ast.filename).toStrictEqual('nameOfTheFile');
	// and the value indexed by its content in data must be data's stringToWrite
	expect(data[ast.content as 'stringToWrite']).toStrictEqual(data.stringToWrite);
	// and the value indexed by its filename in data must be data's nameOfTheFile
	expect(data[ast.filename as 'nameOfTheFile']).toStrictEqual(data.nameOfTheFile);
});

test('ast is correct with multiple statements', async () => {
	// Given I have a contract with multiple filesystems statements in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'stringToWrite0'
Given I have a 'string' named 'nameOfTheFile0'
Given I have a 'string' named 'stringToWrite1'
Given I have a 'string' named 'nameOfTheFile1'
Given I have a 'string' named 'stringToWrite2'
Given I have a 'string' named 'nameOfTheFile2'

Then I save the 'stringToWrite0' into the file 'nameOfTheFile0'
Then I save the 'stringToWrite1' into the file 'nameOfTheFile1'
Then I save the 'stringToWrite2' into the file 'nameOfTheFile2'
`;
	const data = {
		stringToWrite0: 'hello world0',
		nameOfTheFile0: 'hello-world0.txt',
		stringToWrite1: 'hello world1',
		nameOfTheFile1: 'hello-world1.txt',
		stringToWrite2: 'hello world2',
		nameOfTheFile2: 'hello-world2.txt',
	};
	// When I get the ignored statements of it
	const ignoreds = await getIgnoredStatements(contract, {
		data: data,
	});
	// and I generate AST of each of them
	const asts = ignoreds.map((x) => visit(x));
	// Then the result must contain 3 items
	expect(asts).toHaveLength(3);
	// and I get the first one
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const first = asts[0]!;
	// and the its content must be "stringToWrite0"
	expect(first.content).toStrictEqual('stringToWrite0');
	// and the its filename must be "nameOfTheFile"
	expect(first.filename).toStrictEqual('nameOfTheFile0');
	// and the value indexed by its content in data must be data's stringToWrite0
	expect(data[first.content as 'stringToWrite0']).toStrictEqual(data.stringToWrite0);
	// and the value indexed by its filename in data must be data's nameOfTheFile0
	expect(data[first.filename as 'nameOfTheFile0']).toStrictEqual(data.nameOfTheFile0);
	// and I get the second one
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const second = asts[1]!;
	// and the its content must be "stringToWrite0"
	expect(second.content).toStrictEqual('stringToWrite1');
	// and the its filename must be "nameOfTheFile"
	expect(second.filename).toStrictEqual('nameOfTheFile1');
	// and the value indexed by its content in data must be data's stringToWrite1
	expect(data[second.content as 'stringToWrite1']).toStrictEqual(data.stringToWrite1);
	// and the value indexed by its filename in data must be data's nameOfTheFile1
	expect(data[second.filename as 'nameOfTheFile1']).toStrictEqual(data.nameOfTheFile1);
	// and I get the third one
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const third = asts[2]!;
	// and the its content must be "stringToWrite2"
	expect(third.content).toStrictEqual('stringToWrite2');
	// and the its filename must be "nameOfTheFile"
	expect(third.filename).toStrictEqual('nameOfTheFile2');
	// and the value indexed by its content in data must be data's stringToWrite2
	expect(data[third.content as 'stringToWrite2']).toStrictEqual(data.stringToWrite2);
	// and the value indexed by its filename in data must be data's nameOfTheFile2
	expect(data[third.filename as 'nameOfTheFile2']).toStrictEqual(data.nameOfTheFile2);
});

test('keyholder works', async () => {
	// Given I have a contract with one filesystems statement in it
	const contract = `Rule unknown ignore
Given I have a 'string' named 'nameOfTheFile'

When I create the random object of '64' bits
When I rename the 'random_object' to 'stringToWrite'

Then I save the 'stringToWrite' into the file 'nameOfTheFile'
Then I print the 'stringToWrite'
Then I print the 'nameOfTheFile'
`;
	// and the params used in the contract
	const params = { data: { nameOfTheFile: 'hello-world.txt' } };
	// When I get the ignored statement of it
	const ignoreds = await getIgnoredStatements(contract, params);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const ast = visit(ignoreds[0]!);
	// And execute the contract
	const zout = await zencodeExec(contract, params);
	// And get the values of the identifiers pointed by filename and content of
	// the ignored statement
	const nameOfTheFile = zout.result[ast.filename] as string;
	const stringToWrite = zout.result[ast.content] as string;
	// And create /tmp/slangroom
	await fs.mkdir('/tmp/slangroom/', { recursive: true });
	// And open file named after nameOfTheFile for writing (and create if it
	// doesn't already exists
	const fh = await fs.open(path.resolve('/tmp/slangroom/', nameOfTheFile), 'w');
	// And write the value of stringToWrite to the file
	const { buffer } = await fh.write(stringToWrite);
	// Then the content of the file must be stringToWrite
	expect(buffer).toStrictEqual(stringToWrite);
});
