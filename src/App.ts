import * as express from 'express'
import * as exsess from 'express-session'
import * as psprt from 'passport'
import * as Instgrm from 'passport-instagram'
import axios from 'axios'
import User from '../type/User'

const InstagramStrategy = Instgrm.Strategy;

const sess = {
    secret: 'sytr456-65tyrd-12wrt',
    resave: true,
    saveUninitialized: true
}

class App {
    public express

    constructor() {
        this.express = express();
        this.setPassInst()
        this.mountRoutes()
        this.express.set('view engine', 'pug')
    }

    private mountRoutes(): void {

        const router = express.Router()

        this.express.use('/', router)

        router.get('/', (req, res) => {
            res.render('login')
        })

        router.get('/auth/instagram', psprt.authenticate('instagram'))

        router.get('/auth/instagram/callback', psprt.authenticate('instagram', {
            successRedirect: '/users',
            failure: '/'
        }))

        router.get('/users', (req, res) => {
            axios.get(req.user.media)
                .then(function (response) {
                    const data = response.data.data;
                    let user = req.user;
                    user.images = data.map(img => img.images);
                    res.render('instagram', user)
                })
        })


        this.express.use('/users', (req, res, next) => {
            if (!req.user) {
                res.redirect('/')
            }
            next()
        })

    }

    private setPassInst(): void {

        this.express.use(exsess(sess))
        this.express.use(psprt.initialize())
        this.express.use(psprt.session())

        psprt.serializeUser((user, done) => {
            done(null, user)
        })
        psprt.deserializeUser((user, done) => {
            done(null, user)
        })


        psprt.use(new InstagramStrategy({
            clientID: "e33a936b699b4ffbb1226f0429acefd4",
            clientSecret: "f2ae2a598eff4a09ba3c5c672e4fefb8",
            callbackURL: "http://born.network:3000/auth/instagram/callback"
        }, (accessToken, refreshToken, profile, done) => {

            let user = <User>{};
            user.name = profile.displayName;
            user.homePage = profile._json.data.website;
            user.image = profile._json.data.profile_picture;
            user.bio = profile._json.data.bio;
            user.media = `https://api.instagram.com/v1/users/${profile.id}/media/recent/?access_token=${accessToken}&count=8`

            done(null, user)
        }))

    }

}

export default new App().express
