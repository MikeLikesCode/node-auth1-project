const router = require('express').Router();
const Users = require('../users/users-model');
const bcrypt = require('bcryptjs');
const { restricted, checkUsernameFree, checkPasswordLength, checkUsernameExists } = require('../auth/auth-middleware');

// Require `checkUsernameFree`, `checkUsernameExists` and `checkPasswordLength`
// middleware functions from `auth-middleware.js`. You will need them here!

/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }

  response on username taken:
  status 422
  {
    "message": "Username taken"
  }

  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */

router.post('/register', checkUsernameFree, checkPasswordLength, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const hash = bcrypt.hashSync(password, 8);
    const newUser = { username, password: hash };

    const user = await Users.add(newUser)
    res.status(200).json({
      user_id: user.user_id,
      username: user.username
    });
  }
  catch (err) {
    next(err)
  }
})

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status 200
  {
    "message": "Welcome sue!"
  }

  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */

router.post('/login', checkUsernameExists, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [existingUser] = await Users.findBy({ username });

    if (existingUser && bcrypt.compareSync(password, existingUser.password)) {
      req.session.chocolatechip = existingUser;
      res.json({
        message: `welcome ${existingUser.username}`
      })
    }
    else {
      next({ status: 401, message: 'invalid credentials' })
    }
  }
  catch (err) {
    next(err)
  }
})


/**
  3 [GET] /api/auth/logout

  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }

  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */

router.get('/logout', async (req, res, next) => {
  try {
    if (req.session.chocolatechip) {
      req.session.destroy(err => {
        if (err) {
          res.json({
            message: 'Error, you cannot leave'
          })
        }
        else {
          res.json({
            status: 200, message: 'logged out'
          })
        }
      })
    }
    else {
      res.json({
        status: 200, message: "no session"
      })
    }
  }
  catch (err) {
    next(err)
  }
})


// Don't forget to add the router to the `exports` object so it can be required in other modules
module.exports = router