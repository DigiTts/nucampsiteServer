const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');
const cors = require('./cors');

const router = express.Router();

router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const users = await User.find({});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(users);
    } catch (err) {
        next(err);
    }
});

router.post('/signup', cors.corsWithOptions, async (req, res) => {
    try {
        await User.register(
            new User({username: req.body.username}),
            req.body.password,
            async (err, user) => {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({err: err});
                } else {
                    if (req.body.firstname) {
                        user.firstname = req.body.firstname;
                    }
                    if (req.body.lastname) {
                        user.lastname = req.body.lastname;
                    }
                    await user.save();

                    passport.authenticate("local")(req, res, () => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json({ success: true, status: "Registration Successful" });
                    });
                }
            }
        );
    } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.json({ err: err });
    }
});

router.post('/login', cors.corsWithOptions, passport.authenticate('local', { session: false }), (req, res) => {
    const token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
});

router.get('/logout', cors.corsWithOptions, (req, res, next) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
    if (req.user) {
        const token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, token: token, status: 'You are successfully logged in!'});
    }
});

module.exports = router;
