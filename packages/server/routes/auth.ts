import express from 'express'
import { Router } from 'express'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import crypto from 'crypto'
import { csrf } from '../csrf'
import db from '../db/db'

declare global {
    namespace Express {
        interface User {
            id: string
            username: string
        }
    }
}

/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
passport.use(
    new LocalStrategy(function verify(username, password, cb) {
        const getUser = db.users.findOne({
            where: {
                username: username,
            },
        })

        getUser.then(
            (user) => {
                if (user) {
                    crypto.pbkdf2(
                        password,
                        user.salt,
                        310000,
                        32,
                        'sha256',
                        function (err, hashedPassword) {
                            if (err) {
                                return cb(err)
                            }
                            if (
                                !crypto.timingSafeEqual(
                                    user.hashed_password,
                                    hashedPassword
                                )
                            ) {
                                return cb(null, false, {
                                    message: 'Incorrect username or password.',
                                })
                            }
                            return cb(null, {
                                id: user.id,
                                username: user.username,
                            })
                        }
                    )
                } else {
                    return cb(null, false, {
                        message: 'Incorrect username or password.',
                    })
                }
            },
            (reason) => {
                return cb(reason)
            }
        )
    })
)

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username })
    })
})

passport.deserializeUser(function (
    user: false | Express.User | null | undefined,
    cb
) {
    process.nextTick(function () {
        return cb(null, user)
    })
})

const router: Router = express.Router()

// Send CSRF token to view templates
router.use(function (req, res, next) {
    res.locals.csrfToken = csrf.generateToken(req)
    next()
})

/** GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML form, into which the user enters their
 * username and password.  When the user submits the form, a request will be
 * sent to the `POST /login/password` route.
 *
 * @openapi
 * /login:
 *   get:
 *     summary: Prompt the user to log in using a username and password
 *     responses:
 *       "200":
 *         description: Prompt.
 *         content:
 *           text/html:
 */
router.get('/login', function (req, res, next) {
    res.render('login')
})

/** POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 *
 * @openapi
 * /login/password:
 *   post:
 *     summary: Log in using a username and password
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: number
 *     responses:
 *       "302":
 *         description: Redirect.
 */
router.post(
    '/login/password',
    passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/login',
        failureMessage: true,
    })
)

/* POST /logout
 *
 * This route logs the user out.
 */
router.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err)
        }
        res.redirect('/login')
    })
})

/* GET /signup
 *
 * This route prompts the user to sign up.
 *
 * The 'signup' view renders an HTML form, into which the user enters their
 * desired username and password.  When the user submits the form, a request
 * will be sent to the `POST /signup` route.
 */
router.get('/signup', function (req, res, next) {
    res.render('signup')
})

/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */
router.post('/signup', function (req, res, next) {
    var salt = crypto.randomBytes(16)
    crypto.pbkdf2(
        req.body.password,
        salt,
        310000,
        32,
        'sha256',
        function (err, hashedPassword) {
            if (err) {
                return next(err)
            }
            const createUser = db.users.create({
                username: req.body.username,
                hashed_password: hashedPassword,
                salt,
            })

            createUser.then(
                (user) => {
                    if (user) {
                        req.login(
                            { id: user.id, username: user.username },
                            function (err) {
                                if (err) {
                                    return next(err)
                                }
                                res.redirect('/')
                            }
                        )
                    } else {
                        return next(new Error('Failed to register new user.'))
                    }
                },
                (reason) => {
                    return next(reason)
                }
            )
        }
    )
})

export default router
