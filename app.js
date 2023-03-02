const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started listening...");
    });
  } catch (err) {
    console.log(`DB error ${err.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

// API - 1
app.post("/register", async (req, res) => {
  console.log("working...");
  const { username, name, password, location, gender } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(getQuery);
  console.log(dbResponse);
  if (dbResponse === undefined) {
    if (password.length > 5) {
      // Successful registration of the registrant
      const sqlQuery = `
                INSERT INTO
                    user (username, name, password, gender, location)
                VALUES (
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
                );
            `;
      await db.run(sqlQuery);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

// API - 2
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const getQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(getQuery);
  if (dbResponse !== undefined) {
    const checkPassword = await bcrypt.compare(password, dbResponse.password);
    if (checkPassword) {
      // Successful login of the user
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  } else {
    res.status(400);
    res.send("Invalid user");
  }
});

// API - 3
app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const getQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(getQuery);
  if (dbResponse !== undefined) {
    const checkPassword = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    if (checkPassword) {
      if (newPassword.length < 5) {
        // If the user provides new password with less than 5 characters
        res.status(400);
        res.send("Password is too short");
      } else {
        // Successful password update
        const sqlQuery = `
                        UPDATE
                            user
                        SET 
                            username = '${dbResponse.username}',
                            name = '${dbResponse.name}',
                            password = '${hashedPassword}',
                            gender = '${dbResponse.gender}',
                            location = '${dbResponse.location}'
                        WHERE username = '${username}';
                    `;
        await db.run(sqlQuery);
        res.send("Password updated");
      }
    } else {
      //If the user provides incorrect current password
      res.status(400);
      res.send("Invalid current password");
    }
  } else {
    res.status(400);
    res.send("Invalid user");
  }
});

module.exports = app;
