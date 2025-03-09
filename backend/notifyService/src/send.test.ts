'use strict';

import { assert, test } from 'vitest';

import { serialize, deserialize  } from './send';
import { Notification } from '@jackstenglein/chess-dojo-common/src/database/notification';


const cases: Notification[] = [
	// Game Comment
	{ type: "GAME_COMMENT" }
]

test('serialize/deserialize are symetric', () => {
	for (const notice of cases) {
		assert.deepStrictEqual(notice, deserialize(serialize(notice)));
	}
});
