require("dotenv").config();
const express = require("express");
const { PrismaClient } =  require('@prisma/client');
const path = require("path");
const session = require("express-session");
const { generateAndSaveQRCode, verifyToken } = require("./utils/topt");

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;

app.use("/qr", express.static(path.join(__dirname, "qr")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(
   session({
     secret: "your-secret-key", // A secret key used for signing the session ID cookie
     resave: false, // Prevents resaving session if it wasn't modified
     saveUninitialized: true, // Saves new sessions even if they're empty
     cookie: { maxAge: 60000 }, // Session expiry time (in milliseconds)
   })
 );

app.post("/register-totp", async (req, res) => {
   const {email} = req.body;
   if(!email) return res.status(400).send("Email is required");
   if(req.session) req.session.email = null;
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   
   const qrResult = await generateAndSaveQRCode(user.name);
   if(!qrResult) return res.status(500).send("please try again later");

   await prisma.user.update({
    where:{
        id:user.id,
        email:email
    },
    data:{
        secret:qrResult.secret
    }});
    req.session.email = email;
    return res.status(200).redirect(`/register-totp?filePath=${qrResult.filePath}`);
});

app.post("/verify",async (req,res)=>{
    const email = req.session.email;
    const {otp} = req.body;
    console.log(email,otp);
    
   if(!otp ) return res.status(400).send("Otp is required");
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   const verificationResult = await verifyToken(user.secret,otp);
   
   if(!verificationResult)  return res.status(401).send("unautharized");
   
   res.status(200).send("USer login sucecss");
})

app.get("/", async(req, res) => {
   const users = await prisma.user.findMany();
   res.render('index', { users  });
});

app.get("/register-totp", (req, res) => {
   const { filePath } = req.query;
   res.render('register-totp', { filePath,host:`http://localhost:${port}/` });
});

app.listen(port, () => console.log(`Server started on port ${port}`))

