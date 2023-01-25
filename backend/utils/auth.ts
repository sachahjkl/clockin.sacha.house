import { BaseUser, EncryptedUser } from '../user/user.model';

import { db } from './db';
import jwt from 'jsonwebtoken';

export async function userFromAuthorization(authorization: string) {
	const [_bearer, token] = authorization.split(' ');
	try {
		const user = await verifyJWTToken(token);
		if (user) {
			console.log('User found !', user);
		}
		return user;
	} catch (error) {
		console.log('No user to be found.');
		console.error(error);
	}
	return null;
}

/**
 *
 * @param {string} token token de session JWT chiffré contenant un utilisateur
 * @returns un utilisateur ou `null`
 */
export async function verifyJWTToken(token: string | null): Promise<BaseUser | null> {
	if (!token) return null;

	const SECRET = process.env.JWT_SECRET;

	if (!SECRET) throw new Error('JWT Signing key not found !');
	try {
		const data = jwt.verify(token, SECRET) as EncryptedUser;
		const user = await db.user.findFirst({
			where: {
				id: data.id
			}
		});

		return user;
	} catch (err) {
		throw new Error('Invalid token');
	}
}
/**

 * @param user
 * @returns un token de session JWT de l'utilisateur `user`
 *
 * @example
 * const user = await db.user.findFirst({where : {id: 1}})
 * const {passwordHash: _, ...partialUser} = user;
 * const sessionToken = await createSesssion(partialUser);
 * req.headers.authorization = `Bearer ${sessionToken}`;
 */

export const createSession = async (user: EncryptedUser) => {
	const SECRET = process.env.JWT_SECRET;
	if (!SECRET) return;
	const data: EncryptedUser = { id: user.id, username: user.username };
	const token = jwt.sign(data, SECRET, {
		expiresIn: '15d'
	});

	return token;
};
