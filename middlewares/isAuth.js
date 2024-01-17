const isAuth=(req,res, next)=>{
    if(req.session.isAuth){
        next();
    }
    else
    {
        return res.send({
            status:401,
            message:"Session was Expired, Please Log In Again",
            
        })
    }
}
module.exports={isAuth};