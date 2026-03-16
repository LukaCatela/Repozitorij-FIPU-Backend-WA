# Testovi za postman rute

## auth.js

#### Registracija

**POST** http://localhost:3000/api/auth/register

Body: raw
{
"FirstName": "",
"LastName": "",
"email": "",
"password": "",
"role": "student"
}

#### Login

**POST** http://localhost:3000/api/auth/login

Body: raw
{
"email": "",
"password": "",
}

#### Vrati usera

**GET** http://localhost:3000/api/auth/me
Headers:
key: Authorization
Value: Bearer _your token_

---

## profiles.js

#### izradi profil

**POST** http://localhost:3000/profiles/

Body: raw

{
"bio": "Student at FIPU",
"studyYear": 3,
"department": "Informatika",
"skills": ["JavaScript", "Vue", "MongoDB, Python, C++"],
"github": "https://github.com/",
"linkedin": "https://linkedin.com/in/",
"website": ""
}
