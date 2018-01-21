# Express-Admin
Express-admin for learning and works. This project can be used for anyone who learn or use nodejs/express.js

## Getting Started

When using or learning Express.js, you may be difficult in looking for a simple, ease of use project which handle your login/admin/permisson feature. It's which this project provide you. Its features contain:
* Login/logout/hash password with bcrypt, passport
* User Role and Permission for any request
* Winston log and log viewer
* UI for all function in EJS
The project's also helpful if you have a large system. For example: You can use it as a front-end (handle user/role) and use to request to others inside back-end server. Nodejs's good for highload web system.

I hope it can help you. Leave a github star if you like it.

### Quickstart:

You can download Express-Admin by directly download from github. Or you can use git command to clone it:

```
git clone https://github.com/minhtuan221/express-admin.git
```
Start project by 

```
cd express-admin
node server.js
```
Then server now running on localhost:8888 in your browser

### Installing

Before installing this project, you have to install Nodejs and npm. Then download project and run the following code:

```
cd your_project_folder
npm install
node server.js
```

For debug and development (use nodemon):
```
npm run startnode
```
Then server now running on localhost:8888 in your browser

## Usage

Explain designation of this system

### User Interface Url

* /home: Default page use as Welcome page
* /login: Page for user login
* /auth-api: Request to outside api to login
* /index: Default page after user logined
* /admin: Page to user-management, role/permisson control. You can add new user, new role, new permission here
* /admin/log: For log viewer
* /profile: Example profile

### Directories Specification:

* Server.js: File to start project (use node server.js)
* Config.js: Project's configuration place in config.js file. It contains config for database, default admin user, default email and list of permission.
* /server: Contain almost routers, server-side logic. You can request to other server here
* /views: Contain all template (use EJS)
* /db: Contain all database setup and services
* /public: bootstrap.css,js package

### Database Specification:

Project uses Sequellize ORM for nodejs, config in config file. By example, Sequellize use sqlite database but it's an ORM so it can change easily to MySQL or other sql database.

Database and log files are put outside project folder into a folder name 'db_express'. It will make sure no data lost when updating/replacing Project folder (Ex by 'puppet agent -t')

User table design:
```
{
    username: {type: Sequelize.STRING,unique: true},
    password: {type: Sequelize.STRING},
    displayName: {type:Sequelize.STRING},
    emails:{type:Sequelize.STRING},
    role:{type:Sequelize.STRING}
}
```
Role table design:
```
{
    role: {type: Sequelize.STRING}, //many permission connect to one role.
    permission: {type: Sequelize.STRING}, // each record in table stand for a connection
    permissionID:{type:Sequelize.STRING,unique:true}
}
```
## Authors

* **Tuan Nguyen Minh** - *Financer and Developer* - email: ntuan221@gmail.com

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

MIT License

Copyright (c) 2018 Minh Tuan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.




