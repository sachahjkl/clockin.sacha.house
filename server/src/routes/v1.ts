import express from 'express';

export const router = express.Router();

router.use(function (_, __, next) {
	console.log('utilisation de la V1');
	next();
});

router.get('/', function (_, res) {
	res.send("let's go !!");
});
router.get('/1', function (_, res) {
	res.send("let's go !!");
});
router.get('/2', function (_, res) {
	res.send("let's go !!");
});
router.get('/3', function (_, res) {
	res.send("let's go !!");
});
router.get('/4', function (_, res) {
	res.send("let's go !!");
});
router.get('/5', function (_, res) {
	res.send("let's go !!");
});

