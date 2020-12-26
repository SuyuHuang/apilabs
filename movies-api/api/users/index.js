import express from 'express';
import User from './userModel';
import jwt from 'jsonwebtoken';
import movieModel from "../movies/movieModel"
const router = express.Router(); // eslint-disable-line


function getpassword(pwd){
  　var reg =/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{5,}$/
  return reg.test(pwd); 
}
// Get all users
router.get('/', (req, res,next) => {
    User.find().then(users =>  res.status(200).json(users)).catch(next);
});

router.post('/', async (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).json({
      success: false,
      msg: 'Please pass username and password.',
    });
  }
  if (req.query.action === 'register') {
    await User.create(req.body).catch(next);
    if(!getpassword(req.body.password)){
      res.status(401).json({
        code: 402,
        msg: 'Wrong password format.'
      });
    }
    else{
    res.status(201).json({
      code: 201,
      msg: 'Successful created new user.',
    });
  }
  } else {
    const user = await User.findByUserName(req.body.username).catch(next);
      if (!user) return res.status(401).json({ code: 401, msg: 'Authentication failed. User not found.' });
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          const token = jwt.sign(user.username, process.env.SECRET);
          // return the information including token as JSON
          res.status(200).json({
            success: true,
            token: 'BEARER ' + token,
          });
        } else {
          res.status(401).json({
            code: 401,
            msg: 'Authentication failed. Wrong password.'
          });
        }
      });
    }
});

// register
router.post('/', (req, res,next) => {
        new User(req.body).save().then(user => res.status(200).json({success:true,token:"FakeTokenForNow"})).catch(next);
});

// Update a user
router.put('/:id',  (req, res) => {
    if (req.body._id) delete req.body._id;
     User.update({
      _id: req.params.id,
    }, req.body, {
      upsert: false,
    })
    .then(user => res.json(200, user));
});
router.post('/:userName/favourites', async (req, res, next) => {

  const newFavourite = req.body.id;
  const userName = req.params.userName;
  const movie = await movieModel.findByMovieDBId(newFavourite);
  const user = await User.findByUserName(userName);
  
  if(user.favourites.includes(movie._id)){
    res.status(402).json({
      success: false,
      msg: 'The movie has been added to the favourite.',
    });
  }
  else if (!req.body.id ||!movie) {
    res.status(401).json({
      success: false,
      msg: 'Please enter the valid id.',
    });
  }
  else{
    await user.favourites.push(movie._id);
    await user.save(); 
    res.status(201).json(user); 
  }

  


});

router.get('/:userName/favourites', (req, res, next) => {
  const userName = req.params.userName;
  User.findByUserName(userName).populate('favourites').then(
    user => res.status(201).json(user.favourites)
  ).catch(next);
});
export default router;