import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "740420",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let users = []




let currentUserId = 1;

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});




async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
  };

  async function userItems() {
    try {
        const result = await db.query("SELECT title FROM items JOIN users ON users.id = items.user_id WHERE user_id = $1", [currentUserId]);
        const items = result.rows.map((item) => item.title);
        console.log("Items:", items); 
        return items;
    } catch (error) {
        console.error("Error fetching user items:", error);
        throw error;
    }
}

app.get("/app", async (req, res) => {
  try {
      const items = await userItems(); 
      const currentUser = await getCurrentUser(); 

      res.render("index.ejs", {
          listTitle: "Today",
          listItems: items,
          currentUser: currentUser 
      });
  } catch (error) {
      console.error("Error rendering index:", error);
      res.status(500).send("Internal Server Error");
  }
});
app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const checkResult = await db.query("SELECT * FROM users WHERE email = $1" , [email])
  
  if(checkResult.rows.length > 0) {
    
    console.log("Email already registered");
  }else {
    const result =  await db.query("INSERT INTO users (email , password) VALUES ($1 , $2)" , [email , password]);
    res.render('index.ejs')
  
  
  }
  
  
  
  });
  
  app.post("/login", async (req, res) => {
    const email = req.body.username;
  const password = req.body.password;
  
  const result = await db.query("SELECT * FROM users WHERE email = $1" , [email]);
  
  
  try {
  if (result.rows.length > 0) {
    const user = result.rows[0];
    const storedPassword = user.password;

  
    if(password === storedPassword) {
      currentUserId = user.id;
      res.redirect('/app');
  
    }else {
      res.send('Wrong password');
  
    }
  }else {
      res.send("User not found");
    }
  }catch(err){
    console.log(err);
  }
  });  

  
  





app.post("/add",  async (req, res) => {
  const item = req.body.newItem;
  const user_id = getCurrentUser()

  try {
    await db.query("INSERT INTO items (title , user_id) VALUES ($1 , $2) " , [item , currentUserId]);
    res.redirect('/app');


  }catch (err) {
    console.log(err);
  }
});

app.post("/edit", async (req, res) => {

const item = req.body.updatedItemTitle;
const id = req.body.updatedItemId

try {

  await db.query("UPDATE items SET title  = ($1) WHERE id = ($2) " , [item , id]);
  res.redirect('/app')
}catch (err) {
  console.log(err);

}

});


app.post("/delete", async  (req, res) => {
  const id = req.body.deleteItemId;
  
try {
  await db.query("DELETE FROM items WHERE id = $1 " , [id]);
  res.redirect('/');
}catch (err) {
  console.log(err);
}

});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
