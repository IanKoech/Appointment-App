const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    //checks validity of token 
    try {
        const token = req.headers['authorization'].split(' ')[1];
        jwt.verify(token, process.JWT_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send(
                {
                    message: 'Authorization failed',
                    success: false
                 }
            );
        }else{
            req.body.userId = decoded.id;
            next(); 
        }
    })
    } catch (error) {
       return res.status(401).send({
            message: 'Auth failed',
            success: false 
       });
    }
    
}