import express from 'express';

export const router = express.Router();

router.use(function (_, __, next) {
	console.log('utilisation de la V2');
	next();
});

router.get('/', function (_, res) {
	res.send("let's go !!");
});
