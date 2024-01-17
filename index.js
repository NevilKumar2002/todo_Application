const express= require('express');
const app= express();
const PORT= 8001;
const mongoose= require('mongoose');
const jwt=require('jsonwebtoken');
require("dotenv").config();
const { cleanUpAndValidate, generateJWTToken, sendVerificationEmail } = require('./utils/authUtils');
const userModel = require('./models/userModel');
const sessionModel= require('./models/sessionModel');
const bcrypt = require('bcrypt');
const session = require("express-session");
const mongoDbsession = require("connect-mongodb-session")(session);
const validator = require("validator");
const { isAuth } = require("./middlewares/isAuth");
const todoModel = require('./models/todoModel');
const { JsonWebTokenError } = require('jsonwebtoken');
const MONGO_URI= "mongodb+srv://Kumar:1234567890@cluster0.y0tweds.mongodb.net/FirstDB"

app.use(express.static("public"));


//middlewares
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set("view engine", "ejs")
const store = new mongoDbsession({
    uri:MONGO_URI,
    collection: "sessions",
  });
// MongoDB Connection 
mongoose.connect(MONGO_URI)
.then(()=>{
    console.log("MongoDB connected successfully")
})
.catch((err)=>{
    console.log(err.message);
    console.log("Error connecting to MongoDB")
})
app.use(
    session({
      secret: "Hello World",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
  );

app.get("/",(req,res)=>{
    res.send("Welcome to Todo Application ")
})


app.get("/register",(req,res)=>{
    // res.send("Registration Page....")
     res.render("register")
} )
app.post("/register",async(req,res)=>{
    console.log(req.body)
   
   const {name, email, password, confirmPassword, username}= req.body;

    try{
        await cleanUpAndValidate({name, email, password, confirmPassword, username});
        // await userObj.save();
        // console.log("userObj--------->", userObj)
        // res.send("Registration Sucessful")
        console.log("UserModel", userModel)
    }
    catch(err){
        res.send({
            status:400,
            message:"Error",
            error:err,
        })
    }
    try{
        const userEmailExist= await userModel.findOne({email});
        // console.log("user Email Existes", userEmailExist)

        if(userEmailExist){
            return res.send({
                status:400,
                message:"User Already Registered",
               
            })
        }
        const usernameExist= await userModel.findOne({username});
        // console.log("user Name Existes", userEmailExist)

        if(usernameExist){
            return res.send({
                status:400,
                message:"User Already Registered",
               
            })
        }
        //hashing the password
        const hashedPassword = await bcrypt.hash( password,parseInt(process.env.SALT) );
        const hashedConfirmPassword= await bcrypt.hash( confirmPassword,parseInt(process.env.SALT) );
        const userObj = new userModel({
            //schema, bodyData
            name: name,
            email: email,
            username: username,
            password: hashedPassword,
            confirmPassword:hashedConfirmPassword,
          });
          const userDb = await userObj.save();
          // console.log("userObj", userObj)
          const verificationToken= generateJWTToken(email);
          console.log("verificationToken", verificationToken);
          sendVerificationEmail({email, verificationToken});
          
      
       

    }
    catch (error) {
        console.log(error);
        return res.send({
          status: 500,
          message: "Database error",
          error: error,
        });
      }

  
    if(userModel.findOne({isEmailAuthenticated}))
    {
      return res.redirect("/login");
    }
    else
    {
      res.send("Go to Your Gmail, Verify Your Email")
    }
})
app.get('/verifytoken/:id', async(req,res)=>{
  const token= req.params.id;
  console.log(token);
  jwt.verify(token, process.env.SECRET_KEY, async(err, email)=>{
    try{
      await userModel.findOneAndUpdate({email}, {isEmailAuthenticated: true});
      return res.send({
        status:200,
        message:"Email Is Authenticated. Please Go for Login Page",
       
      })

    }
    catch (error) {
      console.log(error);
      return res.send({
        status: 500,
        message: "Database error",
        error: error,
      });
      
    }
    
  })
  
})




app.get("/login", (req,res)=>{
    res.render("login")
})

app.post("/login", async(req,res)=>{
    // res.send("Login SucessFul")
    console.log("reqBody", req.body)
    const {loginId, password}= req.body;
    // console.log(loginId, password)
    if(!loginId || !password){
        res.send({
            status:400,
            message:"Missing Credentials",
        })
    }
    try{
        
        let userDb={};
        if(validator.isEmail(loginId)){
            userDb = await userModel.findOne({email:loginId});
        }
        else {
            userDb = await userModel.findOne({username:loginId});
          }
      
          if (!userDb) {
            return res.send({
              status: 400,
              message: "Login id not found, please register first",
            });
          }
       
          const isMatch = await bcrypt.compare(password, userDb.password);
       
          if (!isMatch) {
            return res.send({
              status: 400,
              message: "Password incorrect",
            });
          }
          req.session.isAuth = true;
          req.session.user = {
            userId: userDb._id,
            username: userDb.username,
            email: userDb.email,
          };
      
          return res.redirect("/dashboard");
        
        
      
    }
    catch(err){
        res.send({
            status:500,
            message:"Data Base Error",
            error:err,
        })
    }
   
    // console.log("Success")
    // try{
        // const userEmailExist= await userModel.findOne({email});
        // console.log("user Email Existes", userEmailExist)
    // }
    // catch(err){
    //     return res.send({
    //         status:400,
    //         message:err.message
    //     })
    // }
})
app.get("/dashboard", isAuth , async (req, res) => {
    // return res.send("Dashboard Page");
    const username = req.session.user.username;
  
    try{
      const todos= await todoModel.find({ username : username });
      // console.log("todos from dashboard", todos);
      return res.render("dashboard", { todos: todos });
    }
    catch(err){
      res.send({
        status:400,
        message:err.message,
      })
    }
    // res.render("dashboard")
  });


app.post("/logout",(req,res)=>{
    // res.send("Logout Functionality")
    // console.log(req)
    req.session.destroy((err)=>{
        if(err) throw err;
        
        return res.redirect("/login");
    })
    // return res.redirect("/login");
  })
  
app.post("/logout_from_all_devices",isAuth,async (req,res)=>{
    // res.send("Logout From all Devices Functionality")
    // console.log("logout all devices",req.session.user.username);
  const username = req.session.user.username;
//   console.log(username)

  //delete all the session created by owner.

  try {
    const deleteSessionsCount = await sessionModel.deleteMany({
      "session.user.username": username,
    });

    console.log(deleteSessionsCount);

    return res.redirect("/login");
  } catch (error) {
    return res.send("Logout unsuccessfull");
  }
  })

app.post('/create-item',isAuth,async(req,res)=>{
    const todoText= req.body.todo;
    // console.log("TodoText", todoText)
    const username= req.session.user.username;
    if(!todoText){
        return res.send({
            status: 400,
            message: "Missing todo text",
          });
    }
    if(typeof todoText !== 'string'){
        return res.send({
            status: 400,
            message: "Entered Todo Is not a String",
          });
    }
    if (todoText.length < 3 || todoText.length > 100) {
        return res.send({
          status: 400,
          message: "Todo length should be 3 to 100 characters only",
        });
      }
    
    const todoObj= new todoModel({
        todo:todoText,
        username:username,
    })
    try{
        const todoDb= await todoObj.save();
        
        // return res.send({
        //     status: 201,
        //     message: "Todo created successfully",
          
           
        //   });
        // alert("Todo created successfully");
        return res.redirect('/dashboard');
         
    }
    catch(err){
        res.send({
            status:500,
            message:"Data Base Error",
            error:err,
        })
    }

    
})
app.post('/edit-item', isAuth, async(req,res)=>{
  const { id, newTodo } = req.body;
  // console.log("Edit item", req.body)
  if (!id || !newTodo) {
    return res.send({
      status: 400,
      message: "Missing credentials",
    });
  }
  
  if (newTodo.length < 3 || newTodo.length > 50) {
    return res.send({
      status: 400,
      message: "Todo length should be in range of 3-50 chars",
    });
  }
  try {
    const todoDb = await todoModel.findOne({ _id: id });
    if (!todoDb) {
      return res.send({
        status: 400,
        message: "Todo not found",
      });
    }

    //check ownership
    if (todoDb.username !== req.session.user.username) {
      return res.send({
        status: 401,
        message: "Not allowed to edit, authorization failed",
      });
    }
    const todoPrev = await todoModel.findOneAndUpdate(
      { _id: id },
      { todo: newTodo }
    );
    return res.send({
      status: 200,
      message: "Todo updated successfully",
      data: todoPrev,
    });
  }
  catch(err){
    res.send({
       status: 404, 
       message: err.message
    });
  }

})
app.post('/delete-item',isAuth,async(req,res)=>{
const {id}=req.body;
// console.log(id);
// console.log("USERNAME", USERNAME);
console.log(req.body);

if(!id){
  return res.send({
    status: 400,
    message: "Todo will going to delete",
  });
}
try{
  const todoDb = await todoModel.findOne({ _id: id });
  // console.log("todoDb",todoDb); // its working
  // console.log("req.body.user.username", req.session.user.username)
  if (!todoDb) {
    return res.send({
      status: 400,
      message: "Todo not found",
    });
  }
// console.log("todoUserName", todoDb.username);
// console.log("req,session.username", req.session.user.username)
if(todoDb.username !== req.session.user.username){
  return res.send({
    status: 401,
    message: "Not allowed to delete, authorization failed",
  });
}
// console.log(todoModel)
const todoPrev = await todoModel.findOneAndDelete({ _id: id });

// console.log("todoPrev",todoPrev);
return res.send({
  status: 200,
  message: "Todo deleted successfully",
  data: todoPrev,
});
}
catch(err){
  return res.send({
    status:500,
    message:err.message
  })
}


})
app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`);
})
