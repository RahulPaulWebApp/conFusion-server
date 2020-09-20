const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorites.js');
const authenticate = require('../authenticate');
const cors = require('./cors');

var favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res)=>{ res.sendStatus(200) })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
        Favorites.findOne({user: req.user._id})
            .populate('user')
            .populate('dishes')
            .then(favorites => {
                res.json(favorites);
                res.status = 200;
                res.setHeader('Content-type','application/json');
            }, err => next(err) )
            .catch( err => next(err))
    })
    .put((req,res)=>{
        res.status = 403;
        res.end(' PUT request is not supported on the favorites end-point');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
        Favorites.findOne({user: req.user._id})        //Favorite list exists
            .then(favorites=>{
                if(favorites === null) {
                    Favorites.create({
                        user: req.user._id,
                        dishes: req.body
                    }) .then(favorites=>{
                        favorites.save()
                        .then(favorite=>{
                            Favorites.findById(favorite._id)
                            .populate('user')
                            .populate('dishes')
                            .then((favorite)=>{
                                res.json(favorite);
                                res.status = 200;
                                res.setHeader("Content-type", 'application/json');
                            }).catch(err=>next(err))
                        })
                        res.json(favorites);
                        res.status = 200;
                        res.setHeader('Content-type', 'application/json');
                    })
                }else {
                        const unique = req.body.filter((dish)=> favorites.dishes.indexOf(dish._id)<0)
                        favorites.dishes.push(...unique);
                        console.log(favorites);
                        res.json(favorites);
                        favorites.save()
                        .then(favorite=>{
                            Favorites.findById(favorite._id)
                            .populate('user')
                            .populate('dishes')
                            .then((favorite)=>{
                                res.json(favorite);
                                res.status = 200;
                                res.setHeader("Content-type", 'application/json');
                            }).catch(err=>next(err))
                        })
                        res.status = 200;
                        res.setHeader('Content-type', 'application/json');
                }
            }, err=> next(err))
            .catch(err=>next(err))
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req,res)=>{
        Favorites.remove({user: req.user._id})
        .then(favorite=>{
            Favorites.findById(favorite._id)
            .populate('user')
            .populate('dishes')
            .then((favorite)=>{
                res.json(favorite);
                res.status = 200;
                res.setHeader("Content-type", 'application/json');
            }).catch(err=>next(err))
        })
    })

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, authenticate.verifyUser,(req, res, next)=>{ res.sendStatus(200) })
    .get((req, res, next)=>{
        Favorites.findOne({user: req.user.id})
            .then((favorites)=>{
                if(!favorites) {
                    res.setHeader('Content-Type', "application/json");
                    res.status = 200;
                    return res.json({"exists": false, "favorites": favorites});
                } else {
                    if(favorites.dishes.indexOf(req.params.dishId)<0)
                        {
                            res.setHeader('Content-Type', "application/json");
                            res.status = 200;
                            return res.json({"exists": false, "favorites": favorites});
                        }
                        else {
                            res.setHeader('Content-Type', "application/json");
                            res.status = 200;
                            return res.json({"exists": true, "favorites": favorites});
                        }
                }
            },err=>next(err))
            .catch(err=> next(err))
    })
    .put((req, res)=>{
        res.status = 403;
        res.end('PUT request not supported on /favorites/' + req.params.dishId + " end-point");
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next)=>{
        Favorites.findOne({user: req.user._id})
            .then(favorites=>{
                console.log("req.params.dishId="+req.params.dishId);
                console.log("favorites.dishes.indexOf(req.params.dishId)>0="+favorites.dishes.indexOf(req.params.dishId));
                if(favorites === null){
                    Favorites.create({user: req.user._id, dishes: [req.params.dishId]})
                    .then(favorites=>{
                        favorites.save()
                            .then(favorite=>{
                                Favorites.findById(favorite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favorite)=>{
                                    res.json(favorite);
                                    res.status = 200;
                                    res.setHeader("Content-type", 'application/json');
                                }).catch(err=>next(err))
                            })
                    }).catch(err=>next(err))
                }else if(favorites.dishes !== null || favorites.dishes.indexOf(req.params.dishId)== -1){
                            favorites.dishes.push(req.params.dishId);
                            favorites.save()
                            .then(favorite=>{
                                Favorites.findById(favorite._id)
                                .populate('user')
                                .populate('dishes')
                                .then((favorite)=>{
                                    res.json(favorite);
                                    res.status = 200;
                                    res.setHeader("Content-type", 'application/json');
                                }).catch(err=>next(err))
                            })
                        }
                else {
                    res.status = 403;
                    res.end('Already Exists');
                }
                }, err=>next(err))
            .catch(err=>next(err))
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser,
        (req, res, next) => {
       Favorites.updateOne({user: req.user._id}, {$pull: {dishes: req.params.dishId}})
        .then(favorite=>{
            Favorites.findById(favorite._id)
            .populate('user')
            .populate('dishes')
            .then((favorite)=>{
                res.json(favorite);
                res.status = 200;
                res.setHeader("Content-type", 'application/json');
        }).catch(err=>next(err))
    })
   });
   

module.exports = favoriteRouter;