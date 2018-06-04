# GetALift - BackEnd Documentation

In this document, you can learn everything about how to use and extend the
back-end side of the GetALift app.

## About this project

This project was made in an internship at the Malta University by [Argann BONNEAU](http://www.argann.me)

## Edit this documentation

If you want to edit this documentation, this is what you must do :

1.  First, you need to install [pandoc](http://pandoc.org/installing.html) in order to convert the Markdown file to HTML.
2.  Edit the markdown file `/docs/src/docs.md`
3.  Build the documentation using the script at `/docs/build.sh`.

> If you can't use the script, just launch the line in it in your terminal.

## Installation guide

There are two different installation method. The first one, and the simplest, is to use [docker](https://docs.docker.com/engine/installation/) and 
[docker-compose](https://docs.docker.com/compose/). The second is to set up everything by hand on your computer.

Whatever you chose, you need to clone the git repository first by using the following command :

`git clone [git repository url]` 

### With Docker

With this method, you don't even need anything pre-installed on your computer, except Docker _itself_. If you don't know how it works, maybe you can take a look
 at the [official documentation](https://docs.docker.com/).

1. Install [docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).
2. With a command line, go to the project folder.
3. Build and launch the project by using the following command : `docker-compose up --build` 
4. Open the _PHPMyAdmin_ panel, or use the mysql cli, and import the file `database.sql` into the database.
5. Maybe re-run Docker, by closing the previous `docker-compose` instance and relauching it.

Even if you can change that in the `Dockerfile` and the `docker-compose.yml`, the listening port for the app is `3000`.

If you want to manage the database, there is a _PHPMyAdmin_ service running at port `8080`.
The file docker-compose.yml set everything you need to log in to the database.

### Manually

This project is a very basic NodeJS project. If you don't want to work with Docker, you can follow these steps :

1. Install [NodeJS](https://nodejs.org) and [MySQL](https://www.mysql.com) on your computer.
2. Within MySQL, create a new Database, with a user that have full privileges in it.
3. Import the file `database.sql` into it.
4. In a console, at the root of the project, launch the command `npm install`.
5. Change the parameters in the file `config.js` and `index.js` in order to allow NodeJS to connect to the Database you created.
6. Launch the project with the command `node index.js`.

### API Documentation

All the project is stored in the main file `index.js`.

Every routes of the API is explained in this file. If you don't understand something, you probably need to see how NodeJS or ExpressJS works.
It's not hard at all :)

### Database Documentation

If you correctly imported the file `database.sql` into your database, every table and every column have comments.
With the PHPMyAdmin Panel, you can see every comments very quickly.
