const validator= require('validator');
const jwt=require('jsonwebtoken');
const nodemailer= require('nodemailer');

const cleanUpAndValidate= ({email, password, confirmPassword, username, name})=>{
 return new Promise((resolve, reject)=>{
    if(!name || !password || !email || !confirmPassword || !username){
        reject("Missing Credentilas. Make Sure All the Credentials")
    }
    if(password !== confirmPassword)
    {
        reject("Password and Confirm Password should be same")
    }
    if(typeof email !== "string") reject("Email is wrong")
    if(typeof password !== "string") reject("password is wrong")
    if(typeof confirmPassword !== "string") reject("confirmPassword is wrong")
    if(typeof username !== "string") reject("username is wrong")
    if(typeof name !== "string") reject("name is wrong")
    // if(email.includes("@")) reject("Email Is Wrong");
    if(!validator.isEmail(email)) reject("Email Is Wrong");
    resolve();
})


}
const generateJWTToken= (email)=>{
    const token=jwt.sign(email,process.env.SECRET_KEY );
    console.log(token);
    return token;
}
const sendVerificationEmail=({email, verificationToken})=>{
    const transpoter= nodemailer.createTransport({
        host:"smtp.gmail.com",
        port:465,
        secure:true,
        service:"gmail",
        auth:{
            user:"gurramnevilkumar@gmail.com",
            pass:"rxzq uqxy aunx gdym",

        }


    })
    const mailOptions={
        from:"gurramnevilkumar@gmail.com",
        to:email,
        subject:"Email Verification Code from Nevil Kumar",
        html:`Click <a href="http://localhost:8001/verifytoken/${verificationToken}">Here</a>`
    }
    transpoter.sendMail(mailOptions,(error, info)=>{
        if(error){
            console.log(error);
        }
        else
        {
            console.log("Email is Sucessfully Sent To :", email);
        }
    })
    

}

module.exports= {cleanUpAndValidate, generateJWTToken, sendVerificationEmail }